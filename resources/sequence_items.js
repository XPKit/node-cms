exports = module.exports = {
  displayname: 'Sequence Items',
  group: 'Show Suite',
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
      label: 'Options',
      field: 'options',
      input: 'paragraph',
      required: true,
      localised: false,
      options: {
        maxCount: 1,
        types: [
          'sequence_item_standard_actions',
          'sequence_item_timer_actions',
          'sequence_item_modal_control_components',
          'sequence_item_inline_control_components'
        ]
      }
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
}

