-- CreateTable
CREATE TABLE "MovieGenre" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MovieGenre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieGenreOnMovie" (
    "movieId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,

    CONSTRAINT "MovieGenreOnMovie_pkey" PRIMARY KEY ("movieId","genreId")
);

-- CreateIndex
CREATE INDEX "MovieGenreOnMovie_genreId_idx" ON "MovieGenreOnMovie"("genreId");

-- AddForeignKey
ALTER TABLE "MovieGenreOnMovie" ADD CONSTRAINT "MovieGenreOnMovie_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("tmdbId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieGenreOnMovie" ADD CONSTRAINT "MovieGenreOnMovie_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "MovieGenre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
