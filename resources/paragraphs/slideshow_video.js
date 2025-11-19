exports = module.exports = {
  displayname: 'Slideshow Video',
  schema: [
    {
      label: 'Video',
      field: 'video',
      input: 'file',
      options: {
        hint: 'Recommended canvas size: 3840 × 2160',
        accept: '.mp4,.webm',
        maxCount: 1
      },
      localised: false
    }
  ]
}
