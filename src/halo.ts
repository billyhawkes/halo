import { Effect } from "effect";
import { listen } from "./utils/listen";
import { app } from "./router";
import { Resources } from "./services/resources";
import { BunContext } from "@effect/platform-bun";
import { Config } from "./services/config";

export type ResourceConfig = {
	name: string;
	package: string;
	ports: string[];
	domains?: string[];
	volumes?: string[];
	env?: Record<string, string | undefined>;
	envFile?: string;
};

export const Halo = async () =>
	await Effect.runPromise(
		Effect.gen(function* () {
			const resources = yield* Resources;

			const resource = (options: ResourceConfig) =>
				Effect.runPromise(resources.resource(options));

			const run = async () => listen(app, 8156);

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
