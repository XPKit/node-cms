exports = (module.exports = {
  schema: [
    {
      label: 'string label',
      input: 'string',
      field: 'string',
      localised: false
    },
    {
      label: 'value',
      input: 'string',
      field: 'value',
      localised: false
    },
    {
      label: 'Image label',
      field: 'image',
      input: 'image',
      options: {
        maxCount: 1
      }
    },
    {
      label: 'Image label',
      field: 'imageLocalised',
      input: 'image',
      localised: true
    },
    {
      label: 'text label',
      input: 'text',
      field: 'text',
      localised: true
    },
    {
      label: 'Checkbox label',
      field: 'checkbox',
      input: 'checkbox'
    },
    {
      label: 'Select Paragraph author',
      input: 'select',
      field: 'select',
      source: 'authors',
      options: {
        customLabel: '{{name}}'
      }
    },
    {
      label: 'Select 2',
      input: 'select',
      field: 'select2',
      source: ['1', '2', '3']
    },
    {
      label: 'Paragraph label',
      field: 'paragraph3',
      input: 'paragraph',
      options: {
        maxCount: 3,
        types: ['address']
      }
    }
  ]
})
