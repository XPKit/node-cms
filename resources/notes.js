module.exports = {
  group: '1. BKK109',
  displayname: '1.4. Notes',
  schema: [
    {
      label: 'Unique Id',
      field: 'id',
      input: 'string',
      unique: true,
      localised: false,
      required: true
    },
    {
      label: 'Linked Page',
      field: 'linkedPage',
      input: 'string',
      options: {
        hint: 'The unique id of the page this note is linked to'
      },
      unique: false,
      localised: false,
      required: true
    },
    {
      label: 'Content',
      field: 'content',
      input: 'wysiwyg',
      options: {
        buttons: ['bold', 'underline', 'superscript', 'paragraph', 'bullet-list', 'ordered-list', 'heading-1', 'heading-2', 'heading-3', 'quote', 'clear-format', 'undo', 'redo']
      },
      localised: false
    }
  ],
  type: 'normal'
}
