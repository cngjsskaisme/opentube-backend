import { promises, constants } from 'fs';
import { Injectable } from '@nestjs/common';
import { ffprobe } from 'fluent-ffmpeg';
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

  getVideoThumbnailBuffer({ videoPath, startingPoint = 0 }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let screenshotBuffer = Buffer.from([]);
      try {

        const randomTime = Math.floor(Math.random() * startingPoint)
        const bufferStream = new stream.PassThrough()
        let data = []

        bufferStream.on('data', chunk => {
          data.push(chunk)
        })

        bufferStream.on('end', () => {
          resolve(Buffer.concat(data))
        })

        Ffmpeg(videoPath)
          .outputOptions([
            '-ss', randomTime.toString(),
            '-vframes', '1',
            '-s', '1280x720',
            '-f', 'image2'
          ])
          .pipe(bufferStream)
          .on('error', err => {
            reject(err)
          })

        // Ffmpeg(videoPath)
        //   .on('end', () => {
        //     resolve(screenshotBuffer)
        //   })
        //   .on('error', err => reject(err))
        //   .screenshots({
        //     timestamps: ['00:00:05.000'],
        //     folder: '',
        //     filename: ''
        //   })
        //   .pipe()
        //   .on('data', chunk => {
        //     screenshotBuffer = Buffer.concat([screenshotBuffer, chunk]);
        //   });
      } catch (e) {
        console.log(e)
      }
    });
  }
}
