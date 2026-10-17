CREATE TABLE `feed_events` (
	`sequence` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`card_id` text NOT NULL,
	`course_id` text NOT NULL,
	`kind` text NOT NULL,
	`mode` text NOT NULL,
	`preference` text,
	`outcome` text,
	`user_response` text,
	`duration_ms` integer,
	`payload` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `study_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feed_events_user_event_idx` ON `feed_events` (`user_id`,`event_id`);--> statement-breakpoint
CREATE INDEX `feed_events_user_card_seq_idx` ON `feed_events` (`user_id`,`card_id`,`sequence`);