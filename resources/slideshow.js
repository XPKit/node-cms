exports = module.exports = {
  group: '2. Exploration App',
  displayname: '2.08. Slideshow [7B]',
  schema: [
    {
      unique: true,
      label: 'Unique Id',
      field: 'id',
      input: 'string',
      localised: false,
      required: true
    },
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      localised: true,
      required: false
    },
    {
      label: 'Image',
      field: 'image',
      input: 'image',
      options: {
        hint: 'Recommended image size: 1 image: 3295 × 1563, 2 images: 1648 × 1563, 3+ images 2084 × 1563. Note: If the image is larger, it will be centered and cropped on the sides.',
        accept: '.jpg,.png',
        limit: 1 * 1024 * 1024, // 1 MB
        maxCount: 1
      },
      localised: true,
      required: true
    },
    {
      label: 'Slideshow',
      field: 'slideshow',
      input: 'paragraph',
      options: {
        types: [
          'slideshow_image',
          'slideshow_image_with_text',
          'slideshow_video'
        ]
      },
      localised: false,
      required: false
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}
