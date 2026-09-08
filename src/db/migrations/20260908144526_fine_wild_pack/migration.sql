CREATE TABLE `entries` (
	`id` text PRIMARY KEY,
	`entry_type` text NOT NULL,
	`title` text NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entry_labels` (
	`entry_id` text NOT NULL,
	`label_id` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `entry_labels_pk` PRIMARY KEY(`entry_id`, `label_id`),
	CONSTRAINT `fk_entry_labels_entry_id_entries_id_fk` FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_entry_labels_label_id_labels_id_fk` FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `labels` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL UNIQUE,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `list_items` (
	`id` text PRIMARY KEY,
	`list_entry_id` text NOT NULL,
	`sublist_id` text,
	`item_type` text NOT NULL,
	`content` text NOT NULL,
	`is_checked` integer DEFAULT false NOT NULL,
	`sort_order` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_list_items_list_entry_id_lists_entry_id_fk` FOREIGN KEY (`list_entry_id`) REFERENCES `lists`(`entry_id`) ON DELETE CASCADE,
	CONSTRAINT `fk_list_items_sublist_id_sublists_id_fk` FOREIGN KEY (`sublist_id`) REFERENCES `sublists`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `lists` (
	`entry_id` text PRIMARY KEY,
	CONSTRAINT `fk_lists_entry_id_entries_id_fk` FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`entry_id` text PRIMARY KEY,
	`body_html` text DEFAULT '' NOT NULL,
	`body_plain_text` text DEFAULT '' NOT NULL,
	CONSTRAINT `fk_notes_entry_id_entries_id_fk` FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `sublists` (
	`id` text PRIMARY KEY,
	`list_entry_id` text NOT NULL,
	`title` text NOT NULL,
	`sort_order` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_sublists_list_entry_id_lists_entry_id_fk` FOREIGN KEY (`list_entry_id`) REFERENCES `lists`(`entry_id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `entries_entry_type_idx` ON `entries` (`entry_type`);--> statement-breakpoint
CREATE INDEX `entries_updated_at_idx` ON `entries` (`updated_at`);--> statement-breakpoint
CREATE INDEX `entries_title_nocase_idx` ON `entries` ("title" collate nocase);--> statement-breakpoint
CREATE INDEX `list_items_list_entry_id_sublist_id_sort_order_idx` ON `list_items` (`list_entry_id`,`sublist_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `list_items_content_nocase_idx` ON `list_items` ("content" collate nocase);--> statement-breakpoint
CREATE INDEX `sublists_list_entry_id_sort_order_idx` ON `sublists` (`list_entry_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `sublists_title_nocase_idx` ON `sublists` ("title" collate nocase);