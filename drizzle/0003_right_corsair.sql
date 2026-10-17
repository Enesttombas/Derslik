CREATE TABLE `akis_kart_durumu` (
	`user_id` text NOT NULL,
	`kart_id` text NOT NULL,
	`sonraki_tekrar` text NOT NULL,
	`aralik` integer DEFAULT 0 NOT NULL,
	`kolaylik` real DEFAULT 2.5 NOT NULL,
	`tekrar` integer DEFAULT 0 NOT NULL,
	`dogru` integer DEFAULT 0 NOT NULL,
	`yanlis` integer DEFAULT 0 NOT NULL,
	`goruldu` integer DEFAULT 0 NOT NULL,
	`tercih` text,
	`guncellendi` text NOT NULL,
	PRIMARY KEY(`user_id`, `kart_id`)
);
--> statement-breakpoint
CREATE TABLE `akis_olaylari` (
	`sequence` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`kart_id` text NOT NULL,
	`kind` text NOT NULL,
	`mode` text NOT NULL,
	`outcome` text,
	`secim` text,
	`payload` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `akis_olaylari_user_event_idx` ON `akis_olaylari` (`user_id`,`event_id`);--> statement-breakpoint
CREATE INDEX `akis_olaylari_user_kart_seq_idx` ON `akis_olaylari` (`user_id`,`kart_id`,`sequence`);