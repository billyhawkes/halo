import { $ } from "bun";
import type { ServiceConfig } from "./halo";

export const Docker = () => {
	const running = async (name: string): Promise<boolean> => {
		const result = await $`docker inspect -f '{{.State.Running}}' '${name}'`
			.nothrow()
			.quiet();

		return result.exitCode === 0 && result.text().trim() === "true";
	};

	const pull = async (image: string) => {
		await $`docker pull ${image}`.quiet();
	};

	const run = async (service: ServiceConfig) => {
		try {
			await $`docker network create halo`.quiet();
		} catch (e) {}

		await $`docker rm -f ${service.name}`.quiet();

		const volumes = service.volumes?.flatMap((v) => ["-v", v]) ?? [];

		await $`docker run -d --rm --network halo --name ${service.name} -p ${service.port} ${volumes} ${service.package}`.quiet();

		console.log("Service running:", service.name);
	};

	return {
		running,
		pull,
		run,
	};
};
