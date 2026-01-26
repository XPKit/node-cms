module.exports = {
  group: '1. BKK109',
  displayname: '1.7. Feedbacks',
  schema: [
    {
      label: 'Author',
      field: 'author',
      input: 'select',
      source: 'portalUsers',
      localised: false,
      required: false,
    },
    {
      label: 'Star Rate',
      field: 'starRate',
      input: 'number',
      localised: false,
      required: true,
    },
    {
      label: 'Feedback Notes',
      field: 'feedbackNotes',
      input: 'text',
      localised: false,
      required: true,
    },
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal',
}
