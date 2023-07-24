import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { localVideoService } from './localvideo.service';
import { Setting, Video as VideoModel } from '@prisma/client';
import { LocalfileService } from '../localfile/localfile.service';
import { MediametaService } from '../mediameta/mediameta.service';
import { PrismaService } from '../prisma.service';
import path from 'path'
import _ from 'lodash'

export type DBVideoEntryModel = {
  id: number,
  path: string,
  createdDTTM: string,
  playlistId: number,
  videoTypeId: number,
  length: number,
  isThumbnailCached: boolean,
  type: {
    typeName: string
  }
}

@Controller('video')
export class VideoController {
  constructor(
    private prisma: PrismaService,
    private readonly localfileService: LocalfileService,
    private readonly localVideoService: localVideoService,
    private readonly mediametaService: MediametaService
  ) { }

  @Get('random')
  async getRandomVideos(
    @Query('videoListCount') videoListCount: number,
    @Query('videoLengthThreshold') videoLengthThreshold: string,
    @Query('videoExceptKeyword') videoExceptKeyword: string
  ): Promise<DBVideoEntryModel[]> {
    let prismaRandomVideo = await this.localVideoService.randomVideos(
      videoListCount || 1,
      parseInt(videoLengthThreshold),
      videoExceptKeyword
    )

    const resultVideoList = []

    for (let i = 0; i < prismaRandomVideo.length; i++) {
      let curNode = prismaRandomVideo[i] as any
      curNode.isThumbnailCached = curNode.thumbnailBlob.byteLength > 0
      curNode = _.omit(curNode, 'thumbnailBlob')
      resultVideoList.push(curNode)
    }

    return resultVideoList
  }

  @Get('random/index')
  async getRandomVideoIndex(): Promise<{ data: number }> {
    const totalVideos = await this.prisma.video.count() 

    return {
      data: [...Array(totalVideos).keys()].sort(() => Math.random() - 0.5).slice(0, 1)[0]
    }
  }

  @Get('scan/path')
  async getScanPath(): Promise<Setting> {
    return this.prisma.setting.findFirst({ where: { id: 1 } })
  }

  @Post('scan/path')
  async updateScanPath(
    @Body() postData: { crawlPath: string }
  ): Promise<any> {
    const existingSetting = await this.prisma.setting.findUnique({
      where: { id: 1}
    })
    if (!existingSetting) {
      await this.prisma.setting.create({
        data: { id: 1 }
      })
    }
    await this.prisma.setting.update({
      data: {
        crawlPath: postData.crawlPath
      },
      where: { id: 1 }
    })
    return {
      resultCode: '0000',
      data: null
    }
  }

  @Post('scan')
  async scanVideos(
    @Body() postData: { startPath: string; addToDB: boolean },
  ): Promise<boolean> {
    const { startPath, addToDB } = postData

    this.localfileService.scanVideos({
      addToDB
    })
    return true
  }

  @Get('thumbnail/:id')
  async getVideoImageThumbnail(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('thumbnailImageForceCreate') thumbnailImageForceCreate: string
  ): Promise<{ data: string }> {

    const currentVideoInfo = await this.localVideoService.getVideo({ id: parseInt(id) })

    let result = null

    result = currentVideoInfo.thumbnailBlob

    if (!(currentVideoInfo.thumbnailBlob.length > 0) || thumbnailImageForceCreate === 'true') {
      try {
        const ffmpeg = this.mediametaService.getFfmpeg(currentVideoInfo.path)

        req.on('error', () => {
          ffmpeg.killInstance()
        })
        req.on('end', () => {
          ffmpeg.killInstance()
        })
        req.on('close', () => {
          ffmpeg.killInstance()
        })

        result = await ffmpeg.getVideoThumbnailBuffer({
          videoPath: currentVideoInfo.path,
          startingPoint: Math.random() * currentVideoInfo.length
        })
      } catch (e) {
        throw new Error(e)
      }

      await this.localVideoService.updateVideo({
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

  @Get('info/:id')
  async getVideoInfo(
    @Param('id') id: string,
  ): Promise<DBVideoEntryModel[]> {
    let prismaVideo = await this.localVideoService.getVideo({id: parseInt(id) }) as any

    prismaVideo.isThumbnailCached = false
    if (prismaVideo.thumbnailBlob.byteLength > 0) { prismaVideo.isThumbnailCached = true }
    
    prismaVideo.title = (prismaVideo.path.split(path.sep).pop()).split('.').slice(0, -1).join('.')
    prismaVideo = _.omit(prismaVideo, 'thumbnailBlob')
    

    return prismaVideo
  }

  @Delete(':id')
  async deleteVideo(@Param('id') id: string): Promise<VideoModel> {
    return this.localVideoService.deleteVideo({ id: Number(id) });
  }
}
