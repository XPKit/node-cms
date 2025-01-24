exports = (module.exports = {
  displayname: {
    enUS: 'Markets'
  },
  group: {
    enUS: 'TEST IMPORT'
  },
  schema: [
    {
      field: 'key',
      input: 'string',
      required: true,
      unique: true
    },
    {
      label: 'Country Code',
      field: 'code',
      input: 'string',
      required: true
    },
    {
      label: 'Name',
      field: 'name',
      input: 'string',
      required: true
    }
  ],
  type: 'normal'
})
