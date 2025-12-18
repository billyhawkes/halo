import type { ResourceConfig } from "../halo";
import { RootLayout } from "../layouts/root";

const Resource = ({ resource }: { resource: ResourceConfig }) => {
	const tags = [resource.package, resource.default && "Default"].filter(
		Boolean,
	);
	return (
		<a class="card" href={`/resources/${resource.name}`}>
			<header>
				<h2 safe>{resource.name}</h2>
				{resource.description ? (
					<p safe>{resource.description}</p>
				) : null}
			</header>
			{tags.length > 0 && (
				<section class="flex gap-2">
					{tags.map((tag) => (
						<div class="badge" safe>
							{tag}
						</div>
					))}
				</section>
			)}
		</a>
	);
};

export const Home = ({ resources }: { resources: ResourceConfig[] }) =>
	(
		<RootLayout>
			<main class="flex flex-col gap-4 p-4">
				{resources.map((resource) => (
					<Resource resource={resource} />
				))}
			</main>
		</RootLayout>
	) as string;
