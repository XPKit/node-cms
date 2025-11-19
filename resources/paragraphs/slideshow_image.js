exports = module.exports = {
  displayname: 'Slideshow Image',
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
      localised: true,
      required: true
    },
    {
      label: 'Zoomable',
      field: 'zoomable',
      input: 'checkbox',
      localised: false,
      required: false
    },
    {
      label: 'Fullscreen',
      field: 'fullscreen',
      input: 'file',
      options: {
        hint: 'Recommended canvas size: 3840 × 2160',
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: false,
      required: true
    }
  ]
}
