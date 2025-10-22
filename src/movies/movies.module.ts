import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { TmdbService } from './tmdb.service';

@Module({
  controllers: [MoviesController],
  providers: [MoviesService, TmdbService],
  exports: [MoviesService],
})
export class MoviesModule {}
