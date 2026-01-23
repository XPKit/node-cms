exports = module.exports = {
  group: '1. BKK109',
  displayname: '1.6. Lights',
  schema: [
    {
      label: 'Unique Id',
      field: 'id',
      input: 'string',
      unique: true,
      localised: false,
      required: true
    },
    {
      label: 'Linked Page',
      field: 'linkedPage',
      input: 'string',
      options: {
        hint: 'The unique id of the page this note is linked to'
      },
      unique: false,
      localised: false,
      required: true
    },
    {
      label: 'OSC Messages',
      field: 'oscMessages',
      input: 'paragraph',
      options: {
        types: [
          'osc_messages'
        ]
      },
      unique: false,
      localised: false,
      required: false
    }
  ],
  type: 'normal'
}
