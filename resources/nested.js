exports = (module.exports = {
  displayname: 'Nested Examples', // Optional, by default filename
  schema: [
    {
      label: 'address country name',
      field: 'address.country.name',
      input: 'string',
      localised: true
    },
    {
      label: 'address country code',
      field: 'address.country.code',
      input: 'string',
      localised: false,
      required: true
    },
    {
      label: 'Street',
      field: 'address.street',
      input: 'pillbox',
      min: 1,
      max: 4
    },
    {
      label: 'address street name',
      field: 'address.street.name',
      input: 'string',
      localised: false
    },
    {
      label: 'address street postal',
      field: 'address.street.postal',
      input: 'number',
      localised: false
    },
    {
      label: 'city province name',
      field: 'city.province.name',
      input: 'string',
      localised: true
    },
    {
      label: 'city province code',
      field: 'city.province.code',
      input: 'string',
      localised: false
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
