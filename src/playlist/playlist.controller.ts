import _ from 'lodash'
import { DBVideoEntryModel } from 'src/video/video.controller';
import { PrismaService } from '../prisma.service';
import { Get, Post, Body, Delete, Controller, Param } from '@nestjs/common';

@Controller('playlist')
export class PlaylistController {
  constructor(
    private prisma: PrismaService
  ) { }

  @Get()
  async getAllPlaylist(): Promise<any> {
    const allPlaylist = await this.prisma.playlist.findMany()
    return {
      resultCode: '0000',
      data: [...allPlaylist.values()]
    }
  }

  @Get('recent')
  async getPlaylistRecentIndex (): Promise<any> {
    const recentAddedVideoPlaylistIdResult = await this.prisma.setting.findUnique({
      where: { id: 1 },
      include: {
        recentAddedVideoPlaylist: true
      }
    })

    return {
      resultCode: '0000',
      data: recentAddedVideoPlaylistIdResult?.recentAddedVideoPlaylist
    }
  }

  @Get(':id')
  async getPlaylist(
    @Param('id') id: string
  ): Promise<any> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: parseInt(id) }
    })
    if (!playlist) {
      return {
        resultCode: '1',
        data: null
      }
    }

    let result = await this.prisma.videoOnPlaylist.findMany({
      where: {
        playlistId: parseInt(id)
      },
      select: {
        id: true,
        videoId: true,
        entryName: true,
        timestamp: true,
        playlistId: true,
        playlist: true
      }
    })
    
    return {
      resultCode: '0000',
      data: [...result.values()]
    }
  }

  @Post()
  async createPlaylist(
    @Body() postData: { playlistName: string }
  ): Promise<any> {
    await this.prisma.playlist.create({
      data: {
        name: postData.playlistName,
        createdDTTM: new Date()
      }
    })

    return {
      resultCode: '0000',
      data: true
    }
  }

  @Post('video')
  async addVideo(
    @Body() postData: {
      videoId: string,
      playlistId: string,
      entryName: string,
      timestamp: string
    }
  ): Promise<any> {
    const dupCheckResult = await this.prisma.videoOnPlaylist.findFirst({
      where: { videoId: parseInt(postData.videoId), playlistId: parseInt(postData.playlistId) }
    })
    if (dupCheckResult) {
      return {
        resultCode: '1',
        data: false
      }
    }

    const playlistCreateResult = await this.prisma.videoOnPlaylist.create({
      data: {
        videoId: parseInt(postData.videoId),
        playlistId: parseInt(postData.playlistId),
        entryName: postData.entryName,
        timestamp: postData.timestamp
      },
      select: {
        playlistId: true
      }
    })

    await this.prisma.setting.update({
      where: { id: 1 },
      data: {
        recentAddedVideoPlaylistId: playlistCreateResult.playlistId
      }
    })

    return {
      resultCode: '0000',
      data: true
    }
  }

  @Delete()
  async deletePlaylist(
    @Body() postData: { playlistId: string }
  ): Promise<any> {
    await this.prisma.playlist.delete({
      where: {
        id: parseInt(postData.playlistId)
      }
    })
    return {
      resultCode: '0000',
      data: true
    }
  }

  @Delete('video')
  async deleteVideo(
    @Body() postData: { playlistId: string, videoId: string }
  ): Promise<any> {
    const targetPlaylist = await this.prisma.videoOnPlaylist.findFirst({
      where: {
        videoId: parseInt(postData.videoId),
        playlistId: parseInt(postData.playlistId)
      }
    })

    await this.prisma.videoOnPlaylist.delete({
      where: {
        id: targetPlaylist.id
      }
    })

    return {
      resultCode: '0000',
      data: true
    }
  }
}
