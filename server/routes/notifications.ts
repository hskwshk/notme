import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { appNotification, friendship } from "@/db/schema";
import {
	createGetPushSubscriptionStatus,
	createRegisterPushSubscription,
	createRemovePushSubscription,
} from "@/server/applications/usecases/push-subscription";
import { createSendPushNotificationToUser } from "@/server/applications/usecases/send-push-notification";
import { createHonoApp } from "@/server/create-app";
import { createPushNotificationRepository } from "@/server/infrastructure/repositories/push-notification";
import { createPushSubscriptionRepository } from "@/server/infrastructure/repositories/push-subscription";
import { getUserOrThrow } from "@/server/middleware/auth";
import { PushNotification } from "@/server/objects/push-notification";
import { PushSubscription } from "@/server/objects/push-subscription";

const endpointQuerySchema = z.object({
	endpoint: z.string().url(),
});

const app = createHonoApp()
	.get("/", async (c) => {
		const { user } = await getUserOrThrow(c);
		const db = c.get("db");

		// 1. Fetch Incoming Follow Requests
		const followRequests = await db.query.friendship.findMany({
			where: and(
				eq(friendship.friendId, user.id),
				eq(friendship.status, "pending"),
			),
			with: {
				user: {
					columns: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
			orderBy: desc(friendship.createdAt),
		});

		// 2. Fetch General Notifications
		const generalNotifications = await db.query.appNotification.findMany({
			where: eq(appNotification.userId, user.id),
			orderBy: desc(appNotification.createdAt),
		});

		return c.json({
			followRequests,
			generalNotifications,
		});
	})
	.post(
		"/subscriptions",
		zValidator("json", PushSubscription.schema),
		async (c) => {
			const { user } = await getUserOrThrow(c);
			const payload = c.req.valid("json");
			const repository = createPushSubscriptionRepository(c.get("db"));
			const registerSubscription = createRegisterPushSubscription(
				repository.saveSubscription,
			);
			const saved = await registerSubscription(user.id, payload);

			return c.json({
				subscriptionId: saved.id,
			});
		},
	)
	.get(
		"/subscriptions",
		zValidator("query", endpointQuerySchema),
		async (c) => {
			const { user } = await getUserOrThrow(c);
			const { endpoint } = c.req.valid("query");
			const repository = createPushSubscriptionRepository(c.get("db"));
			const getStatus = createGetPushSubscriptionStatus(
				repository.findSubscriptionByEndpointAndUserId,
			);
			const status = await getStatus(user.id, endpoint);

			return c.json(status);
		},
	)
	.delete(
		"/subscriptions",
		zValidator("query", endpointQuerySchema),
		async (c) => {
			const { user } = await getUserOrThrow(c);
			const { endpoint } = c.req.valid("query");
			const repository = createPushSubscriptionRepository(c.get("db"));
			const removeSubscription = createRemovePushSubscription(
				repository.deleteSubscriptionByEndpointAndUserId,
			);
			const result = await removeSubscription(user.id, endpoint);

			return c.json(result);
		},
	)
	.post(
		"/send-test",
		zValidator("json", PushNotification.schema),
		async (c) => {
			const { user } = await getUserOrThrow(c);
			const payload = c.req.valid("json");
			const subscriptionRepository = createPushSubscriptionRepository(
				c.get("db"),
			);
			const notificationRepository = createPushNotificationRepository();
			const sendToUser = createSendPushNotificationToUser(
				subscriptionRepository.findSubscriptionsByUserId,
				notificationRepository.sendPushNotification,
				subscriptionRepository.deleteSubscriptionById,
			);
			const summary = await sendToUser(user.id, payload);

			return c.json(summary);
		},
	);

export default app;
