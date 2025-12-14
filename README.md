# Halo

Typescript based infrastructure as code tool. The goal is to run services, databases, and have continuous deployment configured entirely by typescript. The API is inspired by SST and Coolify.

## Structure
- Proxy & SSL: Caddy
- Container Orchestration: Docker
- Server: Bun (Handles redeployments, api, eventually UI)

## API (CURRENT)

```ts
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
```

## API (FUTURE)

```ts
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
	const database = halo.database({
		dialect: "postgres",
		backups: {
			schedule: "0 0 * * *",
			bucket: "halo-test",
		},
	});

	halo.service({
		name: "recordscratch",
		domain: "test.recordscratch.app",
		package: "ghcr.io/hackthebois/recordscratch:latest",
		ports: ["3000:3000"],
		env: {
			DATABASE_URL: database.url,
		}
	});

	// Handles webhooks, deployments, and other events
	await halo.run();
};

main();
```
