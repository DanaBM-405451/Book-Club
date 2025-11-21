-- CreateTable
CREATE TABLE `friendships` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `friend_id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED') NOT NULL DEFAULT 'PENDING',
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `accepted_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `friendships_user_id_idx`(`user_id`),
    INDEX `friendships_friend_id_idx`(`friend_id`),
    INDEX `friendships_status_idx`(`status`),
    UNIQUE INDEX `friendships_user_id_friend_id_key`(`user_id`, `friend_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `max_members` INTEGER NOT NULL DEFAULT 5,
    `is_public` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `groups_created_by_idx`(`created_by`),
    INDEX `groups_is_public_idx`(`is_public`),
    INDEX `groups_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `can_upload_books` BOOLEAN NOT NULL DEFAULT false,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `group_members_user_id_idx`(`user_id`),
    INDEX `group_members_group_id_idx`(`group_id`),
    INDEX `group_members_role_idx`(`role`),
    UNIQUE INDEX `group_members_group_id_user_id_key`(`group_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `book_id` INTEGER NULL,
    `book_title` VARCHAR(500) NULL,
    `book_author` VARCHAR(300) NULL,
    `book_cover_url` VARCHAR(1000) NULL,
    `uploaded_file_url` VARCHAR(1000) NULL,
    `file_type` ENUM('PDF', 'EPUB') NULL,
    `is_pinned` BOOLEAN NOT NULL DEFAULT false,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `group_posts_group_id_idx`(`group_id`),
    INDEX `group_posts_user_id_idx`(`user_id`),
    INDEX `group_posts_created_at_idx`(`created_at`),
    INDEX `group_posts_is_pinned_idx`(`is_pinned`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `parent_comment_id` INTEGER NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `group_comments_post_id_idx`(`post_id`),
    INDEX `group_comments_user_id_idx`(`user_id`),
    INDEX `group_comments_parent_comment_id_idx`(`parent_comment_id`),
    INDEX `group_comments_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reading_goals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `book_id` INTEGER NOT NULL,
    `book_title` VARCHAR(500) NOT NULL,
    `book_author` VARCHAR(300) NULL,
    `book_cover_url` VARCHAR(1000) NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `target_pages` INTEGER NULL,
    `frequency` ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY') NOT NULL DEFAULT 'WEEKLY',
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reading_goals_group_id_idx`(`group_id`),
    INDEX `reading_goals_created_by_idx`(`created_by`),
    INDEX `reading_goals_status_idx`(`status`),
    INDEX `reading_goals_start_date_idx`(`start_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_book_proposals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `proposed_by` VARCHAR(191) NOT NULL,
    `book_id` INTEGER NULL,
    `book_title` VARCHAR(500) NOT NULL,
    `book_author` VARCHAR(300) NULL,
    `book_cover_url` VARCHAR(1000) NULL,
    `book_description` TEXT NULL,
    `source` ENUM('LIBRARY', 'GOOGLE_BOOKS', 'MANUAL') NOT NULL DEFAULT 'LIBRARY',
    `voting_end_date` DATETIME(3) NULL,
    `total_votes` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `is_winner` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `closed_at` DATETIME(3) NULL,

    INDEX `group_book_proposals_group_id_idx`(`group_id`),
    INDEX `group_book_proposals_proposed_by_idx`(`proposed_by`),
    INDEX `group_book_proposals_status_idx`(`status`),
    INDEX `group_book_proposals_is_winner_idx`(`is_winner`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proposal_votes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `proposal_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `voted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `proposal_votes_proposal_id_idx`(`proposal_id`),
    INDEX `proposal_votes_user_id_idx`(`user_id`),
    UNIQUE INDEX `proposal_votes_proposal_id_user_id_key`(`proposal_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_challenges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `book_id` INTEGER NOT NULL,
    `book_title` VARCHAR(500) NOT NULL,
    `book_author` VARCHAR(300) NULL,
    `book_cover_url` VARCHAR(1000) NULL,
    `total_pages` INTEGER NOT NULL,
    `from_proposal_id` INTEGER NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `archived_at` DATETIME(3) NULL,

    INDEX `group_challenges_group_id_idx`(`group_id`),
    INDEX `group_challenges_created_by_idx`(`created_by`),
    INDEX `group_challenges_status_idx`(`status`),
    INDEX `group_challenges_start_date_idx`(`start_date`),
    INDEX `group_challenges_from_proposal_id_idx`(`from_proposal_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `challenge_progress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `challenge_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `current_page` INTEGER NOT NULL DEFAULT 0,
    `progress_percent` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `points_earned` INTEGER NOT NULL DEFAULT 0,
    `is_completed` BOOLEAN NOT NULL DEFAULT false,
    `completed_at` DATETIME(3) NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `challenge_progress_challenge_id_idx`(`challenge_id`),
    INDEX `challenge_progress_user_id_idx`(`user_id`),
    INDEX `challenge_progress_points_earned_idx`(`points_earned`),
    INDEX `challenge_progress_is_completed_idx`(`is_completed`),
    UNIQUE INDEX `challenge_progress_challenge_id_user_id_key`(`challenge_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `sender_id` VARCHAR(191) NULL,
    `type` ENUM('FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'GROUP_INVITE', 'GROUP_JOINED', 'GROUP_LEFT', 'NEW_POST', 'NEW_COMMENT', 'GOAL_CREATED', 'GOAL_COMPLETED', 'PROPOSAL_CREATED', 'PROPOSAL_WINNER', 'NEW_VOTE', 'CHALLENGE_STARTED', 'CHALLENGE_COMPLETED', 'CHALLENGE_ARCHIVED', 'PROGRESS_UPDATE') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `metadata` TEXT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_idx`(`user_id`),
    INDEX `notifications_sender_id_idx`(`sender_id`),
    INDEX `notifications_is_read_idx`(`is_read`),
    INDEX `notifications_created_at_idx`(`created_at`),
    INDEX `notifications_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_posts` ADD CONSTRAINT `group_posts_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_comments` ADD CONSTRAINT `group_comments_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `group_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_comments` ADD CONSTRAINT `group_comments_parent_comment_id_fkey` FOREIGN KEY (`parent_comment_id`) REFERENCES `group_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reading_goals` ADD CONSTRAINT `reading_goals_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_book_proposals` ADD CONSTRAINT `group_book_proposals_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proposal_votes` ADD CONSTRAINT `proposal_votes_proposal_id_fkey` FOREIGN KEY (`proposal_id`) REFERENCES `group_book_proposals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_challenges` ADD CONSTRAINT `group_challenges_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challenge_progress` ADD CONSTRAINT `challenge_progress_challenge_id_fkey` FOREIGN KEY (`challenge_id`) REFERENCES `group_challenges`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
