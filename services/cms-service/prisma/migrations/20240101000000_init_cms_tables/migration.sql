-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "metadataId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "episodeNumber" INTEGER NOT NULL,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "metadataId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "programs_status_idx" ON "programs"("status");

-- CreateIndex
CREATE INDEX "programs_createdAt_idx" ON "programs"("createdAt");

-- CreateIndex
CREATE INDEX "programs_metadataId_idx" ON "programs"("metadataId");

-- CreateIndex
CREATE INDEX "episodes_programId_idx" ON "episodes"("programId");

-- CreateIndex
CREATE INDEX "episodes_status_idx" ON "episodes"("status");

-- CreateIndex
CREATE INDEX "episodes_episodeNumber_idx" ON "episodes"("episodeNumber");

-- CreateIndex
CREATE INDEX "episodes_metadataId_idx" ON "episodes"("metadataId");

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
