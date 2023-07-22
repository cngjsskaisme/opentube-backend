import { promises, constants } from 'fs';
import { Injectable } from '@nestjs/common';
import { FfmpegCommand, ffprobe } from 'fluent-ffmpeg';
import Ffmpeg from 'fluent-ffmpeg';
import stream from 'stream'

@Injectable()
export class MediametaService {
  async checkFileExist(filePath: string): Promise<boolean> {
    try {
      await promises.access(filePath, constants.F_OK);
      return true
    } catch {
      return false
    }
  }

  checkIfSambaAddress(path: string): boolean {
    const regex = /^(smb:\/\/|\\\\)[\w.-]+(\/[\w.-]+)*$/
    return regex.test(path) || path.startsWith('\\\\')
  }

  getVideoLength({ videoPath }): Promise<number> {
    return new Promise((resolve, reject) => {
      ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err)
        } else {
          resolve(metadata.format.duration)
        }
      })
    })
  }

  getFfmpeg(videoPath: string): { killInstance: any, getVideoThumbnailBuffer: Function } {
    let ffmpeg = null

    return {
      killInstance: () => {
        if (!ffmpeg) { return false }
        ffmpeg.kill('SIGINT')
        ffmpeg.kill('SIGTERM')
        return true
      },
      getVideoThumbnailBuffer: ({ videoPath, startingPoint = 0 }): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
          try {
            const randomTime = Math.floor(Math.random() * startingPoint)
            const bufferStream = new stream.PassThrough()

            ffmpeg = Ffmpeg(videoPath)

            ffmpeg
              .inputOptions([
                '-hwaccel cuvid',
                '-c:v h264_cuvid'
              ])
              .outputOptions([
                '-ss', randomTime.toString(),
                '-frames:v 1',
                '-s', '1280x720',
                '-f', 'image2',
                // '-vf', 'scale_cuda=w=1280:h=720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black'
                '-vf', 'thumbnail_cuda=2,scale_cuda=1280:-1,hwdownload,format=nv12',
                // '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black'
              ])
              .on('error', (err) => {
                reject(err)
              })
              .on('end', function () {
              })
              .writeToStream(bufferStream)

            let buffers = [];

            bufferStream.on('data', (chunk) => {
              buffers.push(chunk)
            });

            bufferStream.on('end', () => {
              resolve(Buffer.concat(buffers))
            });
          } catch (e) {
            console.log(e)
          }
        })
      }
    }
  }
}
