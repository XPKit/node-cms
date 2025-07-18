// Example resource with paragraph fields
module.exports = {
  displayname: { enUS: 'Page With Paragraphs' },
  schema: [
    {
      field: 'title',
      input: 'text',
      localised: false,
      required: true,
    },
    {
      field: 'intro',
      input: 'wysiwyg',
      localised: false,
    },
    {
      field: 'mainContent',
      input: 'paragraph',
      localised: false,
      options: {
        types: ['textParagraphs', 'testParagraphs'],
        maxCount: 10,
      },
    },
    {
      field: 'sidebar',
      input: 'paragraph',
      localised: false,
      options: {
        types: ['address'],
        maxCount: 2,
      },
    },
  ],
}
