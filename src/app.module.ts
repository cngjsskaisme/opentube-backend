import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoService } from './video/video.service';
import { PrismaService } from './prisma.service';
import { LocalfileService } from './localfile/localfile.service';
import { MediametaService } from './mediameta/mediameta.service';
import { FileController } from './file/file.controller';
import { VideoController } from './video/video.controller';

@Module({
  imports: [],
  controllers: [AppController, FileController, VideoController],
  providers: [AppService, PrismaService, VideoService, LocalfileService, MediametaService],
})
export class AppModule {}
