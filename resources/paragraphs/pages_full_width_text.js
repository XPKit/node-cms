exports = module.exports = {
  displayname: 'Full Width Text',
  schema: [
    {
      label: 'Logo',
      field: 'logo',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: auto × 140',
        accept: '.jpg,.png,.svg',
        maxCount: 1
      },
      localised: true,
      required: false
    },
    {
      label: 'Text',
      field: 'text',
      input: 'wysiwyg',
      options: {
        buttons: ['heading-3', 'paragraph', 'bold', 'clear-format', 'undo', 'redo']
      },
      localised: true,
      required: true
    },
    {
      label: 'Is Vertically Centered?',
      field: 'isVerticallyCentered',
      input: 'checkbox',
      required: false
    }
  ]
}
