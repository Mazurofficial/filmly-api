import { Module } from '@nestjs/common';
import { MoviesModule } from '../movies/movies.module';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';

@Module({
  imports: [MoviesModule],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
