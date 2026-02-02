"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { signInWithEmail } from "@/lib/auth-actions";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsLoading(true);
		setError(null);

		const result = await signInWithEmail({
			email,
			password,
		});

		if (!result.success) {
			setError(result.error ?? "Login failed");
			setIsLoading(false);
			return;
		}

		router.push("/");
	};

	return (
		<div>
			<h1>Log in</h1>
			<p>Access your account and view the secure API demos.</p>
			<form onSubmit={handleSubmit}>
				<div>
					<label htmlFor="email">Email</label>
					<input
						id="email"
						type="email"
						required
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
				</div>
				<div>
					<label htmlFor="password">Password</label>
					<input
						id="password"
						type="password"
						required
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
				</div>
				<button type="submit" disabled={isLoading}>
					{isLoading ? "Logging in..." : "Log in"}
				</button>
			</form>
			{error ? <p style={{ color: "red" }}>{error}</p> : null}
			<p>
				New here? <Link href="/signup">Create an account</Link>.
			</p>
		</div>
	);
}
