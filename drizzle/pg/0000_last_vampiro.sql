CREATE TABLE "app_state" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"current_phase" integer DEFAULT 1 NOT NULL,
	"phase_started_at" date NOT NULL,
	"current_book_id" integer,
	"pin_hash" text,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp with time zone,
	"notifications_enabled" boolean DEFAULT true,
	"quiet_hours_start" text DEFAULT '00:30',
	"quiet_hours_end" text DEFAULT '06:55'
);
--> statement-breakpoint
CREATE TABLE "body_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"weight_kg" numeric,
	"waist_cm" numeric,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"category" text,
	"total_pages" integer,
	"current_page" integer DEFAULT 0,
	"started_at" date,
	"finished_at" date,
	"abandoned" boolean DEFAULT false,
	"wishlist" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "daily_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"habit_id" integer,
	"completed" boolean DEFAULT false,
	"value" numeric,
	"notes" text,
	"logged_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exercise_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer,
	"exercise" text NOT NULL,
	"weight_kg" numeric,
	"reps" integer,
	"set_number" integer,
	"rpe" numeric
);
--> statement-breakpoint
CREATE TABLE "finance_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" date NOT NULL,
	"net_worth" numeric,
	"monthly_spend" numeric,
	"savings_rate" numeric,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "gym_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"type" text,
	"notes" text,
	"duration_minutes" integer
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"area" text NOT NULL,
	"cadence" text NOT NULL,
	"target_value" numeric,
	"unit" text,
	"phase_enabled" integer DEFAULT 1 NOT NULL,
	"archived" boolean DEFAULT false,
	"display_order" integer,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "identity_statements" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"active" boolean DEFAULT true,
	"display_order" integer
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"datetime" timestamp with time zone NOT NULL,
	"type" text,
	"on_time" boolean,
	"protein_hit" boolean,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "mood_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"mood_1_5" integer NOT NULL,
	"notes" text,
	"logged_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"relationship" text,
	"cadence_days" integer NOT NULL,
	"last_contacted_at" date,
	"birthday" date,
	"notes" text,
	"archived" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"device_label" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quarterly_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"quarter_starting" date NOT NULL,
	"photo_front_url" text,
	"photo_side_url" text,
	"weight_kg" numeric,
	"waist_cm" numeric,
	"net_worth" numeric,
	"reflection" text,
	"next_quarter_theme" text,
	"submitted_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reading_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"book_id" integer,
	"pages_read" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"reminder_key" text NOT NULL,
	"fired_at" timestamp with time zone DEFAULT now(),
	"habit_slug" text
);
--> statement-breakpoint
CREATE TABLE "screen_time_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"instagram_minutes" integer,
	"whatsapp_minutes" integer,
	"total_phone_minutes" integer
);
--> statement-breakpoint
CREATE TABLE "sleep_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"bedtime" timestamp with time zone,
	"wake_time" timestamp with time zone,
	"duration_minutes" integer,
	"quality_1_5" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "weekly_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_starting" date NOT NULL,
	"q1_worked" text,
	"q2_didnt_work" text,
	"q3_streak_at_risk" text,
	"q4_ship_target" text,
	"q5_call_overdue" text,
	"submitted_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_sets" ADD CONSTRAINT "exercise_sets_session_id_gym_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gym_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_logs_date_habit_idx" ON "daily_logs" USING btree ("date","habit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_snapshots_month_idx" ON "finance_snapshots" USING btree ("month");--> statement-breakpoint
CREATE UNIQUE INDEX "habits_slug_idx" ON "habits" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "mood_logs_date_idx" ON "mood_logs" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subs_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE UNIQUE INDEX "quarterly_reviews_quarter_idx" ON "quarterly_reviews" USING btree ("quarter_starting");--> statement-breakpoint
CREATE UNIQUE INDEX "screen_time_logs_date_idx" ON "screen_time_logs" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "sleep_logs_date_idx" ON "sleep_logs" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_reviews_week_idx" ON "weekly_reviews" USING btree ("week_starting");