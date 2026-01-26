module.exports = {
  group: '3. Towers',
  displayname: '3.5. Towers - Buildings',
  schema: [
    {
      label: 'Unique ID',
      field: 'id',
      localised: false,
      required: true,
      unique: true,
      input: 'select',
      source: [
        'uh',
        'wr'
      ]
    },
    {
      label: 'Long Name',
      field: 'longName',
      localised: true,
      required: true,
      input: 'string'
    },
    {
      label: 'Short Name',
      field: 'shortName',
      localised: true,
      required: true,
      input: 'string'
    },
    {
      label: 'Zones',
      field: 'zones',
      input: 'multiselect',
      source: 'tower_zones',
      localised: false
    },
    {
      label: 'Order',
      field: 'order',
      localised: false,
      required: true,
      input: 'integer'
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal',
  maxCount: 2
}
