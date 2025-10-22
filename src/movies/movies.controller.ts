import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { SearchDto } from './dto/search.dto';

@Controller('movies')
export class MoviesController {
  constructor(private readonly movies: MoviesService) {}

  @Get('search')
  search(@Query() q: SearchDto) {
    return this.movies.search(q.query, q.page);
  }

  @Get(':tmdbId')
  getOne(@Param('tmdbId', ParseIntPipe) tmdbId: number) {
    return this.movies.getByTmdbId(tmdbId);
  }
}
