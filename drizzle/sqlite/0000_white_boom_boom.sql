CREATE TABLE `app_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`current_phase` integer DEFAULT 1 NOT NULL,
	`phase_started_at` text NOT NULL,
	`current_book_id` integer,
	`pin_hash` text,
	`failed_login_attempts` integer DEFAULT 0,
	`locked_until` text,
	`notifications_enabled` integer DEFAULT true,
	`quiet_hours_start` text DEFAULT '00:30',
	`quiet_hours_end` text DEFAULT '06:55'
);
--> statement-breakpoint
CREATE TABLE `body_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real,
	`waist_cm` real,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`author` text,
	`category` text,
	`total_pages` integer,
	`current_page` integer DEFAULT 0,
	`started_at` text,
	`finished_at` text,
	`abandoned` integer DEFAULT false,
	`wishlist` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `daily_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`habit_id` integer,
	`completed` integer DEFAULT false,
	`value` real,
	`notes` text,
	`logged_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_logs_date_habit_idx` ON `daily_logs` (`date`,`habit_id`);--> statement-breakpoint
CREATE TABLE `exercise_sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer,
	`exercise` text NOT NULL,
	`weight_kg` real,
	`reps` integer,
	`set_number` integer,
	`rpe` real,
	FOREIGN KEY (`session_id`) REFERENCES `gym_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `finance_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`month` text NOT NULL,
	`net_worth` real,
	`monthly_spend` real,
	`savings_rate` real,
	`notes` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `finance_snapshots_month_idx` ON `finance_snapshots` (`month`);--> statement-breakpoint
CREATE TABLE `gym_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`type` text,
	`notes` text,
	`duration_minutes` integer
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`area` text NOT NULL,
	`cadence` text NOT NULL,
	`target_value` real,
	`unit` text,
	`phase_enabled` integer DEFAULT 1 NOT NULL,
	`archived` integer DEFAULT false,
	`display_order` integer,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `habits_slug_idx` ON `habits` (`slug`);--> statement-breakpoint
CREATE TABLE `identity_statements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text` text NOT NULL,
	`active` integer DEFAULT true,
	`display_order` integer
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`datetime` text NOT NULL,
	`type` text,
	`on_time` integer,
	`protein_hit` integer,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `mood_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`mood_1_5` integer NOT NULL,
	`notes` text,
	`logged_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mood_logs_date_idx` ON `mood_logs` (`date`);--> statement-breakpoint
CREATE TABLE `people` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`relationship` text,
	`cadence_days` integer NOT NULL,
	`last_contacted_at` text,
	`birthday` text,
	`notes` text,
	`archived` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`device_label` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subs_endpoint_idx` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE TABLE `quarterly_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quarter_starting` text NOT NULL,
	`photo_front_url` text,
	`photo_side_url` text,
	`weight_kg` real,
	`waist_cm` real,
	`net_worth` real,
	`reflection` text,
	`next_quarter_theme` text,
	`submitted_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quarterly_reviews_quarter_idx` ON `quarterly_reviews` (`quarter_starting`);--> statement-breakpoint
CREATE TABLE `reading_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`book_id` integer,
	`pages_read` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `reminder_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reminder_key` text NOT NULL,
	`fired_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`habit_slug` text
);
--> statement-breakpoint
CREATE TABLE `screen_time_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`instagram_minutes` integer,
	`whatsapp_minutes` integer,
	`total_phone_minutes` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `screen_time_logs_date_idx` ON `screen_time_logs` (`date`);--> statement-breakpoint
CREATE TABLE `sleep_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`bedtime` text,
	`wake_time` text,
	`duration_minutes` integer,
	`quality_1_5` integer,
	`notes` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sleep_logs_date_idx` ON `sleep_logs` (`date`);--> statement-breakpoint
CREATE TABLE `weekly_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week_starting` text NOT NULL,
	`q1_worked` text,
	`q2_didnt_work` text,
	`q3_streak_at_risk` text,
	`q4_ship_target` text,
	`q5_call_overdue` text,
	`submitted_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_reviews_week_idx` ON `weekly_reviews` (`week_starting`);