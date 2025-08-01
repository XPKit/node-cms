// Other field types and options example
export default {
  displayname: { enUS: 'Other Field Types & Options' },
  schema: [
    // Integer field
    {
      field: 'quantity',
      input: 'integer',
      localised: false,
      required: true,
      options: { min: 0, max: 100, hint: 'Enter a value between 0 and 100' },
    },
    // Double field
    {
      field: 'price',
      input: 'double',
      localised: false,
      required: true,
    },
    // Unique field
    {
      field: 'uniqueId',
      input: 'string',
      localised: false,
      required: true,
      unique: true,
    },
    // File field with hint and accept
    {
      field: 'manual',
      input: 'file',
      localised: false,
      options: {
        accept: '.pdf,.docx',
        hint: 'Upload a PDF or DOCX manual',
        maxCount: 1,
      },
    },
    // Image field with hint
    {
      field: 'icon',
      input: 'image',
      localised: false,
      options: {
        accept: '.jpg,.png',
        hint: 'Recommended size: 128x128',
        maxCount: 1,
      },
    },
    // Select field with static array
    {
      field: 'status',
      input: 'select',
      localised: false,
      source: ['active', 'inactive', 'archived'],
      required: true,
    },
    // Multiselect field with customLabel
    {
      field: 'contributors',
      input: 'multiselect',
      localised: false,
      source: 'authors',
      options: { customLabel: '{{name}}' },
    },
    // Checkbox field with textOn/textOff
    {
      field: 'enable',
      input: 'checkbox',
      localised: false,
      required: true,
      options: { textOn: 'Enable', textOff: 'Disable' },
    },
    // Paragraph field with maxCount
    {
      field: 'attachments',
      input: 'paragraph',
      localised: false,
      options: { types: ['fileParagraphs'], maxCount: 3 },
    },
    // Field with regex validation
    {
      field: 'code',
      input: 'string',
      localised: false,
      required: true,
      options: {
        regex: {
          value: /^[A-Z]{3}\d{3}$/,
          description: 'Format: AAA123',
        },
      },
    },
  ],
}
