module.exports = {
  displayname: {
    enUS: 'OSS Images'
  },
  schema: [
    {
      label: 'Key',
      field: 'key',
      localised: false,
      unique: true,
      required: true,
      input: 'string',
      options: {
        hint: 'A unique key to identify this image configuration.'
      }
    },
    {
      label: 'OSS Image',
      field: 'ossImage',
      localised: false,
      required: false,
      options: {
        maxCount: 1,
        method: 'oss',
        oss: {
          accessKeyId: 'LTAId5YUNDTCHgwx',
          path: 'node-cms/oss-files/%{resource}/%{_id}/',
          filename:"file-prefix-%{filename}"
        }
      },
      input: 'image'
    },
    {
      label: 'Image',
      field: 'image',
      localised: false,
      required: false,
      options: {
        maxCount: 1,
      },
      input: 'image'
    }
  ],
  type: 'normal',
}
