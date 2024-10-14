exports = (module.exports = {
  displayname: '1. Dates Examples', // Optional, by default filename
  group: 'standards',
  schema: [
    {
      field: 'date',
      input: 'date'
    },
    {
      field: 'gdate',
      input: 'date',
      localised: false
    },
    {
      field: 'time',
      input: 'time'
    },
    {
      field: 'gtime',
      input: 'time',
      localised: false
    },
    {
      field: 'datetime',
      input: 'datetime'
    },
    {
      field: 'gdatetime',
      input: 'datetime',
      localised: false
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
