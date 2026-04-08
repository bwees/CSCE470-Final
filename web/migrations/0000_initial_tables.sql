CREATE TABLE `user_movie_ratings` (
	`user_id` text NOT NULL,
	`movie_id` integer NOT NULL,
	`rating` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_movie_ratings_user_id_movie_id_unique` ON `user_movie_ratings` (`user_id`,`movie_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `watchlist_movies` (
	`watchlist_id` integer NOT NULL,
	`movie_id` integer NOT NULL,
	FOREIGN KEY (`watchlist_id`) REFERENCES `watchlists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `watchlist_movies_watchlist_id_movie_id_unique` ON `watchlist_movies` (`watchlist_id`,`movie_id`);--> statement-breakpoint
CREATE TABLE `watchlists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
