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
	username: text("username").unique(),
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
	totalDuration: bigint("total_duration", { mode: "number" })
		.default(0)
		.notNull(),
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
		isStampViewed: boolean("is_stamp_viewed").default(false).notNull(),
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

// Existing relations removed to avoid duplication - moved to userGamificationRelations

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

export const stamp = pgTable("stamp", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	imageUrl: text("image_url").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const userStamp = pgTable(
	"user_stamp",
	{
		id: text("id").primaryKey().notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		stampId: text("stamp_id")
			.notNull()
			.references(() => stamp.id, { onDelete: "cascade" }),
		isFavorite: boolean("is_favorite").default(false).notNull(),
		favoriteOrder: bigint("favorite_order", { mode: "number" }),
		obtainedAt: timestamp("obtained_at").defaultNow().notNull(),
	},
	(table) => [
		index("user_stamp_userId_idx").on(table.userId),
		uniqueIndex("user_stamp_userId_stampId_idx").on(
			table.userId,
			table.stampId,
		),
	],
);

export const missionNotification = pgTable(
	"mission_notification",
	{
		id: text("id").primaryKey().notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		missionType: text("mission_type").notNull(), // e.g. "stretch", "squat"
		notifiedAt: timestamp("notified_at").defaultNow().notNull(),
		isCompleted: boolean("is_completed").default(false).notNull(),
		completedAt: timestamp("completed_at"),
		expiresAt: timestamp("expires_at").notNull(), // 5 mins after notification
	},
	(table) => [index("mission_notification_userId_idx").on(table.userId)],
);

export const userStampRelations = relations(userStamp, ({ one }) => ({
	user: one(user, {
		fields: [userStamp.userId],
		references: [user.id],
	}),
	stamp: one(stamp, {
		fields: [userStamp.stampId],
		references: [stamp.id],
	}),
}));

export const missionNotificationRelations = relations(
	missionNotification,
	({ one }) => ({
		user: one(user, {
			fields: [missionNotification.userId],
			references: [user.id],
		}),
	}),
);

export const userGamificationRelations = relations(user, ({ many }) => ({
	userStamps: many(userStamp),
	missionNotifications: many(missionNotification),
	// Extend existing relations
	sessions: many(session),
	accounts: many(account),
	pushSubscriptions: many(pushSubscription),
	dailyGoals: many(userDailyGoal),
	activityLogs: many(activityLog),
	notifications: many(appNotification),
	exerciseSessions: many(exerciseSession),
	friendships: many(friendship, { relationName: "user_friendships" }),
}));

export const friendship = pgTable(
	"friendship",
	{
		id: text("id").primaryKey().notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		friendId: text("friend_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		status: text("status").notNull().default("pending"), // pending, accepted
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("friendship_userId_idx").on(table.userId),
		index("friendship_friendId_idx").on(table.friendId),
		uniqueIndex("friendship_userId_friendId_idx").on(
			table.userId,
			table.friendId,
		),
	],
);

export const friendshipRelations = relations(friendship, ({ one }) => ({
	user: one(user, {
		fields: [friendship.userId],
		references: [user.id],
		relationName: "user_friendships",
	}),
	friend: one(user, {
		fields: [friendship.friendId],
		references: [user.id],
		relationName: "user_friends_of",
	}),
}));

export const exerciseSession = pgTable(
	"exercise_session",
	{
		id: text("id").primaryKey().notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		startTime: timestamp("start_time").notNull(),
		durationSeconds: bigint("duration_seconds", { mode: "number" }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("exercise_session_userId_idx").on(table.userId),
		index("exercise_session_startTime_idx").on(table.startTime),
	],
);

export const exerciseSessionRelations = relations(
	exerciseSession,
	({ one }) => ({
		user: one(user, {
			fields: [exerciseSession.userId],
			references: [user.id],
		}),
	}),
);
