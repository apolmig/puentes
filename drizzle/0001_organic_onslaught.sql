CREATE TABLE `packet_signals` (
	`id` text PRIMARY KEY NOT NULL,
	`packet_id` text NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`platform` text NOT NULL,
	`summary` text NOT NULL,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`packet_id`) REFERENCES `packets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `packets` ADD `channel` text NOT NULL;--> statement-breakpoint
ALTER TABLE `packets` ADD `region` text NOT NULL;--> statement-breakpoint
ALTER TABLE `packets` ADD `urgency` text NOT NULL;--> statement-breakpoint
ALTER TABLE `packets` ADD `confidence` text NOT NULL;--> statement-breakpoint
ALTER TABLE `packets` ADD `lead_audience` text NOT NULL;