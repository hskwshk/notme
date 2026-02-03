/**
 * Creates file repository functions
 * @param r2 - The R2 service
 * @param db - The database instance
 * @returns File repository functions
 */

import type { AwsClient } from "aws4fetch";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import type { BlobFile } from "@/server/objects/file";
import { toUploadedFile, type UploadedFile } from "@/server/objects/file";

export const createFileRepository = (
	r2: AwsClient,
	db: Database,
	url: string,
) => ({
	saveBlobFile: createSaveBlobFile(r2, db, url),
});

/**
 * Creates a function to save a blob file to storage
 * @param r2 - The R2 service
 * @param db - The database instance
 * @returns A function to save a blob file
 */
const createSaveBlobFile =
	(r2: AwsClient, db: Database, url: string) =>
	async <T extends BlobFile>(file: T): Promise<UploadedFile<T>> => {
		// Local fallback if R2 URL is dummy or missing
		if (!url || url.includes("barbar.foo")) {
			const fs = await import("fs/promises");
			const path = await import("path");

			const publicPath = path.join(process.cwd(), "public");
			// Ensure bucket directory exists
			const fileDir = path.join(
				publicPath,
				file.bucket,
				path.dirname(file.key),
			);
			await fs.mkdir(fileDir, { recursive: true });

			const filePath = path.join(publicPath, file.bucket, file.key);
			const arrayBuffer = await file.blob.arrayBuffer();
			await fs.writeFile(filePath, Buffer.from(arrayBuffer));

			const size = file.blob.size;

			await db.insert(schema.files).values({
				id: file.id,
				bucket: file.bucket,
				key: file.key,
				contentType: file.contentType,
				size,
				expiresAt:
					"expiresAt" in file && file.expiresAt instanceof Date
						? file.expiresAt
						: null,
				uploadedAt: new Date(),
			});

			return toUploadedFile({ file, size });
		}

		const uploadResponse = await r2.fetch(`${url}/${file.bucket}/${file.key}`, {
			method: "PUT",
			body: file.blob,
			headers: { "Content-Type": file.contentType },
		});
		if (!uploadResponse.ok) {
			const errorText = await uploadResponse.text();
			console.error("R2 Upload Failed:", uploadResponse.status, errorText);
			throw new Error(
				`R2 Upload Failed: ${uploadResponse.status} ${errorText}`,
			);
		}

		// S3 PUT usually returns empty body on success
		// const resjson = await uploadResponse.text();
		// console.log("Upload Response JSON:", resjson);

		const size = file.blob.size;

		await db.insert(schema.files).values({
			id: file.id,
			bucket: file.bucket,
			key: file.key,
			contentType: file.contentType,
			size,
			expiresAt:
				"expiresAt" in file && file.expiresAt instanceof Date
					? file.expiresAt
					: null,
			uploadedAt: new Date(),
		});

		return toUploadedFile({ file, size });
	};
