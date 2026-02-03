"use client";

// import { group } from "console";
// import Image from "next/image";

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
	console.log("Notice Data:", noticesByDate);

	return (
		<>
			<main className="my-[70px]">
				<Top name={pageName} />

				<div className="flex flex-col items-center">
					{noticesByDate.map((group) => (
						<section key={group.date}>
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

				<BottomNav />
			</main>
			<div>
				<h1>{pageName}</h1>
				<p>Check console for data.</p>
			</div>
		</>
	);
}
