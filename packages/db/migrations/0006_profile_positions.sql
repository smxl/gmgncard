ALTER TABLE `user_profiles` RENAME COLUMN `top_position` TO `position_top`;
ALTER TABLE `user_profiles` RENAME COLUMN `bottom_position` TO `position_bottom`;
ALTER TABLE `user_profiles` ADD COLUMN `position_vers` text;
ALTER TABLE `user_profiles` ADD COLUMN `position_side` text;
ALTER TABLE `user_profiles` ADD COLUMN `position_hide` integer DEFAULT 0 NOT NULL;
ALTER TABLE `user_profiles` ADD COLUMN `height` integer;
ALTER TABLE `user_profiles` ADD COLUMN `weight` integer;
