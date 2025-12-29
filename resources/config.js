exports = module.exports = {
  group: '1. BKK109',
  displayname: '1.1. Global Configuration',
  schema: [
    {
      label: 'Reboot Server',
      field: 'rebootServer',
      input: 'checkbox',
      localised: false
    },
    {
      label: 'Reset all devices?',
      field: 'resetAllDevices',
      input: 'checkbox',
      localised: false
    }
  ],
  type: 'normal',
  maxCount: 1
}
