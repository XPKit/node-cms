module.exports = {
  displayname: 'Comparison',
  schema: [
    {
      label: 'Logo A',
      field: 'logoA',
      input: 'image',
      localised: false,
      required: true,
    },
    {
      label: 'Logo B',
      field: 'logoB',
      input: 'image',
      localised: false,
      required: true,
    },
    {
      label: 'Link A',
      field: 'linkA',
      input: 'string',
      localised: false,
      required: true,
    },
    {
      label: 'Link B',
      field: 'linkB',
      input: 'string',
      localised: false,
      required: true,
    },
    {
      label: 'Image A',
      field: 'imageA',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 736 × 1520',
        accept: '.jpg',
        limit: 500 * 1024, // 500 KB
        maxCount: 1,
      },
      localised: true,
      required: true,
    },
    {
      label: 'Image B',
      field: 'imageB',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 882 × 1700',
        accept: '.jpg',
        limit: 1 * 1024 * 1024, // 1 MB
        maxCount: 1,
      },
      localised: true,
      required: true,
    },
    {
      label: 'Image A Fullscreen',
      field: 'imageAFullscreen',
      input: 'image',
      options: {
        accept: '.jpg,.png',
        maxCount: 1,
        hint: 'Recommended image size: 882 × 1700',
      },
      localised: true,
      required: true,
    },
    {
      label: 'Image B Fullscreen',
      field: 'imageBFullscreen',
      input: 'image',
      options: {
        accept: '.jpg,.png',
        maxCount: 1,
        hint: 'Recommended image size: 882 × 1700',
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
    {
      label: 'Items',
      field: 'items',
      input: 'paragraph',
      options: {
        types: ['pages_comparison_items'],
        maxCount: 1,
      },
      localised: false,
    },
  ],
  layout: {
    lines: [
      {
        slots: 2,
        fields: [
          { model: 'nameA', width: 1 },
          { model: 'nameB', width: 1 },
        ],
      },
      {
        slots: 2,
        fields: [
          { model: 'linkA', width: 1 },
          { model: 'linkB', width: 1 },
        ],
      },
      {
        slots: 2,
        fields: [
          { model: 'imageA', width: 1 },
          { model: 'imageB', width: 1 },
        ],
      },
      {
        slots: 2,
        fields: [
          { model: 'imageAFullscreen', width: 1 },
          { model: 'imageBFullscreen', width: 1 },
        ],
      },
    ],
  },
}
