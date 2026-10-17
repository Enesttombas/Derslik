CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pdf_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`unit_id` text,
	`user_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`mime_type` text DEFAULT 'application/pdf' NOT NULL,
	`storage_key` text NOT NULL,
	`page_count` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `review_events` (
	`id` text PRIMARY KEY NOT NULL,
	`study_item_id` text NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`rating` text NOT NULL,
	`user_response` text,
	`reviewed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`study_item_id`) REFERENCES `study_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `study_items` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`unit_id` text,
	`pdf_source_id` text,
	`source_page` integer,
	`user_id` text NOT NULL,
	`kind` text DEFAULT 'flashcard' NOT NULL,
	`prompt` text NOT NULL,
	`answer` text NOT NULL,
	`hint` text,
	`interval_days` integer DEFAULT 0 NOT NULL,
	`ease_factor` real DEFAULT 2.5 NOT NULL,
	`repetition_count` integer DEFAULT 0 NOT NULL,
	`last_reviewed_at` text,
	`next_review_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `study_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`unit_id` text,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
