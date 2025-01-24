exports = module.exports = {
  displayname: {
    enUS: 'Regions'
  },
  group: {
    enUS: 'TEST IMPORT'
  },
  schema: [
    {
      label: 'Key',
      field: 'key',
      input: 'string',
      localised: false,
      unique: true
    },
    {
      label: 'Name',
      field: 'name',
      input: 'string'
    }
  ],
  locales: ['en', 'zh', 'th', 'vi', 'ko', 'ar', 'kh'],
  type: 'downstream'
}
