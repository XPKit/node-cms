// Paragraph type: testParagraphs
export default {
  displayname: { enUS: 'Test Paragraph' },
  schema: [
    {
      field: 'string',
      input: 'string',
      localised: false,
    },
    {
      field: 'value',
      input: 'string',
      localised: false,
    },
    {
      field: 'wysiwyg',
      input: 'wysiwyg',
      localised: false,
    },
    {
      field: 'image',
      input: 'image',
      options: { maxCount: 1 },
      localised: false,
    },
    {
      field: 'imageLocalised',
      input: 'image',
      localised: true,
    },
    {
      field: 'text',
      input: 'text',
      localised: true,
    },
    {
      field: 'checkbox',
      input: 'checkbox',
      localised: false,
    },
    {
      field: 'select',
      input: 'select',
      source: 'authors',
      options: { customLabel: '{{name}}' },
      localised: false,
    },
    {
      field: 'select4',
      input: 'multiselect',
      source: 'authors',
      options: { customLabel: '{{name}}' },
      localised: false,
    },
    {
      field: 'select2',
      input: 'select',
      source: ['1', '2', '3'],
      localised: false,
    },
  ],
}
