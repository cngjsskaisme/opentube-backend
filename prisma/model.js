const model = {
  // @multipleEntries
  videos: {
    id,
    path,
    thumbnailBlob,
    // @multipleEntries @foreign as comment
    comments,
    createdDTTM
  },
  // @multipleEntries
  comments: {
    id,
    author,
    content,
    createdDTTM
  },
  // @multipleEntries
  playlists: {
    id,
    name,
    // @multipleEntries @foreign as videos
    videos,
    createdDTTM
  },
  // @json
  settings: {
    video: {
      lengthThreshold: Number,
      list: {
        thumbnailAutoMuted: Boolean,
        thumbnailPlayingDebounceTime: Number,
        thumbnailPlayRandomPoint: Boolean,
        listVideosCount: Number,
        listCrawlDefaultPaths: Array,
        listCrawlExceptionPaths: Array,
      },
      playlist: {
        lastAddedPlaylist: String
      },
      view: {
        keymap: {
          playPauseKey: String,
          playForward: String,
          playBackward: String,
          playRandom: String,
          addToPlaylist: String
        },
        playbackSeekTime: Number,
        playRandomDebounceTime: Number,
      }
    }
  }
}