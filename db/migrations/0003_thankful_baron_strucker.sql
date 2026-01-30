CREATE TABLE "daily_goal" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"image_url" text,
	"description" text,
	"footer" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_daily_goal" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"goal_id" text NOT NULL,
	"date" text NOT NULL,
	"is_viewed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_daily_goal" ADD CONSTRAINT "user_daily_goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_goal" ADD CONSTRAINT "user_daily_goal_goal_id_daily_goal_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."daily_goal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_daily_goal_userId_idx" ON "user_daily_goal" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_daily_goal_userId_date_idx" ON "user_daily_goal" USING btree ("user_id","date");