import { PrismaService } from '../prisma.service';
import { Post, Body, Delete, Controller } from '@nestjs/common';

@Controller('playlist')
export class PlaylistController {
  constructor(
    private prisma: PrismaService
  ) { }

  @Post()
  async createPlaylist(
    @Body() postData: { playlistName: string }
  ): Promise<{ data: { success: boolean }}> {
    await this.prisma.playlist.create({
      data: {
        name: postData.playlistName,
        createdDTTM: new Date()
      }
    })

    return {
      data: {
        success: true
      }
    }
  }

  @Post('video')
  async addVideo(
    @Body() postData: { playlistId: string, videoId: string }
  ): Promise<{ data: { success: boolean }}> {
    await this.prisma.videoOnPlaylist.create({
      data: {
        videoId: parseInt(postData.videoId),
        playlistId: parseInt(postData.playlistId)
      }
    })

    return {
      data: {
        success: true
      }
    }
  }

  @Delete('video')
  async deleteVideo(
    @Body() postData: { playlistId: string, videoId: string }
  ): Promise<{ data: { success: boolean }}> {
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
      data: {
        success: true
      }
    }
  }

}
