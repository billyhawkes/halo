import { Halo } from "./halo";

export const main = async () => {
	const halo = await Halo();

	halo.resource({
		name: "recordscratch",
		domains: ["test.recordscratch.app", "test2.recordscratch.app"],
		package: "ghcr.io/hackthebois/recordscratch:latest",
		ports: ["3000:3000"],
	});

	await halo.run();
};

main();
