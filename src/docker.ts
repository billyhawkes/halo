import { $ } from "bun";
import type { ServiceConfig } from "./halo";
import { Data, Effect, pipe } from "effect";

export class DockerError extends Data.TaggedError("DockerError")<{
	message: string;
	cause?: unknown;
}> {}

export class Docker extends Effect.Service<Docker>()("app/Docker", {
	effect: Effect.gen(function* () {
		const command = (args: string[]) =>
			Effect.tryPromise({
				try: () => $`docker ${args}`.quiet(),
				catch: (e) =>
					new DockerError({
						message: `Failed to run: docker ${args.join(" ")}`,
						cause: e,
					}),
			});

		const running = (name: string) =>
			pipe(
				command(["inspect", "-f", "'{{.State.Running}}'", name]),
				Effect.map((result) => result.text().trim() === "true"),
				Effect.tap(() => Effect.log(`Inspected ${name}`)),
			);

		const pull = (image: string) =>
			pipe(
				command(["pull", image]),
				Effect.tap(() => Effect.log(`Pulled ${image}`)),
			);

		const remove = (name: string) =>
			pipe(
				command(["rm", "-f", name]),
				Effect.tap(() => Effect.log(`Removed ${name}`)),
			);

		const run = (service: ServiceConfig) =>
			Effect.gen(function* () {
				yield* remove(service.name);
				yield* pull(service.package);

				yield* pipe(
					command([
						"run",
						"-d",
						"--rm",
						"--network=halo",
						...["--name", service.name],
						...(service.volumes?.flatMap((v) => ["-v", v]) ?? []),
						...(service.ports?.flatMap((p) => ["-p", p]) ?? []),
						service.package,
					]),
					Effect.tap(() => Effect.log(`Started ${service.name}`)),
				);
			});

		return {
			running,
			pull,
			remove,
			run,
		};
	}),
}) {}

export const getDocker = async () => {
	return Effect.runPromise(Docker.pipe(Effect.provide(Docker.Default)));
};
