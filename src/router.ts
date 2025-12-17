import {
	HttpMiddleware,
	HttpRouter,
	HttpServer,
	HttpServerResponse,
} from "@effect/platform";
import { Effect, Schema } from "effect";
import { Resources } from "./services/resources";
import { BunContext } from "@effect/platform-bun";
import { Config } from "./services/config";

const Params = Schema.Struct({
	name: Schema.String,
});

// Define the router with a single route for the root URL
const router = HttpRouter.empty.pipe(
	HttpRouter.get(
		"/",
		Effect.gen(function* () {
			yield* Effect.log("Hello World");
			return yield* HttpServerResponse.text("Hello World");
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
		}).pipe(
			Effect.provide(Resources.Default),
			Effect.provide(Config.Default),
			Effect.provide(BunContext.layer),
		),
	),
	HttpRouter.use(HttpMiddleware.logger),
);

// Set up the application server with logging
export const app = router.pipe(HttpServer.serve(), HttpServer.withLogAddress);
