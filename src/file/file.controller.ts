
import { Res, Param, Controller, Get, StreamableFile, Header } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import { VideoService } from 'src/video/video.service';

@Controller('file')
export class FileController {
  constructor(private video: VideoService) {}
  
  // @Header('Content-type', 'video/mp4')
  // @Header('Content-Disposition', 'inline')
  @Get('stream/:id')
  async getFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res
  ): Promise<StreamableFile> {
    const videoInfo = await this.video.getVideo({ id: parseInt(id) })

    const file = createReadStream(videoInfo.path);

    res.set({
      'Content-Type': 'video/mp4',
      'Content-Disposition': 'attachment; filename="video.mp4"',
    })

    return new StreamableFile(file);
  }

  @Get('download/:id')
  async downloadFile(@Param('id') id: number): Promise<StreamableFile> {
    const videoInfo = await this.video.getVideo({ id })

    const file = createReadStream(videoInfo.path);
    
    return new StreamableFile(file);
  }
}