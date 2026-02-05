"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/notice-card";
import { NotificationManager } from "@/components/notification-manager";
import { Top } from "@/components/top";

// トップのテストデータ
const pageName = "通知";

// 通知のテストデータ
const noticesByDate = [
	{
		date: "1月31日",
		notices: [
			{
				id: 1,
				title: "新しいメッセージ",
				description:
					"田中さんからメッセージが届きました。内容を確認してください。",
				isUnread: true,
			},
			{
				id: 2,
				title: "システムメンテナンス",
				description: "明日の深夜2時からシステムメンテナンスを実施します。",
				isUnread: true,
			},
		],
	},
	{
		date: "1月30日",
		notices: [
			{
				id: 3,
				title: "お知らせ",
				description: "新機能がリリースされました。ぜひお試しください。",
				isUnread: false,
			},
			{
				id: 4,
				title: "イベント開催",
				description: "来週の金曜日にオンラインイベントを開催します。",
				isUnread: false,
			},
		],
	},
	{
		date: "1月29日",
		notices: [
			{
				id: 5,
				title: "アップデート完了",
				description: "アプリのアップデートが完了しました。再起動してください。",
				isUnread: false,
			},
		],
	},
];

export default function Notice() {
	return (
		<>
			<main className="min-h-screen bg-slate-50 pb-24">
				<Top name={pageName} />

				<div className="max-w-md mx-auto px-4 pt-6">
					<NotificationManager />

					<div className="flex flex-col items-center">
						{noticesByDate.map((group) => (
							<section key={group.date} className="w-full">
								<h2 className="mb-[23px] text-[20px] font-bold text-black">
									{group.date}
								</h2>
								<div>
									{group.notices.map((notice) => (
										<Card
											key={notice.id}
											title={notice.title}
											description={notice.description}
											isUnread={notice.isUnread}
										/>
									))}
								</div>
							</section>
						))}
					</div>
				</div>

				<BottomNav />
			</main>
		</>
	);
}
