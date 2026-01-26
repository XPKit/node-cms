module.exports = {
  displayname: 'Special Page',
  schema: [
    {
      label: 'Page Type',
      field: 'pageType',
      input: 'select',
      source: ['calendar', 'dashboard', '360_view', 'compare_unit', 'unit_mix', 'unit', 'zonal_selection'],
      localised: false,
      required: true,
    },
  ],
}
