exports = module.exports = {
  group: '2. Exploration App',
  displayname: '2.02. Page A [6C, 6D]',
  schema: [
    {
      label: 'Unique Id',
      field: 'id',
      input: 'string',
      unique: true,
      localised: false,
      required: true
    },
    {
      label: 'Has Backdrop',
      field: 'hasBackdrop',
      input: 'boolean',
      localised: false,
      required: false
    },
    {
      label: 'Image',
      field: 'content',
      input: 'file',
      options: {
        maxCount: 1
      },
      localised: true,
      required: true
    },
    {
      label: 'Fullscreen image/video',
      field: 'fullscreen',
      input: 'file',
      options: {
        accept: '.jpg,.png,.mp4,.webm',
        maxCount: 1
      },
      localised: true
    },
    {
      label: 'Items',
      field: 'items',
      input: 'paragraph',
      options: {
        types: [
          'pageA_title',
          'pageA_subtitle',
          'pageA_text'
        ],
        maxCount: 4
      },
      localised: false
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}
