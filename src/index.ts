import { Halo } from "./halo";

export const main = async () => {
	const halo = await Halo();

	halo.service({
		name: "recordscratch",
		domain: "test.recordscratch.app",
		package: "ghcr.io/hackthebois/recordscratch:latest",
		ports: ["3000:3000"],
	});

	await halo.run();
};

main();
