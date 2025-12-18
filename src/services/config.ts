import { FileSystem, Path } from "@effect/platform";
import type { ResourceConfig } from "../halo";
import { Effect } from "effect";

export class Config extends Effect.Service<Config>()("app/Config", {
	effect: Effect.gen(function* () {
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
						default: true,
					},
				],
			};

			yield* fs
				.writeFileString(configPath, JSON.stringify(config))
				.pipe(Effect.tap(() => Effect.log("Created config file")));
		}

		const commit = (newConfig: { resources: ResourceConfig[] }) =>
			Effect.gen(function* () {
				// Caddy
				const content = newConfig.resources
					.filter((s) => s.domains && s.domains.length > 0)
					.flatMap((service) => {
						const hostPort = service.ports[0]?.split(":")[1];
						return service.domains!.map(
							(domain) =>
								`${domain} {\n    reverse_proxy ${service.name}:${hostPort}\n}\n`,
						);
					})
					.join("\n");

				const caddyPath = path.join(directory, "Caddyfile");

				yield* fs.writeFileString(caddyPath, content);

				// Configuration
				yield* fs.writeFileString(
					configPath,
					JSON.stringify(newConfig),
				);
				config = newConfig;
			});

		return {
			...config,
			commit,
		};
	}),
}) {}
