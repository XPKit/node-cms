exports = module.exports = {
  displayname: 'Stack Item',
  groups: {
    icon: {
      label: 'Icon'
    }
  },
  schema: [
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      localised: true,
      required: false
    },
    {
      label: 'Icon - On',
      field: 'icon.on',
      input: 'image',
      options: {
        hint: 'Recommended image size: 68 × 121',
        accept: '.svg,.png',
        maxCount: 1
      },
      localised: false,
      required: true
    },
    {
      label: 'Icon - Off',
      field: 'icon.off',
      input: 'image',
      options: {
        hint: 'Recommended image size: 68 × 121',
        accept: '.svg,.png',
        maxCount: 1
      },
      localised: false,
      required: true
    },
    {
      label: 'Level',
      field: 'level',
      input: 'string',
      localised: true,
      required: true
    },
    {
      label: 'Plan',
      field: 'plan',
      input: 'image',
      options: {
        hint: 'Recommended image size: 2755 × 1667',
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: true,
      required: true
    },
    {
      label: 'Fullscreen Plan',
      field: 'fullscreenPlan',
      input: 'image',
      options: {
        hint: 'Recommended image size: 3840 × 2160',
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: true,
      required: false
    }
  ]
}
