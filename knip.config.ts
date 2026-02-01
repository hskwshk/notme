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
	ignore: [
		"components/me-panel.tsx",
		"components/push-test-card.tsx",
		"components/secure-message-form.tsx",
		"db/reset-goal.ts",
		"db/seed-daily-goals.ts",
		"db/seed-home.ts",
		"hooks/use-notification-manager.ts",
		"public/sw.js",
	],
};

export default config;
