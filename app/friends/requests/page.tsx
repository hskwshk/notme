"use client";

import { ChevronLeft, Search, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

interface Request {
	id: string; // requestId
	user: {
		id: string;
		name: string;
		username: string | null;
		image: string | null;
	};
}

export default function FriendRequestsPage() {
	const router = useRouter();
	const [requests, setRequests] = useState<Request[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchRequests = async () => {
			try {
				const res = await apiClient.api.users.me["friend-requests"].$get();
				if (res.ok) {
					const data = await res.json();
					setRequests(data.requests as unknown as Request[]);
				}
			} catch (error) {
				console.error("Failed to fetch requests", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchRequests();
	}, []);

	const handleAccept = async (requestId: string) => {
		try {
			const res = await apiClient.api.users["friend-request"][
				":requestId"
			].accept.$post({
				param: { requestId },
			});
			if (res.ok) {
				setRequests((prev) => prev.filter((r) => r.id !== requestId));
			}
		} catch (error) {
			console.error("Failed to accept", error);
		}
	};

	const handleReject = async (requestId: string) => {
		try {
			const res = await apiClient.api.users["friend-request"][
				":requestId"
			].$delete({
				param: { requestId },
			});
			if (res.ok) {
				setRequests((prev) => prev.filter((r) => r.id !== requestId));
			}
		} catch (error) {
			console.error("Failed to reject", error);
		}
	};

	const filteredRequests = requests.filter((r) => {
		if (!searchQuery) return true;
		return (
			r.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			r.user.username?.toLowerCase().includes(searchQuery.toLowerCase())
		);
	});

	return (
		<div className="bg-[#F2F2F7] min-h-screen pb-24 font-sans text-slate-900">
			{/* Header */}
			<header className="flex items-center justify-center px-4 pt-12 pb-4 bg-[#F2F2F7] sticky top-0 z-20">
				<button
					type="button"
					onClick={() => router.back()}
					className="absolute left-4 p-2 text-gray-500"
				>
					<ChevronLeft className="w-6 h-6" />
				</button>
				<h1 className="text-xl font-bold text-gray-700">フォローリクエスト</h1>
			</header>

			{/* Search Bar */}
			<div className="px-6 py-4">
				<div className="relative">
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="ユーザ名またはユーザーIDを入力"
						className="w-full bg-white rounded-full py-2.5 px-6 text-sm shadow-sm border-none outline-none focus:ring-2 focus:ring-blue-400/50 pr-10"
					/>
					<Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
				</div>
			</div>

			{/* List */}
			<div className="px-6 space-y-3">
				{isLoading ? (
					<div className="text-center py-12 text-gray-400 font-medium">
						読み込み中...
					</div>
				) : filteredRequests.length === 0 ? (
					<div className="text-center py-12 text-gray-400 font-medium text-sm">
						{searchQuery
							? "見つかりませんでした"
							: "新しいリクエストはありません"}
					</div>
				) : (
					filteredRequests.map((request) => (
						<div
							key={request.id}
							className="bg-white rounded-[24px] p-4 flex items-center justify-between shadow-sm border border-gray-100/50"
						>
							<div className="flex items-center gap-3 flex-1 min-w-0">
								<div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative border-2 border-white shadow-sm shrink-0">
									{request.user.image ? (
										<Image
											src={request.user.image}
											alt={request.user.name}
											fill
											className="object-cover"
											unoptimized
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center bg-slate-300">
											<User className="w-6 h-6 text-white/50" />
										</div>
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-[13px] text-gray-800 font-medium leading-relaxed">
										<span className="font-bold">{request.user.name}</span>
										さんがあなたをフォローしました。
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2 ml-2">
								<button
									type="button"
									onClick={() => handleAccept(request.id)}
									className="bg-[#2EBFFF] text-white text-xs font-bold px-5 py-2 rounded-lg active:scale-95 transition-transform"
								>
									承認
								</button>
								<button
									type="button"
									onClick={() => handleReject(request.id)}
									className="bg-[#9E9E9E] text-white text-xs font-bold px-5 py-2 rounded-lg active:scale-95 transition-transform"
								>
									削除
								</button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
