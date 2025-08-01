// Analytics dashboard resource example
export default {
  displayname: { enUS: 'Analytics Dashboard' },
  schema: [
    {
      field: 'name',
      input: 'string',
      localised: false,
      required: true,
    },
    {
      field: 'description',
      input: 'text',
      localised: false,
    },
    {
      field: 'createdAt',
      input: 'datetime',
      localised: false,
    },
    {
      field: 'updatedAt',
      input: 'datetime',
      localised: false,
    },
    {
      field: 'metrics',
      input: 'json',
      localised: false,
    },
    {
      field: 'chartType',
      input: 'select',
      localised: false,
      options: {
        values: ['bar', 'line', 'pie', 'area'],
      },
    },
    {
      field: 'dataSource',
      input: 'text',
      localised: false,
    },
    {
      field: 'dashboardImage',
      input: 'image',
      localised: false,
      options: {
        accept: 'image/*',
        maxCount: 1,
      },
    },
  ],
}
