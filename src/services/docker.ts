import { HttpApiError } from "@effect/platform";
import type { ResourceConfig } from "../halo";
import { Effect, Schema } from "effect";
import { Config } from "./config";

const InspectSchema = Schema.Struct({
	State: Schema.Struct({
		Status: Schema.String,
	}),
});

const dockerClient = (url: string, options?: RequestInit) =>
	Effect.tryPromise(() =>
		fetch(`http://localhost${url}`, {
			...options,
			unix: "/var/run/docker.sock",
		}),
	).pipe(
		Effect.andThen((res) => {
			if (res.status === 400) {
				return new HttpApiError.BadRequest();
			}
			if (res.status === 404) {
				return new HttpApiError.NotFound();
			}
			if (res.status === 409) {
				return new HttpApiError.Conflict();
			}
			if (!res.ok) {
				return new HttpApiError.InternalServerError();
			}
			return Effect.succeed(res);
		}),
		Effect.tap((res) =>
			Effect.log(`Fetched ${res.url} with status ${res.status}`),
		),
	);

export class Docker extends Effect.Service<Docker>()("app/Docker", {
	effect: Effect.gen(function* () {
		const { config } = yield* Config;

		const image = {
			pull: (image: string) =>
				dockerClient(
					`/images/create?fromImage=${encodeURIComponent(image)}`,
					{
						method: "POST",
						headers: {
							"X-Registry-Auth": Buffer.from(
								JSON.stringify(config.root.auth),
							).toString("base64"),
						},
					},
				).pipe(Effect.tap(() => Effect.log(`Pulled ${image}`))),
		};

		const container = {
			stop: (name: string) =>
				dockerClient(`/containers/${name}/stop`, {
					method: "POST",
				}).pipe(Effect.tap(() => Effect.log(`Stopped ${name}`))),
			status: (name: string) =>
				dockerClient(`/containers/${name}/json`).pipe(
					Effect.flatMap((res) =>
						Effect.tryPromise(() => res.json()),
					),
					Effect.flatMap((json) =>
						Schema.decodeUnknown(InspectSchema)(json),
					),
					Effect.map(({ State }) => State.Status),
					Effect.catchTag("NotFound", () =>
						Effect.succeed("not-found"),
					),
					Effect.tap(() =>
						Effect.log(`Retrieved status for ${name}`),
					),
				),
			remove: (name: string) =>
				dockerClient(`/containers/${name}`, {
					method: "DELETE",
				}).pipe(Effect.tap(() => Effect.log(`Removed ${name}`))),
			run: (service: ResourceConfig) =>
				Effect.gen(function* () {
					yield* dockerClient(
						`/containers/create?name=${service.name}`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								Image: service.package,
								Env: Object.entries(service.env ?? {}).map(
									([k, v]) => `${k}=${v}`,
								),
								ExposedPorts: Object.fromEntries(
									service.ports?.map((p) => [p, {}]) ?? [],
								),
								HostConfig: {
									NetworkMode: "halo",
									Binds: service.volumes,
								},
							}),
						},
					).pipe(
						Effect.tap(() => Effect.log(`Started ${service.name}`)),
					);
					yield* dockerClient(`/containers/${service.name}/start`, {
						method: "POST",
					});
				}),
			logs: (
				name: string,
				options?: {
					timestamps?: boolean;
				},
			) =>
				dockerClient(
					`/containers/${name}/logs?stdout=true&stderr=true&timestamps=${options?.timestamps ? options.timestamps : false}`,
				).pipe(Effect.map((res) => res.body)),
		};

		return {
			image,
			container,
		};
	}),
}) {}
