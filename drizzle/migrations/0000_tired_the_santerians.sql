CREATE TABLE `local_performance` (
	`user_id` text NOT NULL,
	`word_id` integer NOT NULL,
	`success_count` integer DEFAULT 0,
	`failure_count` integer DEFAULT 0,
	`next_review` integer,
	`is_synced` integer DEFAULT false,
	PRIMARY KEY(`user_id`, `word_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user_stats`(`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`word_id`) REFERENCES `vocabulary`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_stats` (
	`user_id` text PRIMARY KEY NOT NULL,
	`proficiency_level` text DEFAULT 'beginner',
	`daily_streak` integer DEFAULT 0,
	`interests` text,
	`last_sync` integer
);
--> statement-breakpoint
CREATE TABLE `vocabulary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hangeul` text NOT NULL,
	`romanization` text,
	`english` text NOT NULL,
	`category` text NOT NULL,
	`tags` text,
	`difficulty` integer DEFAULT 1,
	`audio_path` text
);
