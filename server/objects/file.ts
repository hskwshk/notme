import { uuidv7 } from "uuidv7";
import { z } from "zod";

import { ValidationError } from "@/server/errors";

const buildFromZod = <Output>(result: z.ZodSafeParseResult<Output>): Output => {
	if (result.success) return result.data;
	throw new ValidationError(result.error.message);
};

export const createBlobFile = (params: {
	blob: Blob;
	bucket: string;
	keyPrefix: string;
	contentType: string;
}): BlobFile => {
	const { blob, bucket, keyPrefix, contentType } = params;
	const id = generateFileId();
	return {
		kind: "BlobFile",
		id,
		blob,
		bucket,
		key: `${keyPrefix}/${id}`,
		contentType,
	};
};

const generateFileId = (): FileId => {
	return uuidv7() as FileId;
};

export const fileIdSchema = z.string().uuid().brand("FileId");

export type FileId = z.infer<typeof fileIdSchema>;
type FileIdInput = z.input<typeof fileIdSchema>;

export const FileId = Object.assign(
	(input: FileIdInput): FileId => buildFromZod(fileIdSchema.safeParse(input)),
	{
		schema: fileIdSchema,
		unsafe: (input: FileIdInput): FileId => fileIdSchema.parse(input),
	},
);

export interface BlobFile extends BaseFile {
	kind: "BlobFile";
	blob: Blob;
}
export interface BaseFile {
	kind: string;
	id: FileId;
	bucket: string;
	key: string;
	contentType: string;
}

export type UploadedFile<T extends BaseFile> = T & {
	size: number;
	uploadedAt: Date;
};

export const toUploadedFile = <T extends BaseFile>(params: {
	file: T;
	size: number;
}): UploadedFile<T> => {
	const { file, size } = params;
	return { ...file, size, uploadedAt: new Date() };
};
