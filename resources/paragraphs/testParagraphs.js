exports = (module.exports = {
  schema: [
    {
      label: 'string label',
      input: 'string',
      field: 'string'
    },
    {
      label: 'text label',
      input: 'text',
      field: 'text'
    },
    {
      label: 'Checkbox label',
      field: 'checkbox',
      input: 'checkbox'
    },
    {
      label: 'Image label',
      field: 'image',
      input: 'image'
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
      label: 'File paragraphs',
      field: 'testParagraph2',
      input: 'newParagraph',
      options: {
        types: ['fileParagraphs']
      },
      localised: false
    }
  ]
})
