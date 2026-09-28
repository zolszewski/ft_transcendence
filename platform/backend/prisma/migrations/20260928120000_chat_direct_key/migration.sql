-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "directKey" TEXT;

-- Remplit directKey pour les conversations déjà existantes (userId triés, joints par ":")
UPDATE "Conversation" c
SET "directKey" = (
    SELECT string_agg(p."userId", ':' ORDER BY p."userId" COLLATE "C")
    FROM "ConversationParticipant" p
    WHERE p."conversationId" = c."id"
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_directKey_key" ON "Conversation"("directKey");
