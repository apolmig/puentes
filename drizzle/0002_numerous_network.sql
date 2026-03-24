CREATE TABLE `packet_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`packet_id` text NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`url` text NOT NULL,
	`created_at` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`packet_id`) REFERENCES `packets`(`id`) ON UPDATE no action ON DELETE cascade
);
