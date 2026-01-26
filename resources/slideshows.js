module.exports = {
  group: '2. Content',
  displayname: '2.3. Slideshows',
  groups: {
    kiosk: {
      label: 'Kiosk',
    },
  },
  schema: [
    {
      unique: true,
      label: 'Unique Id',
      field: 'id',
      input: 'string',
      localised: false,
      required: true,
    },
    {
      label: 'Title',
      field: 'title',
      input: 'string',
      localised: true,
      required: false,
    },
    {
      label: 'Is Title Displayed on Kiosk?',
      field: 'kiosk.isTitleDisplayed',
      input: 'checkbox',
      localised: false,
      required: false,
    },
    {
      label: 'Logo',
      field: 'kiosk.logo',
      input: 'select',
      source: ['no-logo', 'upper-house-residences', 'upper-house-residences-bangkok', 'the-wireless-residences'],
      localised: false,
      required: true,
    },
    {
      label: 'Color',
      field: 'kiosk.color',
      input: 'select',
      source: ['white', 'black'],
      localised: false,
      required: true,
    },
    {
      label: 'Slideshow',
      field: 'slideshow',
      input: 'paragraph',
      options: {
        types: ['slideshows_image', 'slideshows_image_with_text', 'slideshows_video'],
      },
      localised: false,
      required: false,
    },
  ],
  locales: ['enUS', 'zhCN'],
  type: 'normal',
}
