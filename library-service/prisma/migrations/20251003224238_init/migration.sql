-- CreateTable
CREATE TABLE `books` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `source` ENUM('GOOGLE_BOOKS', 'MANUAL', 'ISBN', 'COMMUNITY', 'PDF', 'EPUB') NOT NULL DEFAULT 'MANUAL',
    `google_book_id` VARCHAR(191) NULL,
    `isbn10` VARCHAR(191) NULL,
    `isbn13` VARCHAR(191) NULL,
    `titulo` VARCHAR(500) NOT NULL,
    `subtitulo` VARCHAR(500) NULL,
    `autor` TEXT NOT NULL,
    `publicacion` VARCHAR(255) NULL,
    `published_date` VARCHAR(191) NULL,
    `descripcion` TEXT NULL,
    `page_count` INTEGER NULL,
    `categorias` TEXT NULL,
    `idioma` VARCHAR(10) NULL DEFAULT 'es',
    `cover_image_url` VARCHAR(1000) NULL,
    `pdf_file_url` VARCHAR(1000) NULL,
    `epub_file_url` VARCHAR(1000) NULL,
    `thumbnail` VARCHAR(1000) NULL,
    `preview_link` VARCHAR(1000) NULL,
    `average_rating` DECIMAL(3, 2) NULL,
    `ratings_count` INTEGER NULL DEFAULT 0,
    `uploaded_by_user_id` VARCHAR(191) NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT true,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `books_google_book_id_key`(`google_book_id`),
    UNIQUE INDEX `books_isbn10_key`(`isbn10`),
    UNIQUE INDEX `books_isbn13_key`(`isbn13`),
    INDEX `books_titulo_idx`(`titulo`),
    INDEX `books_google_book_id_idx`(`google_book_id`),
    INDEX `books_uploaded_by_user_id_idx`(`uploaded_by_user_id`),
    INDEX `books_is_public_idx`(`is_public`),
    INDEX `books_is_deleted_idx`(`is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_books` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` VARCHAR(191) NOT NULL,
    `book_id` INTEGER NOT NULL,
    `added_by_user_id` VARCHAR(191) NOT NULL,
    `status` ENUM('SUGGESTED', 'SELECTED', 'READING', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'SUGGESTED',
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `target_pages_per_day` INTEGER NULL,
    `members_reading` INTEGER NOT NULL DEFAULT 0,
    `members_finished` INTEGER NOT NULL DEFAULT 0,
    `added_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `group_books_group_id_idx`(`group_id`),
    INDEX `group_books_status_idx`(`status`),
    UNIQUE INDEX `group_books_group_id_book_id_key`(`group_id`, `book_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_books` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `book_id` INTEGER NOT NULL,
    `status` ENUM('QUIERO_LEER', 'LEYENDO', 'COMPLETADO', 'EN_ESPERA', 'ABANDONADO') NOT NULL DEFAULT 'QUIERO_LEER',
    `current_page` INTEGER NOT NULL DEFAULT 0,
    `total_pages` INTEGER NOT NULL,
    `progress_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `rating` DECIMAL(2, 1) NULL,
    `is_favorite` BOOLEAN NOT NULL DEFAULT false,
    `tags` TEXT NULL,
    `started_at` DATETIME(3) NULL,
    `finished_at` DATETIME(3) NULL,
    `added_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_books_user_id_idx`(`user_id`),
    INDEX `user_books_status_idx`(`status`),
    INDEX `user_books_rating_idx`(`rating`),
    UNIQUE INDEX `user_books_user_id_book_id_key`(`user_id`, `book_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `book_id` INTEGER NOT NULL,
    `user_book_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NULL,
    `content` TEXT NOT NULL,
    `page` INTEGER NULL,
    `chapter` VARCHAR(255) NULL,
    `type` ENUM('NOTE', 'HIGHLIGHT', 'REVIEW', 'THOUGHT') NOT NULL DEFAULT 'NOTE',
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notes_user_id_idx`(`user_id`),
    INDEX `notes_user_book_id_idx`(`user_book_id`),
    INDEX `notes_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reading_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `user_book_id` INTEGER NOT NULL,
    `pages_read` INTEGER NOT NULL,
    `from_page` INTEGER NOT NULL,
    `to_page` INTEGER NOT NULL,
    `duration_minutes` INTEGER NULL,
    `device_type` VARCHAR(50) NULL,
    `read_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reading_logs_user_id_idx`(`user_id`),
    INDEX `reading_logs_user_book_id_idx`(`user_book_id`),
    INDEX `reading_logs_read_at_idx`(`read_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `group_books` ADD CONSTRAINT `group_books_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_books` ADD CONSTRAINT `user_books_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notes` ADD CONSTRAINT `notes_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notes` ADD CONSTRAINT `notes_user_book_id_fkey` FOREIGN KEY (`user_book_id`) REFERENCES `user_books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reading_logs` ADD CONSTRAINT `reading_logs_user_book_id_fkey` FOREIGN KEY (`user_book_id`) REFERENCES `user_books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
