import path from "path";
import { Docker } from "./docker";

export type Config = {};

export type ServiceConfig = {
	name: string;
	package: string;
	port: string;
	domain?: string;
	volumes?: string[];
};

export type DatabaseConfig = {};

export type ResourceGraph = {
	services: ServiceConfig[];
};

export const Halo = (config: Config = {}) => {
	const directory = path.join(__dirname, "../.halo");
	const docker = Docker();
	const resources: ResourceGraph = {
		services: [],
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
			const caddy = `${service.domain} {
	reverse_proxy ${service.name}:${service.port.split(":")[1]}
}
`;
			await docker.pull(service.package);
			await docker.run(service);

			caddyFile.write(caddy);
		}

		await docker.run({
			name: "halo-caddy",
			package: "caddy",
			port: "80:80",
			volumes: [`${directory}:/etc/caddy`],
		});
	};

	return {
		service,
		database,
		run,
	};
};
