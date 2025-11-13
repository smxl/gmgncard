ALTER TABLE `users` ADD COLUMN `password_hash` text;
ALTER TABLE `users` ADD COLUMN `role` text NOT NULL DEFAULT 'user';
