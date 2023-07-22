import { statSync, readdirSync, createReadStream } from 'fs'
import { join, extname } from 'path'
import { Injectable, StreamableFile } from '@nestjs/common';
import { VideoService } from 'src/video/video.service';

@Injectable()
export class LocalfileService {
  constructor(private video: VideoService) {}

  async scanVideos(params: {
    startPath: string,
    addToDB: boolean
  }): Promise<Array<string>> {
    const { startPath, addToDB } = params;

    const videoFormats = ['.mp4', '.mkv', '.flv', '.avi', '.mov', '.wmv'];

    function walk(dir: string): Array<string> {
      let results = [];
      const list = readdirSync(dir);
      list.forEach(file => {
        file = join(dir, file);
        const stat = statSync(file);
        if (stat && stat.isDirectory()) {
          results = results.concat(walk(file));
        } else {
          if (videoFormats.includes(extname(file))) {
            results.push(file);
          }
        }
      });
      return results;
    }

    const videoWalkResult = walk(startPath)

    if (addToDB) {
      const payload = []
      const curDate = new Date()
      const scanVideoType = await this.video.getVideoTypeByName({ typeName: 'scan' })
      for (let i = 0; i < videoWalkResult.length; i++) {
        const curNode = videoWalkResult[i]
        payload.push({
          path: curNode,
          thumbnailBlob: Buffer.from([]),
          createdDTTM: curDate,
          videoTypeId: scanVideoType.id
        })
      }
      this.video.createVideos({
        videos: payload
      })
    }


    return []
  }

  async getFile(params: {
    path: string,
    type: string
  }) {
    const { path, type } = params;

    const file = createReadStream(path);
    
    return new StreamableFile(file);
  }
}
