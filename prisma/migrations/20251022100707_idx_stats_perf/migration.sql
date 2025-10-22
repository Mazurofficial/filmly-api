-- CreateIndex
CREATE INDEX "MovieGenreOnMovie_movieId_idx" ON "MovieGenreOnMovie"("movieId");

-- CreateIndex
CREATE INDEX "UserMovie_userId_updatedAt_idx" ON "UserMovie"("userId", "updatedAt");
