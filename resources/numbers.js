exports = (module.exports = {
  displayname: '2. Number examples', // Optional, by default filename
  group: 'standards',
  schema: [
    {
      field: 'number',
      input: 'number',
      required: true
    },
    {
      field: 'gnumber',
      input: 'number',
      localised: false
    },
    {
      field: 'integer',
      input: 'integer',
      required: true
    },
    {
      field: 'ginteger',
      input: 'integer',
      localised: false
    },
    {
      field: 'double',
      input: 'double',
      required: true
    },
    {
      field: 'gdouble',
      input: 'double',
      localised: false
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
