-- CreateTable
CREATE TABLE `profiles` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(100) NULL,
    `last_name` VARCHAR(100) NULL,
    `display_name` VARCHAR(150) NULL,
    `bio` TEXT NULL,
    `birth_date` DATE NULL,
    `pais` VARCHAR(100) NULL,
    `provincia` VARCHAR(100) NULL,
    `ciudad` VARCHAR(100) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `avatar_type` ENUM('DEFAULT', 'UPLOADED') NOT NULL DEFAULT 'DEFAULT',
    `avatar_url` VARCHAR(1000) NULL,
    `default_avatar` VARCHAR(50) NULL,
    `favorite_genres` TEXT NULL,
    `reading_goal` INTEGER NULL,
    `is_profile_public` BOOLEAN NOT NULL DEFAULT true,
    `show_location` BOOLEAN NOT NULL DEFAULT false,
    `show_stats` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `profiles_user_id_key`(`user_id`),
    INDEX `profiles_user_id_idx`(`user_id`),
    INDEX `profiles_pais_idx`(`pais`),
    INDEX `profiles_ciudad_idx`(`ciudad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `email_enabled` BOOLEAN NOT NULL DEFAULT true,
    `push_enabled` BOOLEAN NOT NULL DEFAULT true,
    `friend_requests` BOOLEAN NOT NULL DEFAULT true,
    `group_invites` BOOLEAN NOT NULL DEFAULT true,
    `new_messages` BOOLEAN NOT NULL DEFAULT true,
    `reading_reminders` BOOLEAN NOT NULL DEFAULT true,
    `achievements` BOOLEAN NOT NULL DEFAULT true,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notification_settings_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `device_type` VARCHAR(50) NOT NULL,
    `device_name` VARCHAR(100) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_used_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `device_tokens_token_key`(`token`),
    INDEX `device_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
