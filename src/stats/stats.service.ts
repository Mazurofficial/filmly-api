import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type TopGenre = { id: number; name: string; count: number };

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getMyStats(userId: string, topN = 5) {
    const [totalMovies, watchedCount, plannedCount, ratedAgg] =
      await this.prisma.$transaction([
        this.prisma.userMovie.count({ where: { userId } }),
        this.prisma.userMovie.count({ where: { userId, status: 'watched' } }),
        this.prisma.userMovie.count({ where: { userId, status: 'planned' } }),
        this.prisma.userMovie.aggregate({
          where: { userId, rating: { not: null } },
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);

    const userMovies = await this.prisma.userMovie.findMany({
      where: { userId },
      select: {
        watchCount: true,
        movie: { select: { runtimeMin: true } },
      },
    });

    const totalMinutes = userMovies.reduce((acc, it) => {
      const rt = it.movie.runtimeMin ?? 0;
      return acc + rt * (it.watchCount ?? 0);
    }, 0);
    const totalHoursWatched = +(totalMinutes / 60).toFixed(2);

    const myMoviesWithGenres = await this.prisma.userMovie.findMany({
      where: { userId },
      select: {
        movie: {
          select: {
            genres: {
              select: {
                genreId: true,
                genre: { select: { name: true, id: true } },
              },
            },
          },
        },
      },
    });

    const counts = new Map<number, TopGenre>();
    for (const um of myMoviesWithGenres) {
      for (const g of um.movie.genres) {
        const current = counts.get(g.genreId) ?? {
          id: g.genre.id,
          name: g.genre.name,
          count: 0,
        };
        current.count += 1;
        counts.set(g.genreId, current);
      }
    }

    const topGenres: TopGenre[] = Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);

    const ratedCount = ratedAgg._count?.rating ?? 0;
    const avg =
      ratedAgg._avg?.rating !== undefined && ratedAgg._avg?.rating !== null
        ? +ratedAgg._avg.rating.toFixed(2)
        : null;

    return {
      totalMovies,
      watchedCount,
      plannedCount,
      ratedCount,
      avgRating: avg,
      totalHoursWatched,
      topGenres,
    };
  }
}
