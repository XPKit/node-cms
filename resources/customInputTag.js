exports = (module.exports = {
  displayname: 'Custom input tags and json', // Optional, by default filename
  group: 'standards',
  schema: [
    {
      field: 'pillbox',
      input: 'pillbox',
      required: true
    },
    {
      field: 'gpillbox',
      input: 'pillbox',
      localised: false
    },
    {
      field: 'json',
      input: 'json'
    },
    {
      field: 'gjson',
      input: 'json',
      localised: false
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
