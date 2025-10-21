-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "runtimeMin" INTEGER,
    "posterPath" TEXT,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMovie" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rating" INTEGER,
    "watchCount" INTEGER NOT NULL DEFAULT 0,
    "lastWatchedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMovie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_tmdbId_key" ON "Movie"("tmdbId");

-- CreateIndex
CREATE INDEX "UserMovie_userId_idx" ON "UserMovie"("userId");

-- CreateIndex
CREATE INDEX "UserMovie_movieId_idx" ON "UserMovie"("movieId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMovie_userId_movieId_key" ON "UserMovie"("userId", "movieId");

-- AddForeignKey
ALTER TABLE "UserMovie" ADD CONSTRAINT "UserMovie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMovie" ADD CONSTRAINT "UserMovie_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
