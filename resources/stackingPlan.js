exports = module.exports = {
  group: '2. Exploration App',
  displayname: '2.09. Stacking Plan [5A]',
  groups: {
    default: {
      label: 'Default'
    }
  },
  schema: [
    {
      unique: true,
      label: 'Unique Id',
      field: 'id',
      input: 'string',
      localised: false,
      required: true
    },
    {
      label: 'Title',
      field: 'default.title',
      input: 'string',
      localised: true,
      required: false
    },
    {
      label: 'Plan',
      field: 'default.plan',
      input: 'image',
      options: {
        hint: 'Recommended image size: 2755 × 1667',
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: true,
      required: false
    },
    {
      label: 'Fullscreen Plan',
      field: 'default.fullscreenPlan',
      input: 'image',
      options: {
        hint: 'Recommended image size: 3840 × 2160',
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: true,
      required: false
    },
    {
      label: 'Stacks',
      field: 'stacks',
      input: 'paragraph',
      options: {
        types: [
          'stack_item'
        ],
        maxCount: 5
      },
      localised: false
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}
