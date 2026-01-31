import type { KnipConfig } from "knip";

const config: KnipConfig = {
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
