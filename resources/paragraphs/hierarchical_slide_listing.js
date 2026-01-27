module.exports = {
  displayname: 'Slide - Listing',
  schema: [
    {
      label: 'Sections',
      field: 'sections',
      input: 'paragraph',
      options: {
        types: ['hierarchical_sections']
      },
      localised: false,
      required: true
    },
    {
      label: 'Footer Note',
      field: 'footerNote',
      input: 'string',
      localised: true,
      required: false
    }
  ]
}
