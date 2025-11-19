exports = module.exports = {
  displayname: 'Slideshow Image With Text',
  schema: [
    {
      label: 'Image',
      field: 'image',
      input: 'image',
      options: {
        hint: 'Recommended image size: 1 image: 3295 × 1563, 2 images: 1648 × 1563, 3+ images 2084 × 1563. Note: If the image is larger, it will be centered and cropped on the sides.',
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: false,
      required: true
    },
    {
      label: 'Text',
      field: 'text',
      input: 'wysiwyg',
      localised: false,
      required: false
    }
  ]
}
