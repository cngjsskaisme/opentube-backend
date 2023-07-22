import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { VideoService } from '../video/video.service';
import { Video as VideoModel } from '@prisma/client';
import { LocalfileService } from '../localfile/localfile.service';
import { MediametaService } from '../mediameta/mediameta.service';
import _ from 'lodash'

type DBVideoEntryModel = {
  id: number,
  path: string,
  createdDTTM: string,
  playlistId: number,
  videoTypeId: number,
  length: number,
  type: {
    typeName: string
  }
}

@Controller('video')
export class VideoController {
  constructor(
    private readonly localfileService: LocalfileService,
    private readonly videoService: VideoService,
    private readonly mediametaService: MediametaService
  ) {}

  @Get('random')
  async getRandomVideos(
    @Query('amount') amount: number,
    @Query('getThumbnail') getThumbnail: boolean
  ): Promise<DBVideoEntryModel[]> {
    let prismaRandomVideo = await this.videoService.randomVideos(amount || 1, getThumbnail)

    const resultVideoList = []

    for (let i = 0; i < prismaRandomVideo.length; i++) {
      const curNode = prismaRandomVideo[i]
      resultVideoList.push(_.omit(curNode, 'thumbnailBlob'))
    }

    return resultVideoList
  }

  @Post('scan')
  async scanVideos(
    @Body() postData: { startPath: string; addToDB: boolean },
  ): Promise<boolean> {
    const { startPath, addToDB } = postData

    this.localfileService.scanVideos({
      startPath,
      addToDB
    })
    return true
  }

  @Get('thumbnail/:id')
  async getVideoImageThumbnail(
    @Param('id') id: string
  ): Promise<{ data: string }> {
    
    const currentVideoInfo = await this.videoService.getVideo({ id: parseInt(id) })

    let result = null

    result = currentVideoInfo.thumbnailBlob
   
    if (!(currentVideoInfo.thumbnailBlob.length > 0)) {
      result = await this.mediametaService.getVideoThumbnailBuffer({
        videoPath: currentVideoInfo.path,
        startingPoint: Math.random() * currentVideoInfo.length
      })

      await this.videoService.updateVideo({
        data: {
          thumbnailBlob: result
        },
        where: {
          id: parseInt(id)
        }
      })
    }
    

    return {
      data: Buffer.from(result).toString('base64')
    }
  }
  
  @Delete(':id')
  async deleteVideo(@Param('id') id: string): Promise<VideoModel> {
    return this.videoService.deleteVideo({ id: Number(id) });
  }
}
