exports = module.exports = {
  displayname: 'Case Studies',
  group: 'Content',
  schema: [
    {
      label: 'Name',
      field: 'name',
      input: 'string',
      localised: false,
      required: true
    },
    {
      label: 'Unique Key',
      field: 'key',
      input: 'transliterate',
      options: {
        valueFrom: 'name',
        readonly: false
      },
      localised: false,
      unique: true,
      required: true
    },
    {
      label: 'Thumbnail',
      field: 'thumbnail',
      input: 'image',
      options: {
        hint: 'Recommended image size: 16:9',
        accept: '.jpg,.png',
        maxCount: 1
      },
      required: true
    },
    {
      label: 'Tags',
      field: 'tags',
      input: 'pillbox',
      required: true
    },
    {
      label: 'Content',
      field: 'content',
      input: 'wysiwyg',
      options: {
        buttons: ['bold', 'italic']
        //buttons: ['bold', 'italic', 'paragraph', 'bullet-list', 'ordered-list', 'heading-2', 'heading-3', 'undo', 'redo'],
      },
      required: true
    },
    {
      label: 'Gallery',
      field: 'gallery',
      input: 'paragraph',
      options: {
        types: [
          'imageGallery',
          'videoGallery',
        ],
        mapping: {
          default: 'imageGallery',
          'jpg,jpeg,gif,png': {
            _type: 'imageGallery',
            field: 'image'
          },
          'mp4,mkv,avi': {
            _type: 'videoGallery',
            field: 'video'
          }
        },
        dynamicLayout: true
      },
      localised: false
    }
  ],
  type: 'normal',
}
