exports = module.exports = {
  displayname: 'Tower Detail Item',
  schema: [
    {
      label: 'Value',
      field: 'value',
      input: 'string',
      localised: true,
      required: true
    },
    {
      label: 'Description',
      field: 'description',
      input: 'wysiwyg',
      options: {
        buttons: ['bold', 'italic']
      },
      localised: true,
      required: true
    }
  ]
}
