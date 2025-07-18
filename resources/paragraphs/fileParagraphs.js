module.exports = {
  schema: [
    {
      label: 'File paragraph file field',
      input: 'file',
      field: 'file'
    },
    {
      label: 'File paragraph sub text paragraph',
      field: 'testParagraph3',
      input: 'paragraph',
      options: {
        types: ['textParagraphs']
      },
      localised: false
    }
  ]
}
