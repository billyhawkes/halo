import path from "path";
import { Docker, getDocker } from "./docker";
import { Effect } from "effect";

export type Config = {};

export type ServiceConfig = {
	name: string;
	package: string;
	ports: string[];
	domain?: string;
	volumes?: string[];
};

export type DatabaseConfig = {};

export type ResourceGraph = {
	services: ServiceConfig[];
};

export const Halo = async (_: Config = {}) => {
	const directory = path.join(__dirname, "../.halo");
	const docker = await getDocker();

	const resources: ResourceGraph = {
		services: [
			{
				name: "halo-caddy",
				package: "caddy",
				ports: ["80:80", "443:443"],
				volumes: [`${directory}:/etc/caddy`],
			},
		],
	};

	const service = (options: ServiceConfig) => {
		resources.services.push(options);
	};

	const database = (options: DatabaseConfig) => {
		console.log("database", options);
	};

	const run = async () => {
		const caddyFile = Bun.file(directory + "/Caddyfile");

		console.log("Running services");
		for (const service of resources.services) {
			const hostPort = service.ports[0]?.split(":")[1];
			const caddy = `${service.domain} {
	reverse_proxy ${service.name}:${hostPort}
}
`;
			await Effect.runPromise(docker.run(service));

			caddyFile.write(caddy);
		}
	};

	return {
		service,
		database,
		run,
	};
};
