exports = (module.exports = {
  displayname: 'Others examples', // Optional, by default filename
  group: 'specials',
  schema: [
    {
      field: 'defaultColor',
      input: 'color',
      options: {
      }
    },
    {
      field: 'color',
      input: 'color',
      options: {
        picker: 'wheel',
        outputModel: 'hex',
        menuPosition: 'right',
        draggable: true,
        enableAlpha: true,
        rgbSliders: true
      }
    },
    {
      field: 'gColor',
      input: 'color',
      localised: false,
      options: {
        picker: 'square',
        outputModel: 'rgb',
        menuPosition: 'bottom',
        draggable: false,
        enableAlpha: false,
        rgbSliders: false
      }
    },
    {
      field: 'cropimage',
      input: 'image',
      options: {
        width: '800',
        height: '300',
        background: 'transparent',
        accept: 'image/jpeg',
        quality: 0.5,
        limit: 300 * 1024 // 100KB
      }
    },
    {
      field: 'gcropimage',
      input: 'image',
      localised: false,
      options: {
        width: '400',
        height: '200',
        background: 'transparent'
      }
    },
    {
      field: 'cropimage2',
      input: 'image',
      options: {
        width: '200',
        height: '300'
      }
    },
    {
      field: 'gfile',
      input: 'file',
      localised: false
    },
    {
      field: 'checkboxopt',
      input: 'checkbox',
      options: {
        textOn: 'Enable',
        textOff: 'Disable'
      }
    },
    {
      field: 'checkbox',
      input: 'checkbox'
    },
    {
      field: 'disabledCheckbox',
      input: 'checkbox',
      options: {
        disabled: true
      }
    },
    {
      field: 'gcheckbox',
      input: 'checkbox',
      localised: false
    },
    {
      field: 'image',
      input: 'image'
    },
    {
      field: 'gimage',
      input: 'image',
      localised: false,
      options: {
        maxCount: 1
      }
    },
    {
      field: 'file',
      input: 'file',
      required: true,
      options: {
        accept: 'image/*'
      }

    },
    {
      field: 'file2',
      input: 'file',
      options: {
        maxCount: 1
      }
    }
  ],
  locales: [
    'enUS',
    'zhCN'
  ],
  type: 'normal'
})
