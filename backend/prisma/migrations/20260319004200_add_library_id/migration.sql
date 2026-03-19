/*
  Warnings:

  - A unique constraint covering the columns `[libraryId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "libraryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_libraryId_key" ON "Student"("libraryId");
