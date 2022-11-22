## Import

#### Using cms-import command to import gsheet data to cms

1.  share your gsheet to user view-edit-spreadsheets@sinuous-voice-178902.iam.gserviceaccount.com

1.  create config json file like that, e.g. local.json
```
{
  "host": "localhost:8351",
  "prefix": "/cms",
  "oauth": {
    "email":"view-edit-spreadsheets@sinuous-voice-178902.iam.gserviceaccount.com",
    "keyFile":"view-edit-spreadsheets.pem"
  },
  "gsheetId": "1FowHlz2rjiB0cioQ67AEgAwmneNzJFNbkzFBXaqXRk0",
  "resources": [
    "users",
    "favoriteColors",
    "musicStyles",
    "hobbies",
    "models",
    "trims",
    "paints",
    "dealerships",
    "locations",
    "xpkit__users",
    "translations"
  ]
}
```

1.  copy pem key (view-edit-spreadsheets.pem) to your folder

1.  install cms-import command
```
    $ npm install -g git+https://github.com/XPKit/node-cms.git
```

1.  run cms-import command to import gsheet data to cms
```
    $ cms-import ./local.json <username>:<password> -y
```
