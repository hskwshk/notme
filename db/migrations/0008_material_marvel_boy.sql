CREATE TABLE "friendship" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"friend_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD COLUMN "is_stamp_viewed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_friend_id_user_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "friendship_userId_idx" ON "friendship" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "friendship_friendId_idx" ON "friendship" USING btree ("friend_id");--> statement-breakpoint
CREATE UNIQUE INDEX "friendship_userId_friendId_idx" ON "friendship" USING btree ("user_id","friend_id");