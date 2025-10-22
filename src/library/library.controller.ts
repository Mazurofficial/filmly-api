import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { LibraryService } from './library.service';
import { AddToLibraryDto } from './dto/add-to-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';
import { LibraryQueryDto } from './dto/query-library.dto';

@Controller('me/library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly lib: LibraryService) {}

  @Get()
  list(@CurrentUser() u: { userId: string } | undefined, @Query() q: LibraryQueryDto) {
    if (!u?.userId) throw new ForbiddenException();
    return this.lib.list(u.userId, q);
  }

  @Post()
  upsert(@CurrentUser() u: { userId: string } | undefined, @Body() dto: AddToLibraryDto) {
    if (!u?.userId) throw new ForbiddenException();
    return this.lib.addOrUpdate(u.userId, dto);
  }

  @Patch(':tmdbId')
  update(
    @CurrentUser() u: { userId: string } | undefined,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Body() dto: UpdateLibraryDto,
  ) {
    if (!u?.userId) throw new ForbiddenException();
    return this.lib.update(u.userId, tmdbId, dto);
  }

  @Delete(':tmdbId')
  remove(
    @CurrentUser() u: { userId: string } | undefined,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
  ) {
    if (!u?.userId) throw new ForbiddenException();
    return this.lib.remove(u.userId, tmdbId);
  }
}
