import { relations } from "drizzle-orm";
import {
	bigint,
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	characterName: text("character_name"),
	level: bigint("level", { mode: "number" }).default(1).notNull(),
	currentStreak: bigint("current_streak", { mode: "number" })
		.default(0)
		.notNull(),
	maxStreak: bigint("max_streak", { mode: "number" }).default(0).notNull(),
	maxMinutes: bigint("max_minutes", { mode: "number" }).default(0).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const files = pgTable("files", {
	id: text("id").primaryKey().notNull(),
	bucket: varchar("bucket", { length: 255 }).notNull(),
	key: varchar("key", { length: 1024 }).notNull(),
	contentType: varchar("content_type", { length: 255 }).notNull(),
	size: bigint("size", { mode: "number" }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }),
	uploadedAt: timestamp("uploaded_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const pushSubscription = pgTable(
	"push_subscription",
	{
		id: text("id").primaryKey().notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		endpoint: text("endpoint").notNull(),
		p256dh: text("p256dh").notNull(),
		auth: text("auth").notNull(),
		expirationTime: bigint("expiration_time", { mode: "number" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("push_subscription_userId_idx").on(table.userId),
		uniqueIndex("push_subscription_userId_endpoint_idx").on(
			table.userId,
			table.endpoint,
		),
	],
);

export const dailyGoal = pgTable("daily_goal", {
	id: text("id").primaryKey().notNull(),
	title: text("title").notNull(),
	imageUrl: text("image_url"),
	description: text("description"),
	footer: text("footer"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const userDailyGoal = pgTable(
	"user_daily_goal",
	{
		id: text("id").primaryKey().notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		goalId: text("goal_id")
			.notNull()
			.references(() => dailyGoal.id, { onDelete: "cascade" }),
		date: text("date").notNull(), // YYYY-MM-DD
		isViewed: boolean("is_viewed").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("user_daily_goal_userId_idx").on(table.userId),
		uniqueIndex("user_daily_goal_userId_date_idx").on(table.userId, table.date),
	],
);

export const activityLog = pgTable(
	"activity_log",
	{
		id: text("id").primaryKey().notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		date: text("date").notNull(), // YYYY-MM-DD
		durationMinutes: bigint("duration_minutes", { mode: "number" }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("activity_log_userId_idx").on(table.userId),
		index("activity_log_date_idx").on(table.date),
	],
);

export const appNotification = pgTable(
	"app_notification",
	{
		id: text("id").primaryKey().notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		isRead: boolean("is_read").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("app_notification_userId_idx").on(table.userId)],
);

export const dailyQuote = pgTable("daily_quote", {
	id: text("id").primaryKey().notNull(),
	content: text("content").notNull(),
	author: text("author"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	pushSubscriptions: many(pushSubscription),
	dailyGoals: many(userDailyGoal),
	activityLogs: many(activityLog),
	notifications: many(appNotification),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const pushSubscriptionRelations = relations(
	pushSubscription,
	({ one }) => ({
		user: one(user, {
			fields: [pushSubscription.userId],
			references: [user.id],
		}),
	}),
);

export const userDailyGoalRelations = relations(userDailyGoal, ({ one }) => ({
	user: one(user, {
		fields: [userDailyGoal.userId],
		references: [user.id],
	}),
	goal: one(dailyGoal, {
		fields: [userDailyGoal.goalId],
		references: [dailyGoal.id],
	}),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
	user: one(user, {
		fields: [activityLog.userId],
		references: [user.id],
	}),
}));

export const appNotificationRelations = relations(
	appNotification,
	({ one }) => ({
		user: one(user, {
			fields: [appNotification.userId],
			references: [user.id],
		}),
	}),
);
