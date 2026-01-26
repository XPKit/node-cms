module.exports = {
  displayname: 'Image With Text',
  schema: [
    {
      label: 'Overlay Titles',
      field: 'overlayTitles',
      input: 'paragraph',
      options: {
        types: ['overlay_titles'],
      },
      localised: false,
      required: false,
    },
    {
      label: 'Image',
      field: 'image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 2572 × 1672',
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
        hint: 'Recommended canvas size: 3840 × 2160',
        accept: '.jpg',
        limit: 2 * 1024 * 1024, // 2 MB
        maxCount: 1,
      },
      localised: true,
      required: true,
    },
    {
      label: 'Text',
      field: 'text',
      input: 'wysiwyg',
      options: {
        buttons: ['heading-3', 'paragraph', 'clear-format', 'undo', 'redo'],
      },
      localised: true,
      required: false,
    },
    {
      label: 'Text Alignment',
      field: 'textAlignment',
      input: 'select',
      source: ['left', 'center', 'right'],
      localised: true,
    },
    {
      label: 'Disclaimer',
      field: 'disclaimer',
      input: 'checkbox',
      required: false,
    },
    {
      label: 'Has Brackets',
      field: 'hasBrackets',
      input: 'checkbox',
      required: false,
    },
  ],
}
