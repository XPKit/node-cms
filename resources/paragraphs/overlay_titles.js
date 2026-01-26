module.exports = {
  displayname: 'Overlay Title',
  schema: [
    {
      label: 'Title',
      field: 'title',
      input: 'text',
      localised: true,
      required: true,
    },
    {
      label: 'Color',
      field: 'color',
      input: 'select',
      source: ['white', 'black'],
      localised: false,
      required: true,
    },
    {
      label: 'Position',
      field: 'position',
      input: 'select',
      source: ['top-left', 'middle-left', 'middle-right'],
      localised: false,
      required: true,
    },
    {
      label: 'Display On',
      field: 'displayOn',
      input: 'select',
      source: ['tablet', 'kiosk', 'both'],
      localised: false,
      required: true,
    },
  ],
}
