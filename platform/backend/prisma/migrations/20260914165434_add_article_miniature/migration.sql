-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "miniatureId" TEXT;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_miniatureId_fkey" FOREIGN KEY ("miniatureId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
