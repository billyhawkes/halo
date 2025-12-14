import { Halo } from "./halo";

const halo = Halo();

export const main = async () => {
	halo.service({
		name: "recordscratch",
		domain: "test.recordscratch.app",
		package: "ghcr.io/hackthebois/recordscratch:latest",
		ports: ["3000:3000"],
	});

	await halo.run();
};

main();
