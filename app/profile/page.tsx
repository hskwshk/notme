"use client";

import { ChevronLeft, Save, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

interface UserProfile {
	id: string;
	name: string;
	username?: string | null;
	characterName?: string | null;
	image?: string | null;
	level?: number;
	currentStreak?: number;
	maxStreak?: number;
	totalDuration?: number;
	maxMinutes?: number;
}

export default function ProfileEditPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [characterName, setCharacterName] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const res = await apiClient.api.users.me.profile.$get();
				if (res.ok) {
					const json = await res.json();
					const userData = json.user as UserProfile;
					setName(userData.name);
					setUsername(userData.username || "");
					setCharacterName(userData.characterName || "");
				}
			} catch (e) {
				console.error("Failed to fetch profile", e);
				setError("プロフィールの取得に失敗しました");
			} finally {
				setIsLoading(false);
			}
		};
		fetchProfile();
	}, []);

	const handleSave = async () => {
		setIsSaving(true);
		setError(null);
		try {
			const res = await apiClient.api.users.me.profile.$put({
				json: {
					name,
					username,
					characterName,
				},
			});

			if (res.ok) {
				router.push("/");
			} else {
				const json = await res.json();
				setError(
					"error" in json ? (json.error as string) : "更新に失敗しました",
				);
			}
		} catch (e) {
			console.error("Failed to save profile", e);
			setError("サーバーエラーが発生しました");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[#F2F2F7]">
				<p className="text-gray-500">読み込み中...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#F2F2F7] font-sans pb-20">
			{/* Header */}
			<div className="sticky top-0 z-50 bg-[#F2F2F7] pt-10 pb-4 px-4 flex items-center justify-between">
				<button
					type="button"
					onClick={() => router.back()}
					className="p-2 text-gray-500"
				>
					<ChevronLeft className="h-6 w-6" />
				</button>
				<h1 className="text-lg font-bold text-gray-700">プロフィール編集</h1>
				<div className="w-10" /> {/* Spacer */}
			</div>

			<div className="p-4 space-y-6">
				{/* Avatar Placeholder */}
				<div className="flex flex-col items-center gap-2">
					<div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
						<User className="h-12 w-12 text-gray-400" />
					</div>
					<button type="button" className="text-blue-500 text-sm font-medium">
						写真を変更
					</button>
				</div>

				{/* Form */}
				<div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
					<div>
						<label
							htmlFor="profile-name"
							className="text-xs font-bold text-gray-400 ml-1 mb-1 block"
						>
							表示名
						</label>
						<input
							id="profile-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full bg-gray-100 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-400/50"
							placeholder="名前を入力"
						/>
					</div>

					<div>
						<label
							htmlFor="profile-username"
							className="text-xs font-bold text-gray-400 ml-1 mb-1 block"
						>
							ユーザーID (検索用)
						</label>
						<input
							id="profile-username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="w-full bg-gray-100 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-400/50"
							placeholder="ユーザーIDを入力"
						/>
						<p className="text-[10px] text-gray-400 ml-1 mt-1">
							※他人があなたを検索するときに使用するIDです
						</p>
					</div>

					<div>
						<label
							htmlFor="profile-character"
							className="text-xs font-bold text-gray-400 ml-1 mb-1 block"
						>
							なりきるキャラ名
						</label>
						<input
							id="profile-character"
							type="text"
							value={characterName}
							onChange={(e) => setCharacterName(e.target.value)}
							className="w-full bg-gray-100 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-400/50"
							placeholder="キャラ名を入力"
						/>
					</div>
				</div>

				{error && (
					<p className="text-red-500 text-xs text-center font-medium">
						{error}
					</p>
				)}

				<button
					type="button"
					onClick={handleSave}
					disabled={isSaving}
					className="w-full bg-[#1C1C1E] text-white rounded-full py-4 font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
				>
					<Save className="h-5 w-5" />
					{isSaving ? "保存中..." : "保存する"}
				</button>
			</div>
		</div>
	);
}
