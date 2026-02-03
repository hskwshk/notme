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
		"components/notice-card.tsx",
		"components/site-header.tsx",
		"components/top.tsx",
		"server/services/streak.ts",
		"server/objects/stamp.ts",
		"lib/auth-actions.ts",
	],
};

export default config;
