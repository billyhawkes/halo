import {
	HttpMiddleware,
	HttpRouter,
	HttpServer,
	HttpServerResponse,
} from "@effect/platform";
import { Effect, Schema } from "effect";
import { Resources } from "./services/resources";
import { Config } from "./services/config";
import { Home } from "./routes/home";

const Params = Schema.Struct({
	name: Schema.String,
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
	HttpRouter.use(HttpMiddleware.logger),
);

// Set up the application server with logging
export const app = router.pipe(HttpServer.serve(), HttpServer.withLogAddress);
