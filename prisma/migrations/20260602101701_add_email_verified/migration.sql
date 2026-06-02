-- DropForeignKey
ALTER TABLE "Repository" DROP CONSTRAINT "Repository_fkey";

-- DropIndex
DROP INDEX "Chunk_embedding_idx";
