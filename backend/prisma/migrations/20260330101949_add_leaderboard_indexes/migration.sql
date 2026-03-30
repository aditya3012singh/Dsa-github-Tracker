/*
  Warnings:

  - Made the column `libraryId` on table `Student` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "FetchJob" DROP CONSTRAINT "FetchJob_studentId_fkey";

-- DropIndex
DROP INDEX "Student_rollNo_key";

-- AlterTable
ALTER TABLE "CodingStats" ADD COLUMN     "totalSolved" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "rollNo" DROP NOT NULL,
ALTER COLUMN "libraryId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "CodingStats_overallScore_idx" ON "CodingStats"("overallScore" DESC);

-- CreateIndex
CREATE INDEX "CodingStats_totalSolved_idx" ON "CodingStats"("totalSolved" DESC);

-- CreateIndex
CREATE INDEX "CodingStats_leetcodeSolved_idx" ON "CodingStats"("leetcodeSolved" DESC);

-- CreateIndex
CREATE INDEX "CodingStats_codeforcesRating_idx" ON "CodingStats"("codeforcesRating" DESC);

-- CreateIndex
CREATE INDEX "CodingStats_gfgSolved_idx" ON "CodingStats"("gfgSolved" DESC);

-- CreateIndex
CREATE INDEX "Student_year_idx" ON "Student"("year");

-- CreateIndex
CREATE INDEX "Student_branch_idx" ON "Student"("branch");

-- CreateIndex
CREATE INDEX "Student_section_idx" ON "Student"("section");
