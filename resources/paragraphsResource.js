exports = (module.exports = {
  schema: [
    {
      field: 'name',
      input: 'string',
      required: false,
      localised: false
    },
    {
      label: 'Test Paragraph 1',
      field: 'testParagraph1',
      input: 'newParagraph',
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
