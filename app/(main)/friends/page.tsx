"use client";

import { ChevronLeft, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

interface Friend {
	id: string;
	name: string;
	image: string | null;
}

export default function FriendsPage() {
	const [friends, setFriends] = useState<Friend[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchFriends = async () => {
			try {
				const res = await apiClient.api.users.me.friends.$get();
				if (res.ok) {
					const data = await res.json();
					setFriends(data.friends);
				}
			} catch (error) {
				console.error("Failed to fetch friends", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchFriends();
	}, []);

	return (
		<div className="bg-zinc-50 min-h-screen pb-24">
			{/* Header */}
			<header className="flex items-center px-4 py-4 bg-white sticky top-0 z-10 shadow-sm">
				<Link href="/profile" className="p-2 -ml-2 text-gray-600">
					<ChevronLeft className="w-6 h-6" />
				</Link>
				<h1 className="text-lg font-bold text-gray-800 ml-2">友達一覧</h1>
			</header>

			<div className="p-4">
				{isLoading ? (
					<div className="text-center py-8 text-gray-500">Loading...</div>
				) : friends.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						まだ友達がいません
					</div>
				) : (
					<div className="grid gap-4">
						{friends.map((friend) => (
							<div
								key={friend.id}
								className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm"
							>
								<div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
									{friend.image ? (
										<Image
											src={friend.image}
											alt={friend.name}
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
										{friend.name}
									</h3>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
