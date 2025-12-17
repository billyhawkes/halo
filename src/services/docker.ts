import { $ } from "bun";
import type { ResourceConfig } from "../halo";
import { Data, Effect, pipe } from "effect";

export class ShellError extends Data.TaggedError("ShellError")<{
	message: string;
	stdout: string;
	stderr: string;
	exitCode: number;
}> {}

export class Docker extends Effect.Service<Docker>()("app/Docker", {
	effect: Effect.gen(function* () {
		const command = (args: string[]) =>
			Effect.tryPromise(() => $`docker ${args}`.nothrow().quiet()).pipe(
				Effect.flatMap(({ stdout, stderr, exitCode }) => {
					if (exitCode !== 0) {
						return Effect.fail(
							new ShellError({
								message: `Failed to run: docker ${args.join(" ")}`,
								stdout: stdout.toString(),
								stderr: stderr.toString(),
								exitCode,
							}),
						);
					}

					return Effect.succeed(stdout.toString());
				}),
			);

		const status = (name: string) =>
			pipe(
				command(["inspect", "-f", "'{{.State.Running}}'", name]),
				Effect.map((result) =>
					result.trim() === "true" ? "running" : "stopped",
				),
				Effect.catchTag("ShellError", (e) =>
					Effect.gen(function* () {
						if (e.stderr.includes("No such object")) {
							return yield* Effect.succeed("removed" as const);
						}
						return yield* Effect.fail(e);
					}),
				),
				Effect.tap((status) =>
					Effect.log(`Retrieved status for ${name}: ${status}`),
				),
			);

		const stop = (name: string) =>
			pipe(
				command(["stop", name]),
				Effect.tap(() => Effect.log(`Stopped ${name}`)),
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

		const run = (service: ResourceConfig) =>
			pipe(
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

		return {
			status,
			stop,
			pull,
			remove,
			run,
		};
	}),
}) {}
