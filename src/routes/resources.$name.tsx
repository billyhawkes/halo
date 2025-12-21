import type { ResourceConfig } from "../halo";
import { RootLayout } from "../layouts/root";

export const ResourcePage = ({ resource }: { resource: ResourceConfig }) =>
	(
		<RootLayout
			title={resource.name}
			breadcrumbs={[
				{
					name: resource.name,
					href: `/resources/${resource.name}`,
					current: true,
				},
			]}
			tabs={[
				{
					name: "Overview",
					href: `/resources/${resource.name}`,
					current: true,
				},
				{ name: "Logs", href: `/resources/${resource.name}/logs` },
			]}
		>
			<main class="flex flex-col gap-4 p-4"></main>
		</RootLayout>
	) as string;
