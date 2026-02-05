"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function NotificationManager() {
	const [permission, setPermission] = useState<
		NotificationPermission | "unsupported"
	>("default");
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const checkSubscription = useCallback(async () => {
		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();
			setIsSubscribed(!!subscription);
		} catch (error) {
			console.error("Failed to check subscription:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (
			typeof window === "undefined" ||
			!("Notification" in window) ||
			!("serviceWorker" in navigator)
		) {
			setPermission("unsupported");
			setIsLoading(false);
			return;
		}

		setPermission(Notification.permission);
		checkSubscription();
	}, [checkSubscription]);

	const subscribe = async () => {
		setIsLoading(true);
		try {
			// 1. Request Permission
			const result = await Notification.requestPermission();
			setPermission(result);
			if (result !== "granted") return;

			// 2. Register Service Worker (if not already)
			const registration = await navigator.serviceWorker.register("/sw.js");
			await navigator.serviceWorker.ready;

			// 3. Subscribe to Push Manager
			if (!VAPID_PUBLIC_KEY) {
				throw new Error("VAPID Public Key is missing in environment variables");
			}

			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
			});

			// 4. Send to Backend
			await apiClient.api.notifications.subscriptions.$post({
				json: JSON.parse(JSON.stringify(subscription)),
			});

			setIsSubscribed(true);
		} catch (error) {
			console.error("Failed to subscribe:", error);
			alert("通知の登録に失敗しました。");
		} finally {
			setIsLoading(false);
		}
	};

	const unsubscribe = async () => {
		setIsLoading(true);
		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();
			if (subscription) {
				await subscription.unsubscribe();
				// Backend removal using endpoint
				await apiClient.api.notifications.subscriptions.$delete({
					query: { endpoint: subscription.endpoint },
				});
			}
			setIsSubscribed(false);
		} catch (error) {
			console.error("Failed to unsubscribe:", error);
		} finally {
			setIsLoading(false);
		}
	};

	if (permission === "unsupported") {
		return null;
	}

	return (
		<div className="w-full max-w-md bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6 transition-all hover:shadow-md">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div
						className={`p-2 rounded-xl ${isSubscribed ? "bg-sky-50 text-sky-500" : "bg-slate-50 text-slate-400"}`}
					>
						{isSubscribed ? (
							<Bell className="size-5" />
						) : (
							<BellOff className="size-5" />
						)}
					</div>
					<div>
						<h3 className="font-bold text-slate-900 text-sm">プッシュ通知</h3>
						<p className="text-xs text-slate-500">
							{isSubscribed
								? "通知は有効です"
								: "重要な更新をリアルタイムで受け取る"}
						</p>
					</div>
				</div>

				<button
					type="button"
					onClick={isSubscribed ? unsubscribe : subscribe}
					disabled={isLoading || permission === "denied"}
					className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
						isSubscribed
							? "bg-slate-100 text-slate-600 hover:bg-slate-200"
							: permission === "denied"
								? "bg-red-50 text-red-500 cursor-not-allowed"
								: "bg-sky-400 text-white hover:bg-sky-500 shadow-sm shadow-sky-200"
					}`}
				>
					{isLoading ? (
						<Loader2 className="size-4 animate-spin" />
					) : isSubscribed ? (
						"解除する"
					) : permission === "denied" ? (
						"ブロック済み"
					) : (
						"有効にする"
					)}
				</button>
			</div>
			{permission === "denied" && (
				<p className="text-[10px] text-red-400 mt-2 text-center">
					ブラウザの設定から通知を許可してください
				</p>
			)}
		</div>
	);
}

// Utility function
function urlBase64ToUint8Array(base64String: string) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}
