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
      label: 'wysiwyg',
      field: 'wysiwyg',
      input: 'wysiwyg',
      localised: true,
      required: true
    },
    {
      label: 'Options',
      field: 'options',
      input: 'paragraph',
      required: false,
      localised: false,
      options: {
        maxCount: 4,
        dynamicLayout: true,
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

