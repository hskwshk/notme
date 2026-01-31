CREATE TABLE "mission_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mission_type" text NOT NULL,
	"notified_at" timestamp DEFAULT now() NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stamp" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_stamp" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stamp_id" text NOT NULL,
	"obtained_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "total_duration" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "mission_notification" ADD CONSTRAINT "mission_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stamp" ADD CONSTRAINT "user_stamp_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stamp" ADD CONSTRAINT "user_stamp_stamp_id_stamp_id_fk" FOREIGN KEY ("stamp_id") REFERENCES "public"."stamp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mission_notification_userId_idx" ON "mission_notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_stamp_userId_idx" ON "user_stamp" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_stamp_userId_stampId_idx" ON "user_stamp" USING btree ("user_id","stamp_id");