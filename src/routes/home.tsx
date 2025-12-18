import { RootLayout } from "../layouts/root";

export const Home = (name: string) =>
	(
		<RootLayout>
			<main>
				<h1>Hello World 3</h1>
				<p safe>Hello {name}</p>
			</main>
		</RootLayout>
	) as string;
