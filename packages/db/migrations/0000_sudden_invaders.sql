CREATE TABLE `note_updates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`note_id` text NOT NULL,
	`update_blob` blob NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_note_updates_note` ON `note_updates` (`note_id`,`id`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`folder_id` text,
	`workspace_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
