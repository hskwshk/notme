"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { FollowRequestItem } from "@/components/notice/follow-request-item";
import { NotificationItem } from "@/components/notice/notification-item";
import { NotificationManager } from "@/components/notification-manager";
import { Top } from "@/components/top";
import { apiClient } from "@/lib/api-client";

interface Notification {
	id: string;
	title: string;
	content?: string;
	isRead: boolean;
	createdAt: string;
}

interface FollowRequest {
	id: string;
	user: {
		id: string;
		name: string;
		image: string | null;
	};
	createdAt: string;
}

export default function Notice() {
	const [data, setData] = useState<{
		followRequests: FollowRequest[];
		generalNotifications: Notification[];
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await apiClient.api.notifications.$get();
				if (res.ok) {
					const json = await res.json();
					setData(json);
				}
			} catch (error) {
				console.error("Failed to fetch notifications:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);

	// Group notifications by date
	const groupedNotifications = data?.generalNotifications.reduce(
		(groups: Record<string, Notification[]>, notification) => {
			const date = new Date(notification.createdAt);
			const month = date.getMonth() + 1;
			const day = date.getDate();
			const dateStr = `${month}月${day}日`;
			if (!groups[dateStr]) {
				groups[dateStr] = [];
			}
			groups[dateStr].push(notification);
			return groups;
		},
		{},
	);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-rose-50/30">
				<Loader2 className="size-8 animate-spin text-rose-400" />
			</div>
		);
	}

	return (
		<main className="min-h-screen bg-[#ffffff]">
			<Top name="通知" />

			<div className="max-w-md mx-auto px-6 pt-6">
				{/* 1. Notification ON/OFF */}
				<NotificationManager />

				{/* 2. Fixed Follow Request Section */}
				{data && data.followRequests.length > 0 && (
					<FollowRequestItem
						username={data.followRequests[0].user.name}
						count={data.followRequests.length}
						image={data.followRequests[0].user.image ?? undefined}
					/>
				)}

				{/* 3. Grouped Notifications */}
				<div className="mt-4">
					{groupedNotifications &&
						Object.entries(groupedNotifications).map(
							([date, notifications]) => (
								<div key={date} className="mb-8">
									<h2 className="text-xl font-black text-slate-800 mb-6 px-1">
										{date}
									</h2>
									<div>
										{notifications.map((n) => (
											<NotificationItem
												key={n.id}
												title={n.title}
												description={n.content || "お知らせがあります。"}
												isRead={n.isRead}
											/>
										))}
									</div>
								</div>
							),
						)}

					{(!data || data.generalNotifications.length === 0) &&
						data?.followRequests.length === 0 && (
							<div className="flex flex-col items-center justify-center py-20 text-slate-400">
								<p className="text-sm font-medium">現在、通知はありません</p>
							</div>
						)}
				</div>
			</div>

			<BottomNav />
		</main>
	);
}
