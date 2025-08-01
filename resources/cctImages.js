export default {
  displayname: {
    enUS: 'CCT Images'
  },
  group: {
    enUS: 'Configurations'
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
        maxCount: 1
      },
      input: 'image'
    }
  ],
  type: 'normal',
}
