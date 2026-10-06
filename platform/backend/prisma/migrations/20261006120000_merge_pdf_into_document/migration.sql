-- Keep PDFs uploaded with the old pdfId field
UPDATE "Article" SET "documentId" = "pdfId" WHERE "documentId" IS NULL AND "pdfId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_pdfId_fkey";

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "pdfId";
