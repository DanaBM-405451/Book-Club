-- AlterTable
ALTER TABLE `user_books` ADD COLUMN `last_read_at` DATETIME(3) NULL,
    ADD COLUMN `last_read_position` VARCHAR(500) NULL,
    ADD COLUMN `total_annotations` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `total_bookmarks` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `total_reading_time_minutes` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `annotations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `book_id` INTEGER NOT NULL,
    `user_book_id` INTEGER NOT NULL,
    `type` ENUM('HIGHLIGHT', 'UNDERLINE', 'NOTE', 'BOOKMARK') NOT NULL DEFAULT 'HIGHLIGHT',
    `chapter` VARCHAR(255) NULL,
    `page` INTEGER NULL,
    `start_offset` INTEGER NULL,
    `end_offset` INTEGER NULL,
    `selected_text` TEXT NULL,
    `note_content` TEXT NULL,
    `highlight_color` VARCHAR(7) NULL,
    `context` TEXT NULL,
    `cfi` VARCHAR(500) NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `is_favorite` BOOLEAN NOT NULL DEFAULT false,
    `points_awarded` INTEGER NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `annotations_user_id_idx`(`user_id`),
    INDEX `annotations_user_book_id_idx`(`user_book_id`),
    INDEX `annotations_type_idx`(`type`),
    INDEX `annotations_is_favorite_idx`(`is_favorite`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookmarks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `book_id` INTEGER NOT NULL,
    `user_book_id` INTEGER NOT NULL,
    `chapter` VARCHAR(255) NULL,
    `page` INTEGER NULL,
    `scroll_position` INTEGER NULL,
    `cfi` VARCHAR(500) NULL,
    `title` VARCHAR(255) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bookmarks_user_id_idx`(`user_id`),
    INDEX `bookmarks_user_book_id_idx`(`user_book_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reading_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `book_id` INTEGER NOT NULL,
    `user_book_id` INTEGER NOT NULL,
    `start_page` INTEGER NOT NULL,
    `end_page` INTEGER NOT NULL,
    `pages_read` INTEGER NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `points_earned` INTEGER NOT NULL DEFAULT 0,
    `achievementsUnlocked` TEXT NULL,
    `deviceType` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reading_sessions_user_id_idx`(`user_id`),
    INDEX `reading_sessions_user_book_id_idx`(`user_book_id`),
    INDEX `reading_sessions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `annotations` ADD CONSTRAINT `annotations_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `annotations` ADD CONSTRAINT `annotations_user_book_id_fkey` FOREIGN KEY (`user_book_id`) REFERENCES `user_books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_user_book_id_fkey` FOREIGN KEY (`user_book_id`) REFERENCES `user_books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reading_sessions` ADD CONSTRAINT `reading_sessions_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reading_sessions` ADD CONSTRAINT `reading_sessions_user_book_id_fkey` FOREIGN KEY (`user_book_id`) REFERENCES `user_books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
