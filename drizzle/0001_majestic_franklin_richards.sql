CREATE TABLE `pdf_workspaces` (
	`pdf_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`document` text NOT NULL,
	`last_mutation_id` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`pdf_id`) REFERENCES `pdf_sources`(`id`) ON UPDATE no action ON DELETE cascade
);
