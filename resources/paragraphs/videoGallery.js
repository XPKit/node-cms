exports = module.exports = {
  displayname: 'Video',
  schema: [
    {
      label: 'Caption',
      field: 'caption',
      input: 'string',
      required: false,
      localised: false
    },
     {
      label: 'Thumbnail',
      field: 'thumbnail',
      input: 'image',
      options: {
        hint: 'Recommended image size: 16:9',
        accept: '.jpg,.png',
        maxCount: 1
      },
      required: true
    },
     {
      label: 'Video',
      field: 'video',
      input: 'file',
      options: {
        hint: 'Recommended video size: 16:9',
        accept: '.mp4',
        maxCount: 1
      },
      required: true
    },
  ],
  layout: {
    slots: 4
  }
}
