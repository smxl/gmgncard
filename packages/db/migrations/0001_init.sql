-- drizzle-kit snapshot
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`handle` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text,
	`avatar_url` text,
	`bio` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);

CREATE UNIQUE INDEX `users_handle_idx` ON `users` (`handle`);
CREATE INDEX `users_email_idx` ON `users` (`email`);

CREATE TABLE `user_profiles` (
	`user_id` integer NOT NULL,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`p_size` text,
	`f_size` text,
	`age` integer,
	`wechat_qr_url` text,
	`group_qr_url` text,
	`extra` text,
	`verified_by` integer,
	`verified_at` text,
	`notes` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT `user_profiles_user_id_pk` PRIMARY KEY(`user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `user_profiles_status_idx` ON `user_profiles` (`verification_status`);

CREATE TABLE `link_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`description` text
);

CREATE UNIQUE INDEX `link_types_slug_idx` ON `link_types` (`slug`);

CREATE TABLE `links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type_id` integer,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`is_hidden` integer DEFAULT 0 NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`type_id`) REFERENCES `link_types`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `links_user_idx` ON `links` (`user_id`);
CREATE INDEX `links_type_idx` ON `links` (`type_id`);

CREATE TABLE `buttons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`label` text NOT NULL,
	`url` text NOT NULL,
	`icon` text,
	`order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `buttons_user_idx` ON `buttons` (`user_id`);

CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`theme` text DEFAULT 'default' NOT NULL,
	`blocks` text,
	`published_at` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `pages_slug_idx` ON `pages` (`slug`);
CREATE INDEX `pages_user_idx` ON `pages` (`user_id`);

CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);

CREATE TABLE `visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`link_id` integer NOT NULL,
	`user_agent` text,
	`country` text,
	`referrer` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `visits_link_idx` ON `visits` (`link_id`);

CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`link_id` integer,
	`reporter_email` text,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`metadata` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `reports_status_idx` ON `reports` (`status`);

CREATE TABLE `social_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`provider` text NOT NULL,
	`handle` text NOT NULL,
	`url` text NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `social_accounts_provider_idx` ON `social_accounts` (`provider`, `user_id`);
