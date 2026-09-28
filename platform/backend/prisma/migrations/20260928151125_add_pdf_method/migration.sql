-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "pdfId" TEXT;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_pdfId_fkey" FOREIGN KEY ("pdfId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
