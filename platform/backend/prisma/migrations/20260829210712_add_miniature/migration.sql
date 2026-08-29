/*
  Warnings:

  - Added the required column `miniature` to the `Article` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "miniature" TEXT NOT NULL;
