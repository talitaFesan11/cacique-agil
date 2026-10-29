-- AlterTable
ALTER TABLE "comments" ADD COLUMN "selectedText" TEXT,
ADD COLUMN "resolvedAt" TIMESTAMP(3),
ADD COLUMN "resolvedById" TEXT;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "templateCategory" TEXT,
ADD COLUMN "createdById" TEXT;

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "name" TEXT,
    "contentJson" JSONB,
    "yjsState" BYTEA,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documents_parentId_idx" ON "documents"("parentId");

-- CreateIndex
CREATE INDEX "documents_isTemplate_idx" ON "documents"("isTemplate");

-- CreateIndex
CREATE INDEX "document_versions_docId_idx" ON "document_versions"("docId");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_docId_versionNumber_key" ON "document_versions"("docId", "versionNumber");

-- CreateIndex
CREATE INDEX "document_favorites_userId_idx" ON "document_favorites"("userId");

-- CreateIndex
CREATE INDEX "document_favorites_docId_idx" ON "document_favorites"("docId");

-- CreateIndex
CREATE UNIQUE INDEX "document_favorites_userId_docId_key" ON "document_favorites"("userId", "docId");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_docId_fkey" FOREIGN KEY ("docId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_docId_fkey" FOREIGN KEY ("docId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_favorites" ADD CONSTRAINT "document_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_favorites" ADD CONSTRAINT "document_favorites_docId_fkey" FOREIGN KEY ("docId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
