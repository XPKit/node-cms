module.exports = {
  displayname: { enUS: 'Test WYSIWYGs' },
  schema: [
    {
      field: 'title',
      input: 'string',
      localised: false,
      required: true,
    },
    {
      field: 'body',
      input: 'wysiwyg',
      localised: false,
      options: {
        buttons: [
          'bold', 'italic'
        ],
      },
    },
    {
      field: 'body2',
      input: 'wysiwyg',
      localised: false,
      required: true,
      options: {
        buttons: [
          'bold', 'italic'
        ],
      },
    },
  ],
}
