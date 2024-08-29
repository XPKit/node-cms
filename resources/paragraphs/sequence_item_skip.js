exports = module.exports = {
  schema: [
    {
      label: 'Confirm Message',
      field: 'message',
      input: 'string',
      localised: true,
      required: true
    },
    {
      label: 'OSC Message',
      field: 'oscMessage',
      input: 'string',
      localised: false,
      required: true
    }
  ]
}
