module.exports = {
  title: 'testParagraphAddMultiple',
  displayname: 'Test Paragraph Add Multiple',
  schema: [
    {
      field: 'title',
      label: 'Title',
      input: 'text',
      required: true
    },
    {
      field: 'testAddMultiple',
      label: 'Test Add Multiple',
      input: 'paragraph',
      options: {
        types: ['testAddMultipleImage', 'testAddMultipleFile'],
        mapping: {
          default: {
            _type: 'testAddMultipleImage',
            field: 'image'
          },
          'mp4,mkv,avi': {
            _type: 'testAddMultipleFile',
            field: 'video'
          },
          'jpg,jpeg,png,gif,webp': {
            _type: 'testAddMultipleImage',
            field: 'image'
          },
          'pdf,doc,docx,txt': {
            _type: 'testAddMultipleFile',
            field: 'file'
          }
        },
        dynamicLayout: true
      }
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
}
