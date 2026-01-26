module.exports = {
  displayname: '1 Column - Text + Image',
  schema: [
    {
      label: 'Logo',
      field: 'logo',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: auto × 70',
        accept: '.jpg,.png,.svg',
        limit: 500 * 1024, // 500 KB
        maxCount: 1,
      },
      localised: true,
      required: false,
    },
    {
      label: 'Text',
      field: 'text',
      input: 'wysiwyg',
      options: {
        buttons: ['heading-3', 'paragraph', 'bold', 'clear-format', 'undo', 'redo'],
      },
      localised: true,
      required: false,
    },
    {
      label: 'Image',
      field: 'image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 1624 × 1672',
        accept: '.jpg',
        limit: 1 * 1024 * 1024, // 1 MB
        maxCount: 1,
      },
      localised: true,
      required: true,
    },
    {
      label: 'Fullscreen',
      field: 'fullscreen',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 2682 × 2160',
        accept: '.jpg',
        limit: 2 * 1024 * 1024, // 2 MB
        maxCount: 1,
      },
      localised: true,
      required: true,
    },
    {
      label: 'Disclaimer',
      field: 'disclaimer',
      input: 'checkbox',
      required: false,
    },
  ],
}
