-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "documentId" TEXT;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
