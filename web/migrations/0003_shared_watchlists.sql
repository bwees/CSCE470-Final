CREATE TABLE `shared_list_members` (
	`shared_list_id` integer NOT NULL,
	`watchlist_id` integer NOT NULL,
	FOREIGN KEY (`shared_list_id`) REFERENCES `shared_lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`watchlist_id`) REFERENCES `watchlists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shared_list_members_shared_list_id_watchlist_id_unique` ON `shared_list_members` (`shared_list_id`,`watchlist_id`);--> statement-breakpoint
CREATE TABLE `shared_lists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `watchlists` ADD `share_code` text DEFAULT '' NOT NULL;