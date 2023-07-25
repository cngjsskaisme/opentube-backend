import _ from 'lodash'
import { DBVideoEntryModel } from 'src/video/video.controller';
import { PrismaService } from '../prisma.service';
import { Get, Post, Body, Delete, Controller, Param, Query } from '@nestjs/common';

@Controller('playlist')
export class PlaylistController {
  constructor(
    private prisma: PrismaService
  ) { }

  @Get()
  async getAllPlaylist(): Promise<any> {
    // Retrieve the Playlist records
    const allPlaylist = await this.prisma.playlist.findMany()

    // Retrieve the last entry of the VideoOnPlaylist relation for each playlist
    const allPlaylistWithLastVideo = await Promise.all(
      allPlaylist.map(async playlist => {
        const lastVideo = await this.prisma.videoOnPlaylist.findFirst({
          where: {
            playlistId: playlist.id
          },
          orderBy: {
            orderIndex: 'asc'
          },
          include: {
            video: {
              select: {
                id: true
              }
            }
          }
        })

        return {
          ...playlist,
          videos: [lastVideo]
        }
      })
    )
    return {
      resultCode: '0000',
      data: [...allPlaylistWithLastVideo.values()]
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
    @Param('id') id: string,
    @Param('getAllVideo') getAllVideo: string
  ): Promise<any> {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: parseInt(id) },
      include: getAllVideo === 'true' ? {
        videos: true
      } : undefined
    })
    if (!playlist) {
      return {
        resultCode: '1',
        data: null
      }
    }

    let playlistName = await this.prisma.playlist.findUnique({ where: { id: parseInt(id) }}) as any
    playlistName = playlistName.name

    let result = await this.prisma.videoOnPlaylist.findMany({
      where: {
        playlistId: parseInt(id)
      }
    })
    
    return {
      resultCode: '0000',
      data: {
        playlistName,
        entries: [...result.values()]
      }
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

    const playlistLastVideo = await this.prisma.videoOnPlaylist.findFirst({
      where: {
        playlistId: parseInt(postData.playlistId)
      },
      orderBy: {
        orderIndex: 'desc'
      },
      select: {
        orderIndex: true
      }
    })

    const playlistCreateResult = await this.prisma.videoOnPlaylist.create({
      data: {
        videoId: parseInt(postData.videoId),
        playlistId: parseInt(postData.playlistId),
        entryName: postData.entryName,
        timestamp: postData.timestamp,
        orderIndex: playlistLastVideo ? (playlistLastVideo?.orderIndex + 1) : 1
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
