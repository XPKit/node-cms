module.exports = {
  group: '2. Content',
  displayname: '2.1. Menu - Global',
  groups: {
    theProject: {
      label: 'The project',
    },
    theUpperHouse: {
      label: 'The Upper House',
    },
    wirelessPlace: {
      label: 'Wireless Place',
    },
    compareUnits: {
      label: 'Compare Units',
    },
    team: {
      label: 'Team',
    },
    film: {
      label: 'Film',
    },
    faq: {
      label: 'FAQ',
    },
    dashboard: {
      label: 'Dashboard',
    },
    calendar: {
      label: 'Calendar',
    },
    settings: {
      label: 'Settings',
    },
  },
  schema: [
    {
      label: 'Key',
      field: 'theProject.key',
      input: 'string',
      localised: false,
      required: true,
      disabled: true,
    },
    {
      label: 'Name',
      field: 'theProject.name',
      input: 'string',
      localised: true,
      required: true,
    },
    {
      label: 'Image',
      field: 'theProject.image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 522 × 400',
        accept: '.png,.svg',
        limit: 5 * 1024 * 1024, // 5 MB
        maxCount: 1,
      },
      localised: false,
      required: false,
    },
    {
      label: 'Pages',
      field: 'theProject.pages',
      input: 'paragraph',
      options: {
        types: ['menu_pages', 'menu_pages_tabs'],
      },
      localised: false,
    },
    {
      label: 'Is Folder?',
      field: 'theProject.isFolder',
      input: 'checkbox',
      localised: false,
    },
    {
      label: 'Key',
      field: 'theUpperHouse.key',
      input: 'string',
      localised: false,
      required: true,
      readOnly: true,
    },
    {
      label: 'Tower',
      field: 'theUpperHouse.tower',
      input: 'select',
      source: 'tower_buildings',
      localised: false,
      required: true,
      readOnly: true,
    },
    {
      label: 'Name',
      field: 'theUpperHouse.name',
      input: 'string',
      localised: true,
      required: true,
    },
    {
      label: 'Image',
      field: 'theUpperHouse.image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 522 × 400',
        accept: '.png,.svg',
        limit: 5 * 1024 * 1024, // 5 MB
        maxCount: 1,
      },
      localised: false,
      required: false,
    },
    {
      label: 'Pages',
      field: 'theUpperHouse.pages',
      input: 'paragraph',
      options: {
        types: ['menu_pages', 'menu_pages_tabs', 'menu_special_pages'],
      },
      localised: false,
    },
    {
      label: 'Is Folder?',
      field: 'theUpperHouse.isFolder',
      input: 'checkbox',
      localised: false,
    },
    {
      label: 'Key',
      field: 'wirelessPlace.key',
      input: 'string',
      localised: false,
      required: true,
      readOnly: true,
    },
    {
      label: 'Tower',
      field: 'wirelessPlace.tower',
      input: 'select',
      source: 'tower_buildings',
      localised: false,
      required: true,
      readOnly: true,
    },
    {
      label: 'Name',
      field: 'wirelessPlace.name',
      input: 'string',
      localised: true,
      required: true,
    },
    {
      label: 'Image',
      field: 'wirelessPlace.image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 522 × 400',
        accept: '.png,.svg',
        limit: 5 * 1024 * 1024, // 5 MB
        maxCount: 1,
      },
      localised: false,
      required: false,
    },
    {
      label: 'Pages',
      field: 'wirelessPlace.pages',
      input: 'paragraph',
      options: {
        types: ['menu_pages', 'menu_pages_tabs', 'menu_special_pages'],
      },
      localised: false,
    },
    {
      label: 'Is Folder?',
      field: 'wirelessPlace.isFolder',
      input: 'checkbox',
      localised: false,
    },
    {
      label: 'Key',
      field: 'compareUnits.key',
      input: 'string',
      localised: false,
      required: true,
      readOnly: true,
    },
    {
      label: 'Name',
      field: 'compareUnits.name',
      input: 'string',
      localised: true,
      required: true,
    },
    {
      label: 'Image',
      field: 'compareUnits.image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 522 × 400',
        accept: '.png,.svg',
        limit: 5 * 1024 * 1024, // 5 MB
        maxCount: 1,
      },
      localised: false,
      required: false,
    },
    {
      label: 'Pages',
      field: 'compareUnits.pages',
      input: 'paragraph',
      options: {
        types: ['menu_special_pages'],
        maxCount: 1,
      },
      localised: false,
    },
    {
      label: 'Key',
      field: 'team.key',
      input: 'string',
      localised: false,
      required: true,
      readOnly: true,
    },
    {
      label: 'Name',
      field: 'team.name',
      input: 'string',
      localised: true,
      required: true,
    },
    {
      label: 'Image',
      field: 'team.image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 522 × 400',
        accept: '.png,.svg',
        limit: 5 * 1024 * 1024, // 5 MB
        maxCount: 1,
      },
      localised: false,
      required: false,
    },
    {
      label: 'Pages',
      field: 'team.pages',
      input: 'paragraph',
      options: {
        types: ['menu_pages', 'menu_pages_tabs'],
      },
      localised: false,
    },
    {
      label: 'Is Folder?',
      field: 'team.isFolder',
      input: 'checkbox',
      localised: false,
    },
    {
      label: 'Key',
      field: 'film.key',
      input: 'string',
      localised: false,
      required: true,
      readOnly: true,
    },
    {
      label: 'Name',
      field: 'film.name',
      input: 'string',
      localised: true,
      required: true,
    },
    {
      label: 'Image',
      field: 'film.image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 522 × 400',
        accept: '.png,.svg',
        limit: 5 * 1024 * 1024, // 5 MB
        maxCount: 1,
      },
      localised: false,
      required: false,
    },
    {
      label: 'Pages',
      field: 'film.pages',
      input: 'paragraph',
      options: {
        types: ['menu_pages', 'menu_pages_tabs'],
      },
      localised: false,
    },
    {
      label: 'Is Folder?',
      field: 'film.isFolder',
      input: 'checkbox',
      localised: false,
    },
    {
      label: 'Key',
      field: 'faq.key',
      input: 'string',
      localised: false,
      required: true,
      readOnly: true,
    },
    {
      label: 'Name',
      field: 'faq.name',
      input: 'string',
      localised: true,
      required: true,
    },
    {
      label: 'Image',
      field: 'faq.image',
      input: 'image',
      options: {
        hint: 'Recommended canvas size: 522 × 400',
        accept: '.png,.svg',
        limit: 5 * 1024 * 1024, // 5 MB
        maxCount: 1,
      },
      localised: false,
      required: false,
    },
    {
      label: 'Pages',
      field: 'faq.pages',
      input: 'paragraph',
      options: {
        types: ['menu_pages', 'menu_pages_tabs'],
      },
      localised: false,
    },
    {
      label: 'Is Folder?',
      field: 'faq.isFolder',
      input: 'checkbox',
      localised: false,
    },
    {
      label: 'Key',
      field: 'dashboard.key',
      input: 'string',
      localised: false,
      required: true,
      readOnly: true,
    },
    {
      label: 'Name',
      field: 'dashboard.name',
      input: 'string',
      localised: true,
      required: true,
    },
    // {
    //   label: 'Image',
    //   field: 'dashboard.image',
    //   input: 'image',
    //   options: {
    //     hint: 'Recommended canvas size: 522 × 400',
    //     accept: '.png,.svg',
    //     limit: 5 * 1024 * 1024, // 5 MB
    //     maxCount: 1
    //   },
    //   localised: false,
    //   required: false
    // },
    {
      label: 'Pages',
      field: 'dashboard.pages',
      input: 'paragraph',
      options: {
        types: ['menu_special_pages'],
      },
      localised: false,
    },
    {
      label: 'Key',
      field: 'calendar.key',
      input: 'string',
      localised: false,
      required: true,
      readOnly: true,
    },
    {
      label: 'Name',
      field: 'calendar.name',
      input: 'string',
      localised: true,
      required: true,
    },
    // {
    //   label: 'Image',
    //   field: 'calendar.image',
    //   input: 'image',
    //   options: {
    //     hint: 'Recommended canvas size: 522 × 400',
    //     accept: '.png,.svg',
    //     limit: 5 * 1024 * 1024, // 5 MB
    //     maxCount: 1
    //   },
    //   localised: false,
    //   required: false
    // },
    {
      label: 'Pages',
      field: 'calendar.pages',
      input: 'paragraph',
      options: {
        types: ['menu_special_pages'],
      },
      localised: false,
    },
    {
      label: 'Key',
      field: 'settings.key',
      input: 'string',
      localised: false,
      required: true,
      readOnly: true,
    },
    {
      label: 'Name',
      field: 'settings.name',
      input: 'string',
      localised: true,
      required: true,
    },
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal',
  maxCount: 1,
}
