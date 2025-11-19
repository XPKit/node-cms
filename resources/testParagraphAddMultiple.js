module.exports = {
  title: 'testParagraphAddMultiple',
  displayname: 'Test Paragraph Add Multiple',
  schema: [
    {
      field: 'string',
      label: 'string',
      input: 'string',
      required: true
    },
    {
      field: 'text',
      label: 'text',
      input: 'text',
      required: true
    },
    {
      field: 'wysiwyg',
      label: 'wysiwyg',
      input: 'wysiwyg',
      required: true
    },
    // {
    //   field: 'testAddMultiple',
    //   label: 'Test Add Multiple',
    //   input: 'paragraph',
    //   localised: false,
    //   options: {
    //     types: ['testAddMultipleImage', 'testAddMultipleImagei18n'],
    //     mapping: {
    //       default: {
    //         _type: 'testAddMultipleImage',
    //         field: 'image'
    //       },
    //       'mp4,mkv,avi': {
    //         _type: 'testAddMultipleFile',
    //         field: 'video'
    //       },
    //       'jpg,jpeg,png,gif,webp': {
    //         _type: 'testAddMultipleImage',
    //         field: 'image'
    //       },
    //       'pdf,doc,docx,txt': {
    //         _type: 'testAddMultipleFile',
    //         field: 'file'
    //       }
    //     },
    //     dynamicLayout: true
    //   }
    // }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
}
