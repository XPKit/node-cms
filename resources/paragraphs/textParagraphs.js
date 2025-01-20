exports = (module.exports = {
  displayname: 'My text',
  schema: [
    {
      label: 'Text field',
      field: 'text',
      input: 'text'
    },
    {
      label: 'Wysiwyg',
      field: 'wysiwyg',
      input: 'wysiwyg'
    },
    {
      field: 'comment',
      input: 'select',
      source: 'comments'
    }
  ]
})
