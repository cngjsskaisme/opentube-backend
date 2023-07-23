import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { localVideoService } from './video/localvideo.service';
import { PrismaService } from './prisma.service';
import { LocalfileService } from './localfile/localfile.service';
import { MediametaService } from './mediameta/mediameta.service';
import { FileController } from './file/file.controller';
import { VideoController } from './video/video.controller';
import { PlaylistController } from './playlist/playlist.controller';

@Module({
  imports: [],
  controllers: [AppController, FileController, VideoController, PlaylistController],
  providers: [AppService, PrismaService, localVideoService, LocalfileService, MediametaService],
})
export class AppModule {}
