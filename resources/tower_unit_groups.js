module.exports = {
  group: '3. Towers',
  displayname: '3.1. Towers - Unit Groups',
  schema: [
    {
      label: 'Unique ID',
      field: 'id',
      localised: false,
      required: true,
      unique: true,
      input: 'select',
      source: [
        '1-bedroom',
        '2-bedroom',
        '2-bedroom-large',
        '3-bedroom',
        '3-bedroom-large',
        '3-bedroom-multigen',
        '4-bedroom',
        '4-bedroom-deluxe',
        'penthouse'
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
      label: 'Order',
      field: 'order',
      localised: false,
      required: true,
      input: 'integer'
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}
