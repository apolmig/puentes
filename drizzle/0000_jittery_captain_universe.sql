CREATE TABLE `packet_review_items` (
	`id` text PRIMARY KEY NOT NULL,
	`packet_id` text NOT NULL,
	`label` text NOT NULL,
	`checked` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`packet_id`) REFERENCES `packets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `packet_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`packet_id` text NOT NULL,
	`label` text NOT NULL,
	`type` text NOT NULL,
	`detail` text NOT NULL,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`packet_id`) REFERENCES `packets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `packet_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`packet_id` text NOT NULL,
	`audience` text NOT NULL,
	`format` text NOT NULL,
	`hook` text NOT NULL,
	`body` text NOT NULL,
	`cta` text NOT NULL,
	FOREIGN KEY (`packet_id`) REFERENCES `packets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `packet_variants_packet_audience_idx` ON `packet_variants` (`packet_id`,`audience`);--> statement-breakpoint
CREATE TABLE `packets` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`pulse` text NOT NULL,
	`intake_format` text NOT NULL,
	`source_link` text NOT NULL,
	`claim` text NOT NULL,
	`truth` text NOT NULL,
	`risk` text NOT NULL,
	`status` text NOT NULL,
	`review_notes` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
