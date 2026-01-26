module.exports = {
  group: 'CMS',
  displayname: 'Admin Settings',
  schema: [
    {
      label: 'Reboot Server',
      field: 'rebootServer',
      input: 'checkbox',
      localised: false,
    },
  ],
  type: 'normal',
  maxCount: 1,
}
