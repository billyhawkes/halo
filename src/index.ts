import { Halo } from "./halo";

const halo = Halo({
	domain: "halo-test.halocdn.com",
	s3: {
		bucket: "halo-test",
		region: "us-east-1",
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});

export const main = async () => {
	//const database = halo.database({
	//	dialect: "postgres",
	//	backups: {
	//		schedule: "0 0 * * *",
	//		bucket: "halo-test",
	//	},
	//});

	halo.service({
		name: "recordscratch",
		domain: "test.recordscratch.app",
		package: "ghcr.io/hackthebois/recordscratch:latest",
		port: "3000:3000",
	});

	// Handles webhooks, deployments, and other events
	await halo.run();
};

main();
