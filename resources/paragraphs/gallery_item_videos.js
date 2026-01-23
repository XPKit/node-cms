exports = module.exports = {
  displayname: 'Gallery Image Item',
  schema: [
    {
      label: 'Title',
      field: 'title',
      input: 'text',
      required: false,
      localised: true
    },
    {
      label: 'Thumbnail',
      field: 'thumbnail',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 720 × 405',
        accept: '.jpg',
        limit: 1 * 1024 * 1024, // 1 MB
        maxCount: 1
      },
      required: true,
      localised: true
    },
    {
      label: 'Fullscreen Thumbnail',
      field: 'fullscreenThumbnail',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 3840 × 2160',
        accept: '.jpg',
        limit: 2 * 1024 * 1024, // 2 MB
        maxCount: 1
      },
      required: true,
      localised: true
    },
    {
      label: 'Disclaimer',
      field: 'disclaimer',
      input: 'checkbox',
      required: false
    },
    {
      label: 'Video',
      field: 'fullscreen',
      input: 'file',
      options: {
        accept: '.mp4,.webm',
        hint: 'Recommended canvas size: 3840 × 2160',
        limit: 1 * 1024 * 1024 * 1024, // 1 GB
        maxCount: 1
      },
      required: true,
      localised: true
    }
  ]
}
