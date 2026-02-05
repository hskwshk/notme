"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { signInWithUsername } from "@/lib/auth-actions";
import { checkUserExists } from "@/server/actions/auth";
import styles from "./login.module.css";
// Ensure you have "assets/login_cat.png" in public folder
// If images are missing, they should be placed in public/assets/

export default function LoginPage() {
	const router = useRouter();
	const [identifier, setIdentifier] = useState(""); // User ID (username)
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isShake, setIsShake] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const triggerShake = () => {
		setIsShake(true);
		setTimeout(() => setIsShake(false), 500);
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isLoading) return;
		setIsLoading(true);
		setError(null);

		try {
			// 1. Check if user exists (Exact match)
			const exists = await checkUserExists(identifier);

			if (!exists) {
				// User not found
				setError(
					"入力されたユーザーIDは登録されていません。新規登録をお願いします。",
				);
				triggerShake();
				setIsLoading(false);
				return;
			}

			// 2. Attempt login
			const result = await signInWithUsername({
				username: identifier,
				password,
			});

			if (!result.success) {
				// Password wrong (or other error)
				// Requirement: "Either user ID or password is incorrect" warning when one is wrong but user exists?
				// Actually requirement says: "どちらかまたは片方が違う場合はどちらかが間違っています...ていう警告"
				// AND "user exists check" -> if user NOT exists, specific message.
				// SO if we are here, user EXISTS, but login failed -> Password wrong.
				setError("ユーザーIDまたはパスワードが間違っています。");
				triggerShake();
				setIsLoading(false);
				return;
			}

			// Success
			router.push("/");
		} catch (e) {
			console.error("Login error:", e);
			setError("予期せぬエラーが発生しました。");
			setIsLoading(false);
		}
	};

	return (
		<main className={styles.container}>
			<div className={styles.statusBar}>{/* Signal icons would go here */}</div>

			<Image
				src="/assets/login_cat.png"
				alt="Black Cat"
				width={400}
				height={400}
				className={styles.catImage}
				priority
			/>

			<div className={`${styles.card} ${isShake ? styles.shake : ""}`}>
				<h1 className={styles.title}>NOT ME</h1>

				<form onSubmit={handleSubmit} style={{ width: "100%" }}>
					<div className={styles.inputGroup}>
						<span className={styles.icon}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								style={{ width: "20px", height: "20px" }}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A7.5 7.5 0 014.501 20.118z"
								/>
							</svg>
						</span>
						<input
							type="text"
							placeholder="ユーザーID"
							className={styles.input}
							value={identifier}
							onChange={(e) => setIdentifier(e.target.value)}
							required
						/>
					</div>

					<div className={styles.inputGroup}>
						<span className={styles.icon}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
								style={{ width: "20px", height: "20px" }}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
								/>
							</svg>
						</span>
						<input
							type="password"
							placeholder="パスワード"
							className={styles.input}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>

					<button
						type="submit"
						className={styles.loginButton}
						disabled={isLoading}
					>
						{isLoading ? "ログイン中..." : "ログイン"}
					</button>
				</form>

				<Link href="/signup" className={styles.registerLink}>
					新規登録
				</Link>
			</div>
			{/* Display error message outside/below card or absolute positioned as designed */}
			{error && <div className={styles.errorMessage}>{error}</div>}
		</main>
	);
}
