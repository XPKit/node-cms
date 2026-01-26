module.exports = {
  displayname: 'Tower Floorplan Asset',
  schema: [
    {
      label: 'Image',
      field: 'image',
      localised: true,
      required: true,
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 540 × 304 with transparent background',
        accept: '.png',
        limit: 1 * 1024 * 1024, // 1 MB
        maxCount: 1,
      },
    },
    {
      label: 'Fullscreen',
      field: 'fullscreen',
      localised: true,
      required: true,
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 3840 × 2160',
        accept: '.jpg',
        limit: 2 * 1024 * 1024, // 2 MB
        maxCount: 1,
      },
    },
  ],
}
