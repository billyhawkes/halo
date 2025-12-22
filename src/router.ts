import {
	HttpMiddleware,
	HttpRouter,
	HttpServer,
	HttpServerRequest,
	HttpServerResponse,
} from "@effect/platform";
import { Effect, Schema, Stream } from "effect";
import { Resources } from "./services/resources";
import { Config } from "./services/config";
import { Home } from "./routes/home";
import { ResourcePage } from "./routes/resources.$name";
import { ResourceLogsPage } from "./routes/resources.$name.logs";
import { Docker } from "./services/docker";

const Params = Schema.Struct({
	name: Schema.String,
});

const LogSearchParams = Schema.Struct({
	datastar: Schema.String,
});

// Define the router with a single route for the root URL
const router = HttpRouter.empty.pipe(
	HttpRouter.get(
		"/:path",
		Effect.gen(function* () {
			const path = yield* HttpRouter.schemaPathParams(
				Schema.Struct({
					path: Schema.String,
				}),
			);

			return yield* HttpServerResponse.file("public/" + path.path);
		}),
	),
	HttpRouter.get(
		"/",
		Effect.gen(function* () {
			const { config } = yield* Config;

			return yield* HttpServerResponse.html(
				Home({
					resources: config.resources,
				}),
			);
		}),
	),
	HttpRouter.get(
		"/deploy/:name",
		Effect.gen(function* () {
			const resources = yield* Resources;
			const params = yield* HttpRouter.schemaPathParams(Params);
			const resource = yield* resources.get(params.name);
			yield* resources.deploy(resource);

			return yield* HttpServerResponse.text(
				`Successfully deployed ${params.name}!`,
			);
		}).pipe(),
	),
	HttpRouter.get(
		"/resources/:name",
		Effect.gen(function* () {
			const resources = yield* Resources;
			const params = yield* HttpRouter.schemaPathParams(Params);
			const resource = yield* resources.get(params.name);

			return yield* HttpServerResponse.html(
				ResourcePage({
					resource,
				}),
			);
		}),
	),
	HttpRouter.get(
		"/resources/:name/logs",
		Effect.gen(function* () {
			const resources = yield* Resources;
			const params = yield* HttpRouter.schemaPathParams(Params);
			const resource = yield* resources.get(params.name);

			return yield* HttpServerResponse.html(
				ResourceLogsPage({
					resource,
				}),
			);
		}),
	),
	HttpRouter.get(
		"/resources/:name/logs/stream",
		Effect.gen(function* () {
			const resources = yield* Resources;
			const docker = yield* Docker;
			const params = yield* HttpRouter.schemaPathParams(Params);
			const logParams =
				yield* HttpServerRequest.schemaSearchParams(LogSearchParams);
			const resource = yield* resources.get(params.name);

			const query = JSON.parse(logParams.datastar);

			yield* Effect.log(query);

			const stream = yield* docker.container.logs(resource.name, {
				timestamps: query.timestamps,
			});

			const encoder = new TextEncoder();
			const decoder = new TextDecoder();
			const out = Stream.fromReadableStream({
				evaluate: () => stream!,
				onError: (err) => err,
			}).pipe(
				Stream.map((s) => {
					let text = decoder.decode(s);
					text = text
						.replace(/[\x00-\x09\x0B-\x1F]/g, "")
						.split("\n")
						.map(
							(line) =>
								`data: elements <pre>${line.slice(1).trim()}</pre>\n`,
						)
						.join("");
					console.log(text);
					return encoder.encode(
						`event: datastar-patch-elements\ndata: selector #logs\ndata: mode inner\n${text}\n`,
					);
				}),
			);

			return yield* HttpServerResponse.stream(out, {
				contentType: "text/event-stream",
			});
		}),
	),
	HttpRouter.use(HttpMiddleware.logger),
);

// Set up the application server with logging
export const app = router.pipe(HttpServer.serve(), HttpServer.withLogAddress);
