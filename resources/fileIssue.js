exports = module.exports = {
  group: '2. Exploration App',
  displayname: '99. File Issue',
  groups: {
    default: {
      label: 'Default'
    }
  },
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
      label: 'Image',
      field: 'testHint',
      input: 'image',
      options: {
        accept: '.jpg,.png',
        hint: {
          enUS: 'enUS - File should be 400x400',
          zhCN: 'zhCN - File should be 400x400'
        },
        maxCount: 1
      },
      localised: false,
      required: false
    },
    {
      label: 'File',
      field: 'nested.file',
      input: 'file',
      options: {
        hint: 'Test hint file',
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: true,
      required: false
    },
    {
      label: 'Image',
      field: 'nested.image',
      input: 'image',
      options: {
        hint: 'Test hint',
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: true,
      required: false
    },
    {
      label: 'Images',
      field: 'images',
      input: 'paragraph',
      options: {
        types: [
          'images'
        ],
        maxCount: 5
      },
      localised: false
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}
