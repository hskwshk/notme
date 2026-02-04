"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { signUpWithEmail } from "@/lib/auth-actions";

export default function SignupPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsLoading(true);
		setError(null);

		const result = await signUpWithEmail({
			name,
			username,
			email,
			password,
		});

		if (!result.success) {
			setError(result.error ?? "Signup failed");
			setIsLoading(false);
			return;
		}

		router.push("/");
	};

	return (
		<div>
			<h1>Create account</h1>
			<p>Sign up to access the secure API playground.</p>
			<form onSubmit={handleSubmit}>
				<div>
					<label htmlFor="name">Name</label>
					<input
						id="name"
						required
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</div>
				<div>
					<label htmlFor="username">Username (User ID)</label>
					<input
						id="username"
						required
						value={username}
						onChange={(event) => setUsername(event.target.value)}
						placeholder="e.g. user123"
						className="w-full px-3 py-2 border rounded"
					/>
				</div>
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
					{isLoading ? "Creating account..." : "Create account"}
				</button>
			</form>
			{error ? <p style={{ color: "red" }}>{error}</p> : null}
			<p>
				Already have an account? <Link href="/login">Log in</Link>.
			</p>
		</div>
	);
}
