export default {
  displayname: {
    enUS: 'Countries'
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
      label: 'Region',
      field: 'region',
      input: 'select',
      source: 'regions',
      localised: false
    },
    {
      label: 'Market',
      field: 'market',
      input: 'select',
      source: 'markets',
      localised: false
    }
  ],
  locales: ['en', 'zh', 'th', 'vi', 'ko', 'ar', 'kh'],
  type: 'downstream'
}
