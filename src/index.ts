import { Halo } from "./halo";

export const main = async () => {
	const halo = await Halo({
		auth: {
			username: "billyhawkes",
			password: process.env.GH_PAT,
			serveraddress: "ghcr.io",
		},
	});

	halo.resource({
		name: "recordscratch",
		description: "Music rating app",
		domains: ["test.recordscratch.app", "test2.recordscratch.app"],
		package: "ghcr.io/hackthebois/recordscratch:latest",
		ports: ["3000:3000"],
		env: process.env,
	});

	halo.run();
};

await main();
