import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TmdbService } from './tmdb.service';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MoviesService {
  constructor(private prisma: PrismaService, private tmdb: TmdbService) {}

  async search(query: string, page = 1) {
    // The search endpoint does not persist results, but detail requests will cache them.
    return this.tmdb.search(query, page);
  }

  async getByTmdbId(tmdbId: number) {
    // Use a 24-hour TTL; refresh stale entries.
    const movie = await this.prisma.movie.findUnique({
      where: { tmdbId },
      include: { genres: { include: { genre: true } } },
    });

    const isFresh =
      movie?.lastSyncedAt && Date.now() - movie.lastSyncedAt.getTime() < ONE_DAY_MS;

    if (movie && isFresh) {
      return this.mapMovieWithGenres(movie);
    }

    // Fetch from TMDb and sync locally.
    const tm = await this.tmdb.details(tmdbId);

    if (!tm?.id) throw new NotFoundException('Movie not found on TMDb');

    // Prepare upserts for related genres.
    const genreOps = (tm.genres ?? []).map((g) => ({
      where: { id: g.id },
      create: { id: g.id, name: g.name },
      update: { name: g.name },
    }));

    await this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // Upsert movie record using TMDb data.
      await tx.movie.upsert({
        where: { tmdbId: tm.id },
        create: {
          tmdbId: tm.id,
          title: tm.title,
          posterPath: tm.poster_path ?? null,
          runtimeMin: tm.runtime ?? null,
          lastSyncedAt: now,
        },
        update: {
          title: tm.title,
          posterPath: tm.poster_path ?? null,
          runtimeMin: tm.runtime ?? null,
          lastSyncedAt: now,
        },
      });

      // Upsert genres referenced by TMDb response.
      for (const op of genreOps) {
        await tx.movieGenre.upsert(op as any);
      }

      // Replace join table entries with current set.
      await tx.movieGenreOnMovie.deleteMany({ where: { movieId: tm.id } });
      for (const g of tm.genres ?? []) {
        await tx.movieGenreOnMovie.create({
          data: { movieId: tm.id, genreId: g.id },
        });
      }
    });

    const updated = await this.prisma.movie.findUnique({
      where: { tmdbId },
      include: { genres: { include: { genre: true } } },
    });

    return this.mapMovieWithGenres(updated!);
  }

  private mapMovieWithGenres(m: any) {
    return {
      tmdbId: m.tmdbId,
      title: m.title,
      runtimeMin: m.runtimeMin,
      posterPath: m.posterPath,
      genres: (m.genres ?? []).map((mg: any) => ({
        id: mg.genre.id,
        name: mg.genre.name,
      })),
      lastSyncedAt: m.lastSyncedAt,
    };
  }
}
