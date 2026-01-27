module.exports = {
  group: '1. BKK109',
  displayname: '1.5. Screens',
  schema: [
    {
      name: 'Key',
      field: 'key',
      input: 'string',
      localised: false,
      unique: true,
      required: true
    },
    {
      name: 'Level',
      field: 'level',
      input: 'select',
      source: ['2', '3'],
      localised: false,
      required: true
    },
    {
      name: 'Name',
      field: 'name',
      input: 'string',
      localised: true,
      required: true
    },
    {
      name: 'Type',
      field: 'type',
      input: 'select',
      source: ['led-wall', 'tv-screen'],
      localised: false,
      required: true
    },
    {
      label: 'IP',
      field: 'ip',
      input: 'string',
      localised: false,
      required: true
    },
    {
      label: 'Current User Token',
      field: 'currentUserToken',
      input: 'string',
      localised: false,
      disabled: true,
      required: false
    },
    {
      label: 'Can Control Lights?',
      field: 'canControlLights',
      input: 'checkbox',
      localised: false,
      required: false
    },
    {
      label: 'Status',
      field: 'status',
      disabled: true,
      input: 'select',
      source: ['online', 'offline', 'in-use'],
      localised: false
    },
    {
      label: 'Order',
      field: 'order',
      input: 'number',
      localised: false,
      required: false
    }
  ],
  type: 'normal',
  locales: ['enUS', 'zhCN']
}
