
import { Res, Req, Param, Controller, Get, StreamableFile, Header, Headers, HttpStatus } from '@nestjs/common';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';
import { localVideoService } from 'src/video/localvideo.service';
import type { Request, Response } from 'express';

@Controller('file')
export class FileController {
  constructor(private video: localVideoService) {}
  
  // @Header('Content-type', 'video/mp4')
  // @Header('Content-Disposition', 'inline')
  @Get('stream/:id')
	@Header('Accept-Ranges', 'bytes')
	@Header('Content-Type', 'video/mp4')
	async getStreamVideo(
		@Param('id') id: string,
		@Headers() headers,
		@Res() res: Response
	) {
    const videoInfo = await this.video.getVideo({ id: parseInt(id) })
    const path = videoInfo.path

		const { size } = statSync(path);
		const videoRange = headers.range;
		if (videoRange) {
			const parts = videoRange.replace(/bytes=/, '').split('-');
			const start = parseInt(parts[0], 10);
			const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
			const chunkSize = end - start + 1;
			const readStreamfile = createReadStream(path, {
				start,
				end,
				highWaterMark: 2048, // 60
			});
			const head = {
				'Content-Range': `bytes ${start}-${end}/${size}`,
				'Content-Length': chunkSize,
			};
			res.writeHead(HttpStatus.PARTIAL_CONTENT, head); //206
			readStreamfile.pipe(res);
		} else {
			const head = {
				'Content-Length': size,
			};
			res.writeHead(HttpStatus.OK, head); //200
			createReadStream(path).pipe(res);
		}
	}

  @Get('download/:id')
  async downloadFile(@Param('id') id: number): Promise<StreamableFile> {
    const videoInfo = await this.video.getVideo({ id })

    const file = createReadStream(videoInfo.path);
    
    return new StreamableFile(file).setErrorHandler(() => {});
  }
}