# Halo

Typescript based infrastructure as code tool. The goal is to run services, databases, and have continuous deployment configured entirely by typescript. 

This tool is inspired by SST's library and Coolify's rich ecosystem.

## Structure
1. Library: declaring services in typescript
2. Manager: server and dashboard for observing and managing services

## Tools
- Proxy & SSL: Caddy
- Container Orchestration: Docker (Other options in the future)
- Server: Effect HttpServer
- Dashboard: Datastar, Kita HTML, Tailwindcss

## Features

### Proxy
- [x] Caddy server
- [x] Automated caddy configuration and running

### Container Management
- [x] Docker pull/run
- [x] Environment variables
- [ ] Always up deployments (Interface and docker swarm implementation)
- [ ] Databases (automated backups, sqlite w/litestream?)

### Server
- [x] Redeployment
- [ ] Webhook authentication
- [ ] Root domain

### Services
- [ ] Otel (Grafana? ClickStack?)

### Dashboard
- [ ] Authentication (Master pass)
- [ ] Resources (Logs, redeploy, status)


## API (CURRENT)

```ts
import { Halo } from "./halo";


export const main = async () => {
	// Initialization
	const halo = await Halo();

	// Resource Declaration
	halo.resource({
		name: "recordscratch",
		domain: "test.recordscratch.app",
		package: "ghcr.io/hackthebois/recordscratch:latest",
		ports: ["3000:3000"],
		env: {
			DATABASE_URL: database.url,
		}
	});

	await halo.run();
};

main();
```

## API (FUTURE)

```ts
import { Halo } from "./halo";


export const main = async () => {
	// Global Configuration and Domains (Future)
	const halo = await Halo({
		domain: "halo-test.halocdn.com",
		s3: {
			bucket: "halo-test",
			region: "us-east-1",
			accessKeyId: process.env.AWS_ACCESS_KEY_ID,
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		},
	});

	// Database Declaration (Future)
	const database = halo.database({
		dialect: "postgres",
		backups: {
			schedule: "0 0 * * *",
			bucket: "halo-test",
		},
	});

	// Resource Declaration (Complete)
	halo.resource({
		name: "recordscratch",
		domain: "test.recordscratch.app",
		package: "ghcr.io/hackthebois/recordscratch:latest",
		ports: ["3000:3000"],
		env: {
			DATABASE_URL: database.url,
		}
	});

	// Server with Dashboard (Work in progress)
	await halo.run();
};

main();
```
