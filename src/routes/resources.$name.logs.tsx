import type { ResourceConfig } from "../halo";
import { RootLayout } from "../layouts/root";

export const ResourceLogsPage = ({ resource }: { resource: ResourceConfig }) =>
	(
		<RootLayout
			title={resource.name}
			breadcrumbs={[
				{
					name: resource.name,
					href: `/resources/${resource.name}`,
				},
				{
					name: "Logs",
					href: `/resources/${resource.name}/logs`,
					current: true,
				},
			]}
			tabs={[
				{
					name: "Overview",
					href: `/resources/${resource.name}`,
				},
				{
					name: "Logs",
					href: `/resources/${resource.name}/logs`,
					current: true,
				},
			]}
		>
			<main
				class="flex flex-col gap-4 p-4"
				data-signals="{ timestamps: false }"
			>
				<div class="flex gap-4">
					<label
						for="timestamps"
						data-class:btn-sm-secondary="!$timestamps"
						data-class:btn-sm="$timestamps"
					>
						<i
							data-lucide="clock"
							class="size-4 text-muted-foreground"
						></i>
						Timestamps
					</label>
					<input
						id="timestamps"
						type="checkbox"
						data-bind="timestamps"
						class="hidden"
					/>
				</div>
				<pre
					id="logs"
					class="flex flex-col p-4 rounded-lg bg-muted text-foreground"
					data-init={`@get("/resources/${resource.name}/logs/stream")`}
					data-effect={`$timestamps; @get("/resources/${resource.name}/logs/stream")`}
				></pre>
			</main>
		</RootLayout>
	) as string;
