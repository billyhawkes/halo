import { Effect } from "effect";
import { listen } from "./utils/listen";
import { app } from "./router";
import { Resources } from "./services/resources";
import { BunContext } from "@effect/platform-bun";

export type Config = {};

export type ResourceConfig = {
	name: string;
	package: string;
	ports: string[];
	domain?: string;
	volumes?: string[];
};

export const Halo = async (_: Config = {}) =>
	await Effect.runPromise(
		Effect.gen(function* () {
			const resources = yield* Resources;

			const resource = (options: ResourceConfig) =>
				Effect.runSync(resources.resource(options));

			const run = async () =>
				Effect.runPromise(
					Effect.gen(function* () {
						yield* resources.commit();
						yield* resources.deploy();
						listen(app, 8156);
					}),
				);

			return {
				resource,
				run,
			};
		}).pipe(
			Effect.provide(Resources.Default),
			Effect.provide(BunContext.layer),
		),
	);
