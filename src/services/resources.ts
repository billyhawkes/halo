import { Effect } from "effect";
import { Docker } from "./docker";
import type { ResourceConfig } from "../halo";
import { Config } from "./config";

export class Resources extends Effect.Service<Resources>()("app/Resource", {
	effect: Effect.gen(function* () {
		const docker = yield* Docker;
		const { config, commit } = yield* Config;

		const get = (name: string) =>
			Effect.gen(function* () {
				const service = config.resources.find((s) => s.name === name);
				if (!service) {
					return yield* Effect.fail(
						new Error(`Service ${name} not found`),
					);
				}
				return yield* Effect.succeed(service);
			});

		const resource = (options: Omit<ResourceConfig, "default">) =>
			commit({
				...config,
				resources: [
					...config.resources.filter((s) => s.name !== options.name),
					{ ...options, default: false },
				],
			}).pipe(
				Effect.tap(() =>
					Effect.log(`Registered service ${options.name}`),
				),
			);

		const deploy = (resource?: ResourceConfig) =>
			Effect.forEach(
				resource ? [resource] : config.resources,
				(service) =>
					Effect.gen(function* () {
						yield* docker.pull(service.package);

						const status = yield* docker.status(service.name);
						yield* Effect.log(`State: ${status}`);
						if (status === "running") {
							yield* docker.stop(service.name);
						}

						if (status !== "not-found") {
							yield* docker.remove(service.name);
						}

						yield* docker.run(service);
					}).pipe(
						Effect.tap(() =>
							Effect.log(`Deployed ${service.name}`),
						),
					),
			);

		return {
			get,
			resource,
			deploy,
		};
	}),
	dependencies: [Docker.Default],
}) {}
