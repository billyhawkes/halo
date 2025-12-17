import { Effect } from "effect";
import { Docker } from "./docker";
import type { ResourceConfig } from "../halo";
import { FileSystem, Path } from "@effect/platform";

export class Resources extends Effect.Service<Resources>()("app/Resource", {
	effect: Effect.gen(function* () {
		const docker = yield* Docker;
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;

		const directory = path.resolve(".halo");

		// Ensure the .halo directory exists
		const exists = yield* fs.exists(directory);
		if (!exists) {
			yield* fs
				.makeDirectory(directory)
				.pipe(Effect.tap(() => Effect.log("Created .halo directory")));
		}

		// Read or create the config file
		const configPath = path.join(directory, "config.json");
		let config: {
			resources: ResourceConfig[];
		};
		const configExists = yield* fs.exists(configPath);
		if (configExists) {
			const contents = yield* fs
				.readFileString(configPath)
				.pipe(Effect.tap(() => Effect.log("Read config file")));
			config = JSON.parse(contents);
		} else {
			config = {
				resources: [
					{
						name: "halo-caddy",
						package: "caddy",
						ports: ["80:80", "443:443"],
						volumes: [`${directory}:/etc/caddy`],
					},
				],
			};

			yield* fs
				.writeFileString(configPath, JSON.stringify(config))
				.pipe(Effect.tap(() => Effect.log("Created config file")));
		}

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

		const resource = (options: ResourceConfig) =>
			Effect.sync(() => {
				config.resources.push(options);
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
						yield* docker.stop(service.name);
						yield* docker.remove(service.name);
						yield* docker.run(service);
					}).pipe(
						Effect.tap(() =>
							Effect.log(`Deployed ${service.name}`),
						),
					),
			);

		const commit = () =>
			Effect.gen(function* () {
				// Caddy
				const content = config.resources
					.filter((s) => s.domain)
					.map((service) => {
						const hostPort = service.ports[0]?.split(":")[1];
						return `${service.domain} {
	reverse_proxy ${service.name}:${hostPort}
}
`;
					})
					.join("\n");

				const caddyPath = path.join(directory, "Caddyfile");

				yield* fs.writeFileString(caddyPath, content);
				yield* fs.writeFileString(configPath, JSON.stringify(config));
			}).pipe(Effect.tap(() => Effect.log("Committed")));

		return {
			get,
			resource,
			commit,
			deploy,
		};
	}),
	dependencies: [Docker.Default],
}) {}
