-- Topshiriq rejimi jadvallari (faqat qo'shadi, hech narsani o'chirmaydi).
-- DIQQAT: 'prisma db push' ishlatmang — u bazadagi masofa_results jadvalini o'chirib yuboradi.
-- Ishga tushirish: npx prisma db execute --file prisma/manual/2026-11-19_assignments.sql --schema prisma/schema.prisma

BEGIN;

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "questions" JSONB NOT NULL,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "timePerQuestion" INTEGER NOT NULL DEFAULT 0,
    "shuffle" BOOLEAN NOT NULL DEFAULT true,
    "showAnswers" TEXT NOT NULL DEFAULT 'AFTER_SUBMIT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_attempts" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "groupName" TEXT NOT NULL DEFAULT '',
    "deviceId" TEXT NOT NULL,
    "userId" TEXT,
    "order" JSONB NOT NULL,
    "servedIndex" INTEGER NOT NULL DEFAULT -1,
    "servedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "assignment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "selected" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeMs" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assignments_code_key" ON "assignments"("code");

-- CreateIndex
CREATE INDEX "assignments_teacherId_idx" ON "assignments"("teacherId");

-- CreateIndex
CREATE INDEX "assignment_attempts_assignmentId_idx" ON "assignment_attempts"("assignmentId");

-- CreateIndex
CREATE INDEX "assignment_attempts_assignmentId_deviceId_idx" ON "assignment_attempts"("assignmentId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_answers_attemptId_questionIndex_key" ON "assignment_answers"("attemptId", "questionIndex");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_attempts" ADD CONSTRAINT "assignment_attempts_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_answers" ADD CONSTRAINT "assignment_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "assignment_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
