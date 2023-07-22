import { statSync, readdirSync, createReadStream } from 'fs'
import { join, extname } from 'path'
import { Injectable, StreamableFile } from '@nestjs/common';
import { localVideoService } from 'src/video/localvideo.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LocalfileService {
  constructor(
    private prisma: PrismaService,
    private video: localVideoService
  ) {}

  async scanVideos(params: {
    addToDB: boolean
  }): Promise<Array<string>> {
    const { addToDB } = params;

    const videoFormats = ['.mp4', '.mkv', '.flv', '.avi', '.mov', '.wmv'];

    function walk(dir: string): Array<string> {
      let results = [];
      const list = readdirSync(dir);
      list.forEach(file => {
        file = join(dir, file);
        try {
          const stat = statSync(file);
          if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
          } else {
            if (videoFormats.includes(extname(file))) {
              results.push(file);
            }
          }
        } catch (e) {
          // noop
        }
      });
      return results;
    }

    let crawlPathArray = await this.prisma.setting.findFirst({
      where: { id: 1 }
    }) as any

    crawlPathArray = crawlPathArray.crawlPath.split('/')
    console.log(crawlPathArray)
  
    for (let i = 0; i < crawlPathArray.length; i++) {
      const videoWalkResult = walk(crawlPathArray[i])
  
      if (addToDB) {
        const payload = []
        const curDate = new Date()
        const scanVideoType = await this.video.getVideoTypeByName({ typeName: 'scan' })
        for (let j = 0; j < videoWalkResult.length; j++) {
          const curNode = videoWalkResult[j]
          console.log(j)
          if (await this.prisma.video.findFirst({ where: { path: curNode }})) {
            continue
          }
          console.log(`adding: ${curNode}`)
          console.log('')
          payload.push({
            path: curNode,
            thumbnailBlob: Buffer.from([]),
            createdDTTM: curDate,
            videoTypeId: scanVideoType.id
          })
        }
        console.log('Added Chunks to DB...')
        this.video.createVideos({
          videos: payload
        })
      }
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
