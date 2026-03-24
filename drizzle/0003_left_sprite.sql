ALTER TABLE `packet_assets` ADD `storage_provider` text DEFAULT 'local' NOT NULL;--> statement-breakpoint
ALTER TABLE `packet_assets` ADD `storage_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `packet_assets` ADD `storage_asset_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `packet_assets` ADD `storage_resource_type` text DEFAULT 'raw' NOT NULL;