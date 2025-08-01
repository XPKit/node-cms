// Blog resource example
export default {
  displayname: { enUS: 'Blog Posts' },
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
      field: 'author',
      input: 'select',
      localised: false,
      required: true,
      source: 'authors',
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
      field: 'tags',
      input: 'pillbox',
      localised: false,
    },
    {
      field: 'published',
      input: 'checkbox',
      localised: false,
    },
    {
      field: 'publishedAt',
      input: 'datetime',
      localised: false,
    },
    {
      field: 'coverImage',
      input: 'image',
      localised: false,
      options: {
        accept: 'image/*',
        maxCount: 1,
      },
    },
  ],
}
