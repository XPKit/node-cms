exports = module.exports = {
  displayname: {
    enUS: 'Cities'
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
    },
    {
      label: 'Province',
      field: 'province',
      input: 'select',
      source: 'provinces',
      localised: false
    }
  ],
  locales: ['en', 'zh', 'th', 'vi', 'ko', 'ar', 'kh'],
  type: 'downstream'
}
