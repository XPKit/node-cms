exports = module.exports = {
  displayname: 'View',
  schema: [
    {
      label: 'Image',
      field: 'image',
      localised: false,
      required: true,
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 1080 × 608',
        accept: '.jpg',
        limit: 1 * 1024 * 1024, // 1 MB
        maxCount: 1
      }
    },
    {
      label: 'Fullscreen',
      field: 'fullscreen',
      localised: false,
      required: true,
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 3840 × 2160',
        accept: '.jpg',
        limit: 2 * 1024 * 1024, // 2 MB
        maxCount: 1
      }
    },
    {
      label: 'Daytime',
      field: 'qtvr.daytime',
      localised: false,
      required: true,
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 7680 × 3840',
        accept: '.jpg',
        limit: 5 * 1024 * 1024, // 5 MB
        maxCount: 1
      }
    },
    {
      label: 'Nighttime',
      field: 'qtvr.nighttime',
      localised: false,
      required: true,
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 7680 × 3840',
        accept: '.jpg',
        limit: 5 * 1024 * 1024, // 5 MB
        maxCount: 1
      }
    },
    {
      label: 'Level',
      field: 'qtvr.level',
      input: 'integer',
      localised: false,
      required: true
    },
    {
      label: 'Show Disclaimer',
      field: 'showDisclaimer',
      localised: false,
      required: false,
      input: 'checkbox'
    }
  ]
}
