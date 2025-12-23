import type { ResourceConfig } from "../halo";
import { Data, Effect, Match, Schema } from "effect";
import { Config } from "./config";

const InspectSchema = Schema.Struct({
	State: Schema.Struct({
		Status: Schema.String,
	}),
});

type DockerErrorData = {
	url: string;
	status: number;
	message: string;
};

const DockerErrorSchema = Schema.Struct({
	message: Schema.String,
});

class DockerBadRequest extends Data.TaggedError(
	"DockerBadRequest",
)<DockerErrorData> {}
class DockerForbidden extends Data.TaggedError(
	"DockerForbidden",
)<DockerErrorData> {}
class DockerNotFound extends Data.TaggedError(
	"DockerNotFound",
)<DockerErrorData> {}
class DockerConflict extends Data.TaggedError(
	"DockerConflict",
)<DockerErrorData> {}
class DockerInternalServerError extends Data.TaggedError(
	"DockerInternalServerError",
)<DockerErrorData> {}

const dockerClient = (url: string, options?: RequestInit) =>
	Effect.tryPromise(() =>
		fetch(`http://localhost${url}`, {
			...options,
			unix: "/var/run/docker.sock",
		}),
	).pipe(
		Effect.flatMap((res) =>
			Effect.gen(function* () {
				if (!res.ok) {
					const body = yield* Effect.tryPromise(() =>
						res.json(),
					).pipe(
						Effect.flatMap((json) =>
							Schema.decodeUnknown(DockerErrorSchema)(json),
						),
					);

					const errorData = {
						url,
						message: body.message,
						status: res.status,
					} satisfies DockerErrorData;

					return yield* Match.value(res.status).pipe(
						Match.when(400, () =>
							Effect.fail(new DockerBadRequest(errorData)),
						),
						Match.when(403, () =>
							Effect.fail(new DockerForbidden(errorData)),
						),
						Match.when(404, () =>
							Effect.fail(new DockerNotFound(errorData)),
						),
						Match.when(409, () =>
							Effect.fail(new DockerConflict(errorData)),
						),
						Match.orElse(() =>
							Effect.fail(
								new DockerInternalServerError(errorData),
							),
						),
					);
				}
				return yield* Effect.succeed(res);
			}),
		),
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
					Effect.catchTag("DockerNotFound", () =>
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
					stderr?: boolean;
					stdout?: boolean;
				},
			) => {
				const {
					timestamps = false,
					stderr = true,
					stdout = true,
				} = options ?? {};

				const searchParams = new URLSearchParams({
					timestamps: String(timestamps),
					stdout: String(stdout),
					stderr: String(stderr),
				});
				return dockerClient(
					`/containers/${name}/logs` + `?${searchParams.toString()}`,
				).pipe(Effect.map((res) => res.body));
			},
		};

		return {
			image,
			container,
		};
	}),
}) {}
