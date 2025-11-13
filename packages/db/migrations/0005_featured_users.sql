ALTER TABLE `users` ADD COLUMN `is_featured` integer DEFAULT 0 NOT NULL;
ALTER TABLE `users` ADD COLUMN `ad_label` text;
