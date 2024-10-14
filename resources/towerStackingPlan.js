exports = module.exports = {
  group: '2. Exploration App',
  displayname: '2.15. Tower - Stacking Plan [1A]',
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
      label: 'Tower Id',
      field: 'tower',
      input: 'select',
      source: ['1','2','3','4','5','6','7'],
      localised: false,
      unique: false,
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
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: true,
      required: false
    },
    {
      label: 'Default Right Side Details',
      field: 'default.rightSideDetails',
      input: 'paragraph',
      options: {
        types: [
          'tower_detail_item'
        ],
        maxCount: 8
      },
      localised: false
    },
    {
      label: 'Stacks',
      field: 'stacks',
      input: 'paragraph',
      options: {
        types: [
          'tower_stack_item'
        ],
        maxCount: 5
      },
      localised: false
    }
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal'
}
