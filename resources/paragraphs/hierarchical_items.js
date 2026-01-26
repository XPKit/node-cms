module.exports = {
  displayname: 'Item',
  schema: [
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      localised: true,
      required: true,
    },
    {
      label: 'Value',
      field: 'value',
      input: 'wysiwyg',
      options: {
        buttons: ['bullet-list', 'bold', 'clear-format', 'undo', 'redo'],
      },
      localised: true,
    },
  ],
}
