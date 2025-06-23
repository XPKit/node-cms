exports = (module.exports = {
  displayname: {
    enUS: 'CCT Images'
  },
  group: {
    enUS: 'TEST IMPORT'
  },
  schema: [
    {
      label: 'Key',
      field: 'key',
      localised: false,
      unique: true,
      required: true,
      input: 'string'
    },
    {
      label: 'Image',
      field: 'image',
      localised: false,
      required: true,
      options: {
        maxCount: 3,
        accept: '.jpg,.png,.mp4,.webm'
      },
      input: 'image'
    }
  ],
  type: 'normal'
})
