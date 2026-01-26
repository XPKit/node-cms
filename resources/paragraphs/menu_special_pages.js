module.exports = {
  displayname: 'Menu - Special Page',
  schema: [
    {
      label: 'Page Type',
      field: 'pageType',
      input: 'select',
      source: [
        'calendar',
        'dashboard',
        'all-compare',

        'uh-qtvr',
        'uh-compare',
        'uh-mix-all',
        'uh-units',
        'uh-zonal-selection',

        'wr-qtvr',
        'wr-compare',
        'wr-mix-all',
        'wr-units',
        'wr-zonal-selection',
      ],
      localised: false,
      required: true,
    },
  ],
}
