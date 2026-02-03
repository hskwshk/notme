"use client";

import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { passwordSchema, usernameSchema } from "@/server/objects/user";

// types
type ProfileData = {
	name: string; // 表示名
	username: string; // ユーザーID (@...)
	image: string | null;
};

export default function ProfileEditPage() {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);

	// State
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [initialData, setInitialData] = useState<ProfileData | null>(null);

	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const [showLogoutModal, setShowLogoutModal] = useState(false);

	// Fetch Profile Data
	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const res = await apiClient.api.users.me.profile.$get();
				if (!res.ok) throw new Error("Failed to fetch profile");
				const data = await res.json();

				if ("error" in data) {
					throw new Error(String(data.error));
				}

				const { user } = data;
				setInitialData({
					name: user.name,
					username: user.username || "",
					image: user.image,
				});
				setName(user.name);
				setUsername(user.username || "");
				setImagePreview(user.image);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchProfile();
	}, []);

	// Validation Helpers
	const validateUsername = (val: string): string | null => {
		if (val.length === 0) return null;
		const result = usernameSchema.safeParse(val);
		if (!result.success) {
			return result.error.issues[0].message;
		}
		return null;
	};

	const validatePassword = (val: string): string | null => {
		if (val === "") return null;
		const result = passwordSchema.safeParse(val);
		if (!result.success) {
			return result.error.issues[0].message;
		}
		return null;
	};

	// Errors (derived state)
	const usernameError = validateUsername(username);
	const passwordError = validatePassword(password);

	// Password valid if empty (no change) OR valid format
	const isPasswordValid = password === "" || !passwordError;
	// Username valid if not empty AND no error
	const isUsernameValid = username.length > 0 && !usernameError;

	const isConfirmPasswordValid = password === confirmPassword;

	const isFormValid =
		name.length > 0 &&
		isUsernameValid &&
		isPasswordValid &&
		isConfirmPasswordValid &&
		(password !== "" ? confirmPassword !== "" : true);

	const hasChanges =
		initialData &&
		(name !== initialData.name ||
			username !== initialData.username ||
			password !== "" ||
			imageFile !== null);

	const canSave = isFormValid && hasChanges;

	// Handlers
	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImageFile(file);
			setImagePreview(URL.createObjectURL(file));
		}
	};

	const handleSave = async () => {
		if (!canSave || isSaving) return;
		setIsSaving(true);

		try {
			// 1. Upload Image if changed
			if (imageFile) {
				const formData = new FormData();
				formData.append("file", imageFile);
				const uploadRes = await apiClient.api.users.me.profile.image.$post({
					form: { file: imageFile },
				});
				if (!uploadRes.ok) {
					const errorData = (await uploadRes.json()) as {
						error: string;
						details?: string;
					};
					console.error("Upload error:", errorData);
					const errorMessage =
						"error" in errorData
							? `${errorData.error}${errorData.details ? `: ${errorData.details}` : ""}`
							: "Failed to upload image";
					throw new Error(errorMessage);
				}
			}

			// 2. Update Profile
			const updateRes = await apiClient.api.users.me.profile.$put({
				json: {
					name,
					username,
					password: password || undefined,
				},
			});

			if (!updateRes.ok) {
				const errData = await updateRes.json();
				if ("error" in errData) {
					alert(errData.error);
				} else {
					alert("Failed to update profile");
				}
				return;
			}

			// Redirect
			router.push("/profile");
			router.refresh();
		} catch (error) {
			console.error("Save error:", error);
			alert("An error occurred while saving.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleLogout = async () => {
		await authClient.signOut();
		router.push("/login"); // or dedicated logout
		router.refresh();
	};

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-[#F4F4F5]">
				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
			</div>
		);
	}

	return (
		<main className="min-h-screen bg-[#F4F4F5] pb-20 relative">
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 z-10 flex h-[60px] items-center justify-between bg-[#F4F4F5] px-4">
				<Link
					href="/profile"
					className="flex h-10 w-10 items-center justify-center"
				>
					<ArrowLeft className="h-6 w-6 text-gray-700" />
				</Link>
				<h1 className="text-lg font-bold text-gray-900">プロフィールを編集</h1>
				<div className="w-10"></div>
			</header>

			<div className="pt-[80px] px-6 flex flex-col items-center">
				{/* Image Section */}
				<div className="relative mb-4">
					<div className="h-[120px] w-[120px] overflow-hidden rounded-full border-2 border-white shadow-sm bg-gray-200">
						{imagePreview ? (
							<Image
								src={imagePreview}
								alt="Profile"
								width={120}
								height={120}
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="h-full w-full flex items-center justify-center text-gray-400">
								No Img
							</div>
						)}
					</div>
				</div>
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					className="text-[#4D89FF] font-bold text-sm mb-8"
				>
					写真を変更
				</button>
				<input
					type="file"
					ref={fileInputRef}
					className="hidden"
					accept="image/*"
					onChange={handleImageChange}
				/>

				{/* Form Fields */}
				<div className="w-full space-y-6">
					{/* Name */}
					<div className="space-y-2">
						<label htmlFor="name" className="text-sm font-bold text-black">
							ユーザーネーム
						</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full rounded-lg border border-none bg-[#EAEAEA] px-4 py-3 text-black text-sm outline-none shadow-inner"
							placeholder="表示名"
						/>
					</div>

					{/* Username (ID) */}
					<div className="space-y-2">
						<label htmlFor="username" className="text-sm font-bold text-black">
							ユーザーID
						</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className={`w-full rounded-lg border px-4 py-3 text-black text-sm outline-none shadow-inner ${
								usernameError
									? "border-red-500 bg-red-50"
									: "border-none bg-[#EAEAEA]"
							}`}
							placeholder="@userid (半角英数, ., _)"
						/>
						{usernameError && (
							<p className="text-xs text-red-500 font-bold">{usernameError}</p>
						)}
					</div>

					{/* Password */}
					<div className="space-y-2">
						<label htmlFor="password" className="text-sm font-bold text-black">
							パスワード
						</label>
						<p className="text-[10px] text-gray-500">半角英数8文字以上</p>
						<div className="relative">
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className={`w-full rounded-lg border px-4 py-3 text-black text-sm outline-none shadow-inner pr-10 ${
									passwordError
										? "border-red-500 bg-red-50"
										: "border-none bg-[#EAEAEA]"
								}`}
								placeholder="xxxxxx"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
							>
								{showPassword ? (
									<EyeOff className="h-5 w-5" />
								) : (
									<Eye className="h-5 w-5" />
								)}
							</button>
						</div>
						{passwordError && (
							<p className="text-xs text-red-500 font-bold">{passwordError}</p>
						)}
					</div>

					{/* Confirm Password */}
					<div className="space-y-2">
						<label
							htmlFor="confirmPassword"
							className="text-sm font-bold text-black"
						>
							パスワード（確認）
						</label>
						<p className="text-[10px] text-gray-500">半角英数8文字以上</p>
						<div className="relative">
							<input
								id="confirmPassword"
								type={showConfirmPassword ? "text" : "password"}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className={`w-full rounded-lg border px-4 py-3 text-black text-sm outline-none shadow-inner pr-10 ${
									!isConfirmPasswordValid && confirmPassword.length > 0
										? "border-red-500 bg-red-50"
										: "border-none bg-[#EAEAEA]"
								}`}
								placeholder="xxxxxx"
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
							>
								{showConfirmPassword ? (
									<EyeOff className="h-5 w-5" />
								) : (
									<Eye className="h-5 w-5" />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Save Button */}
				<button
					type="button"
					onClick={handleSave}
					disabled={!canSave || isSaving}
					className={`mt-10 w-[200px] rounded-full py-3 text-base font-bold text-white transition-colors ${
						canSave && !isSaving
							? "bg-[#8AB8FF]"
							: "bg-gray-300 cursor-not-allowed"
					}`}
				>
					{isSaving ? "保存中..." : "保存"}
				</button>

				{/* Logout Button */}
				<button
					type="button"
					onClick={() => setShowLogoutModal(true)}
					className="mt-12 mb-8 flex items-center justify-center gap-2 text-red-500 font-bold text-sm"
				>
					<span className="text-lg">↪</span> ログアウト
				</button>
			</div>

			{/* Logout Modal */}
			{showLogoutModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-sm rounded-[20px] bg-white p-6 text-center shadow-lg">
						<h3 className="mb-2 text-lg font-bold text-gray-900">
							ログアウトしますか？
						</h3>
						<p className="mb-6 text-sm text-gray-500">
							ログアウトしてもデータは保存されます。
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setShowLogoutModal(false)}
								className="flex-1 rounded-full bg-gray-100 py-3 text-sm font-bold text-gray-600"
							>
								キャンセル
							</button>
							<button
								type="button"
								onClick={handleLogout}
								className="flex-1 rounded-full bg-red-500 py-3 text-sm font-bold text-white"
							>
								ログアウト
							</button>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}
