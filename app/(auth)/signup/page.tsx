"use client";

import { ArrowLeft, Eye, EyeOff } from "lucide-react"; // Import Eye icons
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { passwordSchema, usernameSchema } from "@/server/objects/user";

export default function SignupPage() {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [isLoading, setIsLoading] = useState(false);
	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const [errors, setErrors] = useState<{
		username?: string;
		password?: string;
		confirmPassword?: string;
		general?: string;
	}>({});

	// Validation
	const validateUsername = (val: string) => {
		if (!val) return null;
		const result = usernameSchema.safeParse(val);
		return result.success ? null : result.error.issues[0].message;
	};

	const validatePassword = (val: string) => {
		if (!val) return null;
		const result = passwordSchema.safeParse(val);
		return result.success ? null : result.error.issues[0].message;
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImageFile(file);
			setImagePreview(URL.createObjectURL(file));
		}
	};

	const handleSubmit = async () => {
		setErrors({});
		setIsLoading(true);

		try {
			// Local validation
			const usernameErr = validateUsername(username);
			const passwordErr = validatePassword(password);
			const confirmErr =
				password !== confirmPassword ? "パスワードが一致しません" : null;

			if (usernameErr || passwordErr || confirmErr) {
				setErrors({
					username: usernameErr || undefined,
					password: passwordErr || undefined,
					confirmPassword: confirmErr || undefined,
					general: undefined,
				});
				setIsLoading(false);
				return;
			}

			// 1. Upload Image (if exists) -> Public Endpoint
			let imageUrl = null;
			if (imageFile) {
				const formData = new FormData();
				formData.append("file", imageFile);

				// Using fetch directly because client might not be generated for new route yet or strictly typed
				const uploadRes = await fetch("/api/files/public/upload", {
					method: "POST",
					body: formData,
				});

				if (!uploadRes.ok) {
					throw new Error("Failed to upload image");
				}
				const data = await uploadRes.json();
				imageUrl = data.url;
			}

			// 2. Register
			// Auto-generate email: username@placeholder.notme.app
			const dummyEmail = `${username}@placeholder.notme.app`;

			const { error } = await authClient.signUp.email({
				email: dummyEmail,
				password,
				name: name || username, // Default to username if name is empty
				// @ts-expect-error: better-auth types missing username in signUp
				username,
				image: imageUrl || undefined,
			});

			if (error) {
				// Handle specific errors
				if (
					error.message?.includes("already in use") ||
					error.code === "USER_ALREADY_EXISTS"
				) {
					setErrors({ username: "このユーザーIDは既に使用されています" });
				} else {
					setErrors({ general: error.message || "登録に失敗しました" });
				}
				setIsLoading(false);
				return;
			}

			// Success -> Redirect
			// Success -> Redirect
			router.refresh();
			router.replace("/");
		} catch (e) {
			console.error(e);
			setErrors({ general: "予期せぬエラーが発生しました" });
			setIsLoading(false);
		}
	};

	// Validity check for button state
	const isValid =
		username.length > 0 &&
		password.length > 0 &&
		password === confirmPassword &&
		!validateUsername(username) &&
		!validatePassword(password);

	return (
		<main className="min-h-screen bg-[#FFE4E4] pb-20 relative font-sans">
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 z-10 flex h-[60px] items-center justify-between px-4">
				<Link
					href="/login"
					className="flex h-10 w-10 items-center justify-center"
				>
					<ArrowLeft className="h-6 w-6 text-gray-700" />
				</Link>
				<h1 className="text-lg font-bold text-gray-700">
					プロフィール登録画面
				</h1>
				<div className="w-10"></div>
			</header>

			<div className="pt-[100px] px-6 flex flex-col items-center w-full max-w-md mx-auto">
				{/* Image Section */}
				<div className="relative mb-4 flex flex-col items-center">
					<div className="h-[120px] w-[120px] overflow-hidden rounded-full border-4 border-white shadow-sm bg-gray-200">
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
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className="text-[#4D89FF] font-bold text-sm mt-3"
					>
						画像を編集
					</button>
					<input
						type="file"
						ref={fileInputRef}
						className="hidden"
						accept="image/*"
						onChange={handleImageChange}
					/>
				</div>

				{/* Form Fields */}
				<div className="w-full space-y-6 mt-4">
					{/* Name */}
					<div className="space-y-2">
						<label htmlFor="name" className="text-sm font-bold text-black pl-1">
							ユーザーネーム
						</label>
						<input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full rounded-lg border-2 border-transparent focus:border-[#4D89FF] bg-[#EAEAEA]/80 px-4 py-3 text-black text-sm outline-none shadow-inner placeholder-gray-400"
							placeholder="（例） 桃太郎"
						/>
					</div>

					{/* Username (ID) */}
					<div className="space-y-2">
						<label
							htmlFor="username"
							className="text-sm font-bold text-black pl-1"
						>
							ユーザーID
						</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className={`w-full rounded-lg border-2 bg-[#EAEAEA]/80 px-4 py-3 text-black text-sm outline-none shadow-inner placeholder-gray-400 ${
								errors.username
									? "border-red-500 bg-red-50"
									: "border-transparent focus:border-[#4D89FF]"
							}`}
							placeholder="（例） @tarou_momo"
						/>
						{errors.username && (
							<p className="text-xs text-red-500 font-bold px-1">
								{errors.username}
							</p>
						)}
					</div>

					{/* Password */}
					<div className="space-y-2">
						<label
							htmlFor="password"
							className="text-sm font-bold text-black pl-1"
						>
							パスワード
						</label>
						<p className="text-[10px] text-gray-500 pl-1">半角英数8文字以上</p>
						<div className="relative">
							<input
								id="password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className={`w-full rounded-lg border-2 bg-[#EAEAEA]/80 px-4 py-3 text-black text-sm outline-none shadow-inner pr-10 ${
									errors.password
										? "border-red-500 bg-red-50"
										: "border-transparent focus:border-[#4D89FF]"
								}`}
								placeholder="（例） xxxxxx"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
							>
								{showPassword ? (
									<EyeOff className="h-5 w-5" />
								) : (
									<Eye className="h-5 w-5" />
								)}
							</button>
						</div>
						{errors.password && (
							<p className="text-xs text-red-500 font-bold px-1">
								{errors.password}
							</p>
						)}
					</div>

					{/* Confirm Password */}
					<div className="space-y-2">
						<label
							htmlFor="confirmPassword"
							className="text-sm font-bold text-black pl-1"
						>
							パスワード（確認）
						</label>
						<p className="text-[10px] text-gray-500 pl-1">半角英数8文字以上</p>
						<div className="relative">
							<input
								id="confirmPassword"
								type={showConfirmPassword ? "text" : "password"}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className={`w-full rounded-lg border-2 bg-[#EAEAEA]/80 px-4 py-3 text-black text-sm outline-none shadow-inner pr-10 ${
									errors.confirmPassword
										? "border-red-500 bg-red-50"
										: "border-transparent focus:border-[#4D89FF]"
								}`}
								placeholder="xxxxxx"
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
							>
								{showConfirmPassword ? (
									<EyeOff className="h-5 w-5" />
								) : (
									<Eye className="h-5 w-5" />
								)}
							</button>
						</div>
						{errors.confirmPassword && (
							<p className="text-xs text-red-500 font-bold px-1">
								{errors.confirmPassword}
							</p>
						)}
					</div>
				</div>

				{/* General Error */}
				{errors.general && (
					<div className="mt-6 w-full rounded-lg bg-red-100 p-3 text-center text-sm font-bold text-red-600">
						{errors.general}
					</div>
				)}

				{/* Register Button */}
				<button
					type="button"
					onClick={handleSubmit}
					disabled={!isValid || isLoading}
					className={`mt-10 w-[200px] rounded-full py-3 text-base font-bold text-white transition-all shadow-md ${
						isValid && !isLoading
							? "bg-[#8AB8FF] hover:bg-[#7aa7ee] active:scale-95"
							: "bg-gray-300 cursor-not-allowed"
					}`}
				>
					{isLoading ? "登録中..." : "登録"}
				</button>
			</div>
		</main>
	);
}
