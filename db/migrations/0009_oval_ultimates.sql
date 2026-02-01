CREATE TABLE "exercise_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"duration_seconds" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_session" ADD CONSTRAINT "exercise_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercise_session_userId_idx" ON "exercise_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exercise_session_startTime_idx" ON "exercise_session" USING btree ("start_time");