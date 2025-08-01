// Paragraph type: textParagraphs
export default {
  displayname: { enUS: 'Text Paragraph' },
  schema: [
    {
      field: 'text',
      input: 'text',
      localised: true,
      required: true,
    },
    {
      field: 'wysiwyg',
      input: 'wysiwyg',
      localised: true,
    },
    {
      field: 'comment',
      input: 'select',
      source: 'comments',
      localised: false,
    },
  ],
}
