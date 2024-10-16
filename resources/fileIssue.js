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
      field: 'nested.image',
      input: 'image',
      options: {
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
