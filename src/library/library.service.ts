import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MoviesService } from '../movies/movies.service';
import { AddToLibraryDto } from './dto/add-to-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';
import { LibraryQueryDto } from './dto/query-library.dto';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService, private movies: MoviesService) {}

  private async ensureMovieCached(tmdbId: number) {
    // Will trigger TMDb sync and persist/upsert locally.
    return this.movies.getByTmdbId(tmdbId);
  }

  async addOrUpdate(userId: string, dto: AddToLibraryDto) {
    await this.ensureMovieCached(dto.tmdbId);

    const movie = await this.prisma.movie.findUnique({ where: { tmdbId: dto.tmdbId } });
    if (!movie) throw new NotFoundException('Movie not cached');

    const data = {
      status: dto.status,
      rating: dto.rating ?? null,
      watchCount: dto.watchCount ?? 0,
      note: dto.note ?? null,
    };

    const existing = await this.prisma.userMovie.findUnique({
      where: { userId_movieId: { userId, movieId: movie.id } },
    });

    if (existing) {
      return this.prisma.userMovie.update({
        where: { id: existing.id },
        data,
        select: this.selectProjection(),
      });
    }

    return this.prisma.userMovie.create({
      data: { userId, movieId: movie.id, ...data },
      select: this.selectProjection(),
    });
  }

  async update(userId: string, tmdbId: number, dto: UpdateLibraryDto) {
    await this.ensureMovieCached(tmdbId);

    const movie = await this.prisma.movie.findUnique({ where: { tmdbId } });
    if (!movie) throw new NotFoundException('Movie not cached');

    const record = await this.prisma.userMovie.findUnique({
      where: { userId_movieId: { userId, movieId: movie.id } },
    });
    if (!record) throw new NotFoundException('Not in your library');

    return this.prisma.userMovie.update({
      where: { id: record.id },
      data: {
        status: dto.status,
        rating: dto.rating ?? undefined,
        watchCount: dto.watchCount ?? undefined,
        note: dto.note === undefined ? undefined : dto.note,
        lastWatchedAt:
          dto.lastWatchedAt === undefined
            ? undefined
            : dto.lastWatchedAt
            ? new Date(dto.lastWatchedAt)
            : null,
      },
      select: this.selectProjection(),
    });
  }

  async remove(userId: string, tmdbId: number) {
    const movie = await this.prisma.movie.findUnique({ where: { tmdbId } });
    if (!movie) throw new NotFoundException('Movie not cached');

    const rec = await this.prisma.userMovie.findUnique({
      where: { userId_movieId: { userId, movieId: movie.id } },
    });
    if (!rec) throw new NotFoundException('Not in your library');

    await this.prisma.userMovie.delete({ where: { id: rec.id } });
    return { ok: true };
  }

  async list(userId: string, q: LibraryQueryDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const whereUM: any = { userId };
    if (q.status) whereUM.status = q.status;
    if (q.minRating) whereUM.rating = { gte: q.minRating };

    const movieFilters: any = {};
    if (q.title) movieFilters.title = { contains: q.title, mode: 'insensitive' };
    if (q.genreId) {
      movieFilters.genres = { some: { genreId: q.genreId } };
    }
    if (Object.keys(movieFilters).length > 0) {
      whereUM.movie = movieFilters;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.userMovie.findMany({
        where: whereUM,
        include: {
          movie: {
            include: { genres: { include: { genre: true } } },
          },
        },
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.userMovie.count({ where: whereUM }),
    ]);

    return {
      page,
      pageSize,
      total,
      items: items.map((i) => ({
        tmdbId: i.movie.tmdbId,
        title: i.movie.title,
        posterPath: i.movie.posterPath,
        runtimeMin: i.movie.runtimeMin,
        genres: i.movie.genres.map((g) => ({ id: g.genre.id, name: g.genre.name })),
        status: i.status,
        rating: i.rating,
        watchCount: i.watchCount,
        lastWatchedAt: i.lastWatchedAt,
        note: i.note,
        updatedAt: i.updatedAt,
      })),
    };
  }

  private selectProjection() {
    return {
      id: false,
      userId: false,
      movieId: false,
      status: true,
      rating: true,
      watchCount: true,
      lastWatchedAt: true,
      note: true,
      updatedAt: true,
      createdAt: true,
      movie: {
        select: {
          tmdbId: true,
          title: true,
          posterPath: true,
          runtimeMin: true,
          genres: { include: { genre: true } },
        },
      },
    };
  }
}
