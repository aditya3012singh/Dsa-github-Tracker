/*
  Warnings:

  - You are about to drop the column `atcoderRating` on the `CodingStats` table. All the data in the column will be lost.
  - You are about to drop the column `hackerearthRating` on the `CodingStats` table. All the data in the column will be lost.
  - You are about to drop the column `hackerrankScore` on the `CodingStats` table. All the data in the column will be lost.
  - You are about to drop the column `atcoderHandle` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `hackerearthHandle` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `hackerrankHandle` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetToken]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CodingStats" DROP COLUMN "atcoderRating",
DROP COLUMN "hackerearthRating",
DROP COLUMN "hackerrankScore",
ADD COLUMN     "codechefSolved" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "githubContributions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "githubFollowers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "githubFollowing" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "githubRepos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "atcoderHandle",
DROP COLUMN "hackerearthHandle",
DROP COLUMN "hackerrankHandle",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "githubHandle" TEXT,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "section" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_resetToken_key" ON "Student"("resetToken");
