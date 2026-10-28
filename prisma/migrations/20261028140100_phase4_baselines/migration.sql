-- CreateTable
CREATE TABLE "project_baselines" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_baseline_items" (
    "id" TEXT NOT NULL,
    "baselineId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_baseline_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_baselines_projectId_idx" ON "project_baselines"("projectId");

-- CreateIndex
CREATE INDEX "task_baseline_items_baselineId_idx" ON "task_baseline_items"("baselineId");

-- CreateIndex
CREATE INDEX "task_baseline_items_taskId_idx" ON "task_baseline_items"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "task_baseline_items_baselineId_taskId_key" ON "task_baseline_items"("baselineId", "taskId");

-- AddForeignKey
ALTER TABLE "project_baselines" ADD CONSTRAINT "project_baselines_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_baseline_items" ADD CONSTRAINT "task_baseline_items_baselineId_fkey" FOREIGN KEY ("baselineId") REFERENCES "project_baselines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
