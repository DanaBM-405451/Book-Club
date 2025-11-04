/*
  Warnings:

  - You are about to drop the column `age` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `age`,
    DROP COLUMN `city`,
    DROP COLUMN `country`,
    ADD COLUMN `ciudad` VARCHAR(191) NULL,
    ADD COLUMN `edad` INTEGER NULL,
    ADD COLUMN `pais` VARCHAR(191) NULL;
