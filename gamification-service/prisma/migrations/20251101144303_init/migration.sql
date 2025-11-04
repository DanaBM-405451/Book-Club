-- CreateTable
CREATE TABLE `user_stats` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `totalXP` INTEGER NOT NULL DEFAULT 0,
    `currentLevel` INTEGER NOT NULL DEFAULT 1,
    `xpForNextLevel` INTEGER NOT NULL DEFAULT 100,
    `totalPagesRead` INTEGER NOT NULL DEFAULT 0,
    `totalBooksRead` INTEGER NOT NULL DEFAULT 0,
    `totalBooksStarted` INTEGER NOT NULL DEFAULT 0,
    `currentStreak` INTEGER NOT NULL DEFAULT 0,
    `longestStreak` INTEGER NOT NULL DEFAULT 0,
    `lastReadDate` DATETIME(3) NULL,
    `totalReadingTime` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_stats_userId_key`(`userId`),
    INDEX `user_stats_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievements` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `icon` VARCHAR(191) NULL,
    `category` ENUM('READING', 'COLLECTION', 'SOCIAL', 'STREAK', 'SPECIAL') NOT NULL DEFAULT 'READING',
    `requirement` TEXT NOT NULL,
    `xpReward` INTEGER NOT NULL DEFAULT 0,
    `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY') NOT NULL DEFAULT 'COMMON',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `achievements_key_key`(`key`),
    INDEX `achievements_category_idx`(`category`),
    INDEX `achievements_rarity_idx`(`rarity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_achievements` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `achievementId` VARCHAR(191) NOT NULL,
    `unlockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_achievements_userId_idx`(`userId`),
    INDEX `user_achievements_achievementId_idx`(`achievementId`),
    UNIQUE INDEX `user_achievements_userId_achievementId_key`(`userId`, `achievementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reading_activities` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `pagesRead` INTEGER NOT NULL DEFAULT 0,
    `minutesRead` INTEGER NOT NULL DEFAULT 0,
    `booksRead` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reading_activities_userId_idx`(`userId`),
    INDEX `reading_activities_date_idx`(`date`),
    UNIQUE INDEX `reading_activities_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `achievements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
