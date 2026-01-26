module.exports = {
  displayname: 'Video',
  schema: [
    {
      label: 'Overlay Titles',
      field: 'overlayTitles',
      input: 'paragraph',
      options: {
        types: ['overlay_titles'],
      },
      localised: false,
      required: false,
    },
    {
      label: 'Thumbnail',
      field: 'image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 2572 × 1672',
        accept: '.jpg',
        limit: 1 * 1024 * 1024, // 1 MB
        maxCount: 1,
      },
      localised: true,
      required: true,
    },
    {
      label: 'Thumbnail Fullscreen',
      field: 'thumbnailFullscreen',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 3840 × 2160',
        accept: '.jpg',
        limit: 2 * 1024 * 1024, // 2 MB
        maxCount: 1,
      },
      localised: true,
      required: true,
    },
    {
      label: 'Inline Play',
      field: 'inlinePlay',
      input: 'checkbox',
      required: false,
    },
    {
      label: 'Autoplay',
      field: 'autoplay',
      input: 'checkbox',
      options: {
        hint: 'Autoplay the video will mute it by default',
      },
      required: false,
    },
    {
      label: 'Loop',
      field: 'loop',
      input: 'checkbox',
      required: false,
    },
    {
      label: 'Show Controls',
      field: 'showControls',
      input: 'checkbox',
      required: false,
    },
    {
      label: 'Overflow Video',
      field: 'overflowVideo',
      input: 'checkbox',
      options: {
        hint: 'Allow the video to be overflowing which will "crop" the left/right side of the video',
      },
      required: false,
    },
    {
      label: 'Video',
      field: 'fullscreen',
      input: 'file',
      options: {
        accept: '.mp4,.webm',
        limit: 1 * 1024 * 1024 * 1024, // 1 GB
        maxCount: 1,
      },
      required: true,
      localised: true,
    },
    {
      label: 'Disclaimer',
      field: 'disclaimer',
      input: 'checkbox',
      required: false,
    },
  ],
}
