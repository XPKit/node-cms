exports = module.exports = {
  displayname: {
    enUS: 'Provinces'
  },
  group: {
    enUS: 'Dealerships'
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
      label: 'Country',
      field: 'country',
      input: 'select',
      source: 'countries',
      localised: false
    }
  ],
  locales: ['en', 'zh', 'th', 'vi', 'ko', 'ar', 'kh'],
  type: 'downstream'
}
