// Corporate website resource example
export default {
  displayname: { enUS: 'Corporate Pages' },
  schema: [
    {
      field: 'title',
      input: 'text',
      localised: false,
      required: true,
    },
    {
      field: 'slug',
      input: 'transliterate',
      localised: false,
      required: true,
      options: { valueFrom: 'title' },
    },
    {
      field: 'summary',
      input: 'text',
      localised: false,
    },
    {
      field: 'body',
      input: 'wysiwyg',
      localised: false,
      options: {
        buttons: [
          'bold', 'italic', 'underline', 'strike', 'blockquote', 'code', 'link',
          'ordered_list', 'bullet_list', 'heading', 'subscript', 'superscript',
          'undo', 'redo', 'image', 'table', 'hr', 'align_left', 'align_center',
          'align_right', 'align_justify', 'color', 'background', 'remove_format', 'fullscreen',
        ],
      },
    },
    {
      field: 'heroImage',
      input: 'image',
      localised: false,
      options: {
        accept: 'image/*',
        maxCount: 1,
      },
    },
    {
      field: 'attachments',
      input: 'file',
      localised: false,
      options: {
        accept: '*',
        maxCount: 5,
      },
    },
    {
      field: 'seoTitle',
      input: 'text',
      localised: false,
    },
    {
      field: 'seoDescription',
      input: 'text',
      localised: false,
    },
  ],
}