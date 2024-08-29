exports = (module.exports = {
  schema: [
    {
      field: 'name',
      input: 'string',
      required: false,
      localised: true
    },
    {
      label: 'Image label',
      field: 'simpleImage',
      input: 'image',
      options: {
        maxCount: 1
      },
      localised: false
    },
    {
      label: 'Image label',
      field: 'imageLocalised',
      input: 'image'
    },
    {
      label: 'Test Paragraph 1',
      field: 'testParagraph1',
      input: 'paragraph',
      options: {
        types: ['testParagraphs'],
        maxCount: 6
      },
      localised: false
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
