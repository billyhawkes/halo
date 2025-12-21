import { rootStyles } from "./root-styles";

type NavItem = {
	name: string;
	href: string;
	current?: boolean;
};

export const RootLayout = ({
	children,
	title,
	breadcrumbs = [],
	tabs = [],
}: {
	children: JSX.Element;
	title?: string;
	breadcrumbs?: NavItem[];
	tabs?: NavItem[];
}) => (
	<>
		{"<!doctype html>"}
		<html>
			<head>
				<title>Halo {title ? `- ${title}` : ""}</title>
				<meta charset="UTF-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0"
				/>
				<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
				<link
					rel="stylesheet"
					href="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.7/dist/basecoat.cdn.min.css"
				/>
				<script
					src="https://cdn.jsdelivr.net/npm/basecoat-css@0.3.7/dist/js/all.min.js"
					defer
				></script>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossorigin=""
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap"
					rel="stylesheet"
				/>

				<link rel="icon" type="image/png" href="/logo.png" />
				<script
					type="module"
					src="https://cdn.jsdelivr.net/gh/starfederation/datastar@1.0.0-RC.7/bundles/datastar.js"
				></script>
				<style type="text/tailwindcss">{rootStyles}</style>
				<style type="text/css">
					{`
					html {
						font-family: "Lato", sans-serif;
					}`}
				</style>
				<script src="https://unpkg.com/lucide@latest"></script>
			</head>
			<body>
				<header class="p-4 flex flex-col gap-2 border-b border-border">
					<div class="flex items-center gap-2">
						<a href="/" class="flex items-center gap-2">
							<img src="/logo.png" alt="Halo" class="size-12" />
							<p class="text-lg font-bold">Halo</p>
						</a>
						<ol class="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5">
							{breadcrumbs.map(({ name, href, current }) => (
								<>
									<li>
										<i
											data-lucide="chevron-right"
											class="size-4"
										></i>
									</li>
									<li class="inline-flex items-center gap-1.5">
										<a
											href={href}
											class={
												current
													? "text-foreground font-normal"
													: "hover:text-foreground transition-colors"
											}
											safe
										>
											{name}
										</a>
									</li>
								</>
							))}
						</ol>
					</div>
					<nav class="flex gap-2">
						{tabs.map((tab) => (
							<a
								class={
									tab.current
										? "btn-sm-secondary"
										: "btn-sm-ghost"
								}
								href={tab.href}
								safe
							>
								{tab.name}
							</a>
						))}
					</nav>
				</header>
				{children}
				<script>{`lucide.createIcons();`}</script>
			</body>
		</html>
	</>
);
