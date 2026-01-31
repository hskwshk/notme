import type { KnipConfig } from "knip";

const config: KnipConfig = {
	entry: [
		"scripts/**",
		"db/**",
		"public/sw.js",
		"components/me-panel.tsx",
		"components/push-test-card.tsx",
		"components/secure-message-form.tsx",
		"hooks/use-notification-service.ts",
	],
	ignoreDependencies: ["postcss"],
};

export default config;
