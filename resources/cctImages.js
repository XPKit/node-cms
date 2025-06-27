exports = (module.exports = {
  displayname: {
    enUS: 'CCT Images'
  },
  group: {
    enUS: 'TEST IMPORT'
  },
  schema: [
    {
      label: 'Key',
      field: 'key',
      localised: false,
      unique: true,
      required: true,
      input: 'string'
    },
    {
      label: 'Other Field',
      field: 'otherField',
      localised: false,
      required: true,
      input: 'string'
    },
    {
      label: 'Auto Slug (Readonly)',
      field: 'autoSlug',
      localised: false,
      required: false,
      input: 'transliterate',
      options: {
        valueFrom: 'otherField'
        // readonly: true is the default - field will always auto-update when otherField changes
      }
    },
    {
      label: 'Editable Slug',
      field: 'editableSlug',
      localised: false,
      required: false,
      input: 'transliterate',
      options: {
        valueFrom: 'otherField',
        readonly: false // User can edit - stops auto-updating once user makes changes (unless field is empty)
      }
    },
    {
      label: 'Image',
      field: 'image',
      localised: false,
      required: true,
      options: {
        maxCount: 3,
        accept: '.jpg,.png,.mp4,.webm'
      },
      input: 'image'
    }
  ],
  type: 'normal'
})
