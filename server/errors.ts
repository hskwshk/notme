import { HTTPException } from "hono/http-exception";

/**
 * Validation error class extending HTTPException.
 */
export class ValidationError extends HTTPException {
	constructor(message: string, cause?: unknown) {
		super(400, { message, cause });
		Object.defineProperty(this, "name", { value: "ValidationError" });
	}
}
