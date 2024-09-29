exports = module.exports = {
  schema: [
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      localised: true,
      required: true
    },
    {
      label: 'wysiwyg',
      field: 'wysiwyg',
      input: 'wysiwyg',
      localised: true,
      required: true
    },
    {
      label: 'Subtitle',
      field: 'subtitle',
      input: 'string',
      localised: true,
      required: false
    },
    {
      label: 'Description',
      field: 'description',
      input: 'text',
      localised: true,
      required: false
    },
    {
      label: 'Icon',
      field: 'icon',
      input: 'image',
      options: {
        maxCount: 1
      },
      localised: false,
      required: true
    },
    {
      field: 'oscMessage',
      input: 'string',
      localised: false,
      required: true
    },
    {
      label: 'Skip',
      field: 'skip',
      input: 'paragraph',
      required: true,
      localised: false,
      options: {
        maxCount: 1,
        types: ['sequence_item_skip']
      }
    }
  ]
}
