import { Hono } from "hono";
import type { HonoEnv } from "@/server/types";
import { createFileRepository } from "../infrastructure/repositories/file";
import { FileId } from "../objects/file";

const app = new Hono<HonoEnv>().post("/public/upload", async (c) => {
	const db = c.get("db");
	const body = await c.req.parseBody();
	const file = body.file;

	if (!file || !(file instanceof File)) {
		return c.json({ error: "No file uploaded" }, 400);
	}

	// Basic validation
	const MAX_SIZE = 5 * 1024 * 1024; // 5MB
	if (file.size > MAX_SIZE) {
		return c.json({ error: "File too large (max 5MB)" }, 400);
	}
	if (!file.type.startsWith("image/")) {
		return c.json({ error: "Only images are allowed" }, 400);
	}

	const { client, baseUrl } = c.get("r2");
	const fileRepository = createFileRepository(client, db, baseUrl);

	// Use a temporary or public prefix?
	// Since we don't have user ID yet, we'll store it in a 'public/uploads' or just 'uploads' with a random key.
	// NOTE: Ideally we'd move this to the user's folder after registration,
	// but for simplicity/mvp we will just store it with a unique name.
	const blobFile = {
		kind: "BlobFile" as const,
		id: FileId(crypto.randomUUID()),
		bucket: "uploads",
		key: `public/${Date.now()}-${crypto.randomUUID()}-${file.name}`,
		blob: file,
		contentType: file.type,
		expiresAt: null, // Public images don't expire? Or maybe cleaner to have expiration if unused?
		// For now, simplify.
	};

	const uploaded = await fileRepository.saveBlobFile(blobFile);
	const imageUrl = `${baseUrl}/${uploaded.bucket}/${uploaded.key}`;

	return c.json({ url: imageUrl });
});

export default app;
