-- CreateTable
-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rollNo" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "leetcodeHandle" TEXT,
    "codeforcesHandle" TEXT,
    "gfgHandle" TEXT,
    "codechefHandle" TEXT,
    "hackerrankHandle" TEXT,
    "hackerearthHandle" TEXT,
    "atcoderHandle" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingStats" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "leetcodeSolved" INTEGER NOT NULL DEFAULT 0,
    "leetcodeEasy" INTEGER NOT NULL DEFAULT 0,
    "leetcodeMedium" INTEGER NOT NULL DEFAULT 0,
    "leetcodeHard" INTEGER NOT NULL DEFAULT 0,
    "codeforcesRating" INTEGER NOT NULL DEFAULT 0,
    "codeforcesMaxRating" INTEGER NOT NULL DEFAULT 0,
    "codechefRating" INTEGER NOT NULL DEFAULT 0,
    "gfgSolved" INTEGER NOT NULL DEFAULT 0,
    "hackerrankScore" INTEGER NOT NULL DEFAULT 0,
    "hackerearthRating" INTEGER NOT NULL DEFAULT 0,
    "atcoderRating" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodingStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FetchJob" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastRun" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FetchJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNo_key" ON "Student"("rollNo");

-- CreateIndex
CREATE UNIQUE INDEX "CodingStats_studentId_key" ON "CodingStats"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "FetchJob_studentId_platform_key" ON "FetchJob"("studentId", "platform");

-- AddForeignKey
ALTER TABLE "CodingStats" ADD CONSTRAINT "CodingStats_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FetchJob" ADD CONSTRAINT "FetchJob_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
