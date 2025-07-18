// Admin tool resource example
module.exports = {
  displayname: { enUS: 'IT Admin Tool' },
  schema: [
    {
      field: 'taskName',
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
      field: 'status',
      input: 'select',
      localised: false,
      options: {
        values: ['pending', 'in_progress', 'completed', 'failed'],
      },
    },
    {
      field: 'assignedTo',
      input: 'select',
      localised: false,
      source: 'users',
    },
    {
      field: 'startTime',
      input: 'datetime',
      localised: false,
    },
    {
      field: 'endTime',
      input: 'datetime',
      localised: false,
    },
    {
      field: 'logFile',
      input: 'file',
      localised: false,
      options: {
        accept: '.log,.txt',
        maxCount: 1,
      },
    },
    {
      field: 'output',
      input: 'wysiwyg',
      localised: false,
      options: {
        buttons: ['code', 'undo', 'redo', 'remove_format'],
      },
    },
  ],
}
