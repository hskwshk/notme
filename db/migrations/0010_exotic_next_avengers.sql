ALTER TABLE "user_stamp" ADD COLUMN "is_favorite" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_stamp" ADD COLUMN "favorite_order" bigint;