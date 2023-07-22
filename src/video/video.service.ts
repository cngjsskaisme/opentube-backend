import _ from 'lodash'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Video, VideoType, Prisma } from '@prisma/client';
import { MediametaService } from '../mediameta/mediameta.service';

@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaService,
    private mediameta: MediametaService
  ) {}

  async video(
    VideoWhereUniqueInput: Prisma.VideoWhereUniqueInput,
  ): Promise<Video | null> {
    return this.prisma.video.findUnique({
      where: VideoWhereUniqueInput,
    });
  }

  async getVideo(
    whereUniqueInput: Prisma.VideoWhereUniqueInput,
  ): Promise<Video | null> {

    const foundVideo = await this.prisma.video.findUnique({
      where: whereUniqueInput
    })

    if (!(foundVideo.length > 0)) {
      await this.prisma.video.update({
        data: {
          length: foundVideo.length
        },
        where: {
          id: foundVideo.id
        }
      })
    }

    return foundVideo
  }

  async randomVideos(
    amount: number,
    getThumbnail: boolean
  ): Promise<Video[] | null> {
    const totalVideos = await this.prisma.video.count()
    const randomIndices = [...Array(totalVideos).keys()].sort(() => Math.random() - 0.5).slice(0, amount)
    let videoList = await this.prisma.video.findMany({
      where: {
        id: {
          in: randomIndices
        }
      },
      include: {
        type: {
          select: {
            typeName: true,
          }
        }
      }
    })

    let modifiedVideoList = []
    
    for (let i = 0; i < videoList.length; i++) {
      const curNode = _.cloneDeep(videoList[i])
      if (!curNode) { continue }
      if (!this.mediameta.checkFileExist(curNode.path)) { continue }
      if (!(curNode.length > 0)) {
        curNode.length = await this.mediameta.getVideoLength({ videoPath: curNode.path }) || 0
        await this.prisma.video.update({
          data: {
            length: Math.floor(curNode.length)
          },
          where: {
            id: curNode.id
          }
        })
      }
      modifiedVideoList.push(curNode)
    }

    return modifiedVideoList
  }

  async videos(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.VideoWhereUniqueInput;
    where?: Prisma.VideoWhereInput;
    orderBy?: Prisma.VideoOrderByWithRelationInput;
  }): Promise<Video[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.video.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createVideo(params: {
    path: string,
    thumbnailBlob: Buffer,
    createdDTTM: Date,
    type: Prisma.VideoTypeCreateNestedOneWithoutVideoInput
    
  }): Promise<Video> {
    const { path, thumbnailBlob, createdDTTM, type } = params;
    return this.prisma.video.create({
      data: {
        path,
        thumbnailBlob,
        createdDTTM: createdDTTM || new Date(),
        type
      }
    }); 
  }

  async createVideos(params: {
    videos: Array<{
      path: string,
      thumbnailBlob: Buffer,
      createdDTTM: Date,
      type: Prisma.VideoTypeCreateNestedOneWithoutVideoInput
    }>
  }): Promise<boolean> {
    const { videos } = params;

    try {
      for (let i = 0; i < videos.length; i++) {
        await this.prisma.video.create({
          data: videos[i]
        }) 
      } 
    } catch (e) {
      throw e
    }

    return true
  }

  async getVideoTypeByName(params: {
    typeName: string
  }): Promise<VideoType | null> {
    const { typeName } = params;

    const result = await this.prisma.videoType.findFirst({
      where: {
        typeName: typeName
      }
    })

    return result
  }

  // async createVideo(data: Prisma.VideoCreateInput): Promise<Video> {
  //   return this.prisma.video.create({
  //     data,
  //   });
  // }

  async updateVideo(params: {
    where: Prisma.VideoWhereUniqueInput;
    data: Prisma.VideoUpdateInput;
  }): Promise<Video> {
    const { where, data } = params;
    return this.prisma.video.update({
      data,
      where
    });
  }

  async deleteVideo(where: Prisma.VideoWhereUniqueInput): Promise<Video> {
    return this.prisma.video.delete({
      where,
    });
  }
}
