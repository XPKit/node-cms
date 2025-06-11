exports = module.exports = {
  displayname: 'Card Item',
  schema: [
    {
      label: 'Card Title',
      field: 'title',
      input: 'string',
      localised: true,
      required: true
    },
    {
      label: 'Card Description',
      field: 'description',
      input: 'text',
      localised: true,
      required: false
    },
    {
      label: 'Slots (Column Width)',
      field: 'slots',
      input: 'integer',
      localised: false,
      required: false,
      options: {
        min: 1,
        max: 12,
        hint: 'Leave empty for auto width, or set 1-12 for specific column slots'
      }
    },
    {
      label: 'Card Image',
      field: 'image',
      input: 'image',
      options: {
        maxCount: 1
      },
      localised: false,
      required: false
    },
    {
      label: 'Card Link',
      field: 'link',
      input: 'url',
      localised: false,
      required: false
    }
  ]
}
