"use client";

import { Check, ChevronLeft, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

interface Request {
	id: string; // requestId
	// Sender user
	user: {
		id: string;
		name: string;
		image: string | null;
	};
}

export default function FriendRequestsPage() {
	const [requests, setRequests] = useState<Request[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchRequests = async () => {
			try {
				const res = await apiClient.api.users.me["friend-requests"].$get();
				if (res.ok) {
					const data = await res.json();
					setRequests(data.requests);
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

	return (
		<div className="bg-zinc-50 min-h-screen pb-24">
			{/* Header */}
			<header className="flex items-center px-4 py-4 bg-white sticky top-0 z-10 shadow-sm">
				<Link href="/profile" className="p-2 -ml-2 text-gray-600">
					<ChevronLeft className="w-6 h-6" />
				</Link>
				<h1 className="text-lg font-bold text-gray-800 ml-2">リクエスト一覧</h1>
			</header>

			<div className="p-4">
				{isLoading ? (
					<div className="text-center py-8 text-gray-500">Loading...</div>
				) : requests.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						新しいリクエストはありません
					</div>
				) : (
					<div className="grid gap-4">
						{requests.map((request) => (
							<div
								key={request.id}
								className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm"
							>
								<div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
									{request.user.image ? (
										<Image
											src={request.user.image}
											alt={request.user.name}
											fill
											className="object-cover"
											unoptimized
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center">
											<User className="w-6 h-6 text-gray-400" />
										</div>
									)}
								</div>
								<div className="min-w-0 flex-1">
									<h3 className="font-bold text-gray-900 truncate">
										{request.user.name}
									</h3>
									<p className="text-xs text-gray-500">
										@{request.user.id.slice(0, 8)}
									</p>
								</div>

								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={() => handleAccept(request.id)}
										className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
									>
										<Check className="w-5 h-5" />
									</button>
									<button
										type="button"
										onClick={() => handleReject(request.id)}
										className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors"
									>
										<X className="w-5 h-5" />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
