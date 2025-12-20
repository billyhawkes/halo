import { Effect, Layer } from "effect";
import { listen } from "./utils/listen";
import { app } from "./router";
import { Resources } from "./services/resources";
import { BunContext } from "@effect/platform-bun";
import { Config } from "./services/config";

export type RootConfig = {
	auth?: {
		username: string;
		password: string;
		serveraddress: string;
	};
};

export type ResourceConfig = {
	name: string;
	description?: string;
	package: string;
	ports: string[];
	domains?: string[];
	volumes?: string[];
	env?: Record<string, string | undefined>;
	envFile?: string;
	default: boolean;
};

export const Halo = async (rootConfig?: RootConfig) =>
	await Effect.runPromise(
		Effect.gen(function* () {
			const resources = yield* Resources;
			const { config, commit } = yield* Config;

			yield* commit({
				...config,
				root: rootConfig,
			});

			const resource = (options: Omit<ResourceConfig, "default">) =>
				Effect.runPromise(resources.resource(options));

			const run = () => {
				const AppLive = app.pipe(
					Layer.provide(Resources.Default),
					Layer.provide(Config.Default.pipe(Layer.orDie)),
					Layer.provide(BunContext.layer),
				);

				listen(AppLive, 8156);
			};

			return {
				resource,
				run,
			};
		}).pipe(
			Effect.provide(Resources.Default),
			Effect.provide(Config.Default),
			Effect.provide(BunContext.layer),
		),
	);
