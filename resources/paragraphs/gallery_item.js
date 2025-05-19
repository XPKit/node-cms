exports = module.exports = {
  displayname: 'Gallery - Items',
  schema: [
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      required: false,
      localised: true
    },
    {
      label: 'Thumbnail',
      field: 'thumbnail',
      input: 'image',
      options: {
        accept: '.jpg,.png',
        hint: 'Recommended image size: 800 x 600',
        maxCount: 1
      },
      required: true,
      localised: true
    },
    {
      label: 'Fullscreen',
      field: 'fullscreen',
      input: 'file',
      options: {
        hint: 'Recommended canvas size: 3840 x 2160',
        accept: '.jpg,.png,.mp4,.webm',
        maxCount: 1
      },
      required: false,
      localised: true
    }
  ]
}
