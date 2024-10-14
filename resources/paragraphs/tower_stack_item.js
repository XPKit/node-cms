exports = module.exports = {
  displayname: 'Tower Stack Item',
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
        accept: '.jpg,.png',
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
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: false,
      required: true
    },
    {
      label: 'Name',
      field: 'name',
      input: 'string',
      localised: true,
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
      label: 'Note',
      field: 'note',
      input: 'wysiwyg',
      options: {
        buttons: ['bold', 'italic']
      },
      localised: true,
      required: false
    },
    {
      label: 'Plan',
      field: 'plan',
      input: 'image',
      options: {
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
        accept: '.jpg,.png',
        maxCount: 1
      },
      localised: true,
      required: false
    },
    {
      label: 'Right Side Details',
      field: 'rightSideDetails',
      input: 'paragraph',
      options: {
        types: [
          'tower_detail_item'
        ],
        maxCount: 8
      },
      localised: false
    }
  ]
}
