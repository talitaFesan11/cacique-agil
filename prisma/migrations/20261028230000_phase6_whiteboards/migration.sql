-- AlterTable
ALTER TABLE "whiteboards" ADD COLUMN "description" TEXT,
ADD COLUMN "elementsJson" JSONB,
ADD COLUMN "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "templateCategory" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "whiteboards_isTemplate_idx" ON "whiteboards"("isTemplate");

-- CreateIndex
CREATE INDEX "whiteboards_deletedAt_idx" ON "whiteboards"("deletedAt");

-- AddForeignKey
ALTER TABLE "whiteboards" ADD CONSTRAINT "whiteboards_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
