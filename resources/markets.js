exports = (module.exports = {
  displayname: {
    enUS: 'Markets'
  },
  group: {
    enUS: 'Configurations'
  },
  schema: [
    {
      field: 'key',
      input: 'string',
      required: true,
      unique: true
    },
    {
      label: 'Country Code',
      field: 'code',
      input: 'string',
      required: true
    },
    {
      label: 'Name',
      field: 'name',
      input: 'string',
      required: true
    },
    {
      label: 'Splash Screens',
      field: 'splashScreens',
      input: 'multiselect',
      source: [
        'ecosport',
        'everest',
        'f150',
        'focus',
        'mondeo',
        'mustang',
        'ranger',
        'xr6',
        'zaf_ecosport',
        'zaf_transit',
        'zaf_ranger',
        'zaf_kuga',
        'zaf_mustang',
        'zaf_fiesta',
        'zaf_figo',
        'aus_nextgeneverest',
        'aus_nextgenranger',
        'phl_nextgeneverest',
        'phl_nextgenranger',
        'mys_nextgeneverest',
        'mys_nextgenranger',
        'tha_nextgeneverest',
        'tha_nextgenranger',
        'vnm_nextgenranger',
        'vnm_nextgeneverest',
        'me_bronco',
        'me_f150',
        'me_f150a',
        'me_raptor'
      ],
      required: true
    },
    {
      label: 'Brands',
      field: 'brands',
      input: 'multiselect',
      source: [
        'ford',
        'lincoln'
      ],
      required: true
    },
    {
      label: 'Permissions Rules',
      field: 'permissionsRules',
      input: 'select',
      source: ['dealership', 'salesConsultant'],
      required: true
    },
    {
      field: 'optOut.complete',
      input: 'checkbox'
    },
    {
      field: 'optOut.email',
      input: 'checkbox'
    },
    {
      field: 'optOut.directMail',
      input: 'checkbox'
    },
    {
      field: 'optOut.SMS',
      input: 'checkbox'
    },
    {
      field: 'optOut.mobile',
      input: 'checkbox'
    },
    {
      field: 'optOut.phone',
      input: 'checkbox'
    },
    {
      field: 'optOut.survey',
      input: 'checkbox'
    },
    {
      label: 'Display optOut',
      field: 'modules.optOut',
      input: 'checkbox'
    },
    {
      label: 'Display optIn on user form',
      field: 'modules.optInGuestOptions',
      input: 'checkbox'
    },
    {
      label: 'Display Guest OptOut',
      field: 'modules.optOutGuestOptions',
      input: 'multiselect',
      source: [
        'complete',
        'email',
        'directMail',
        'SMS',
        'mobile',
        'phone',
        'survey'
      ]
    },
    {
      label: 'Developer Mode',
      field: 'modules.developerMode',
      input: 'checkbox'
    },
    {
      label: 'FPS Meter',
      field: 'modules.fpsMeter',
      input: 'checkbox'
    },
    {
      label: 'File Explorer',
      field: 'modules.fileExplorer',
      input: 'checkbox'
    },
    {
      label: 'Price Display',
      field: 'modules.priceDisplay',
      input: 'select',
      source: [
        'none',
        'vdm',
        'driveaway_polk'
      ]
    },
    {
      label: 'Postal Code',
      field: 'modules.postalCode',
      input: 'checkbox'
    },
    {
      label: 'Guest Mode',
      field: 'modules.guestMode',
      input: 'checkbox'
    },
    {
      label: 'Guest Mode Duration (seconds)',
      field: 'modules.guestModeDuration',
      input: 'integer'
    },
    {
      label: 'Guest Mode Password retry count',
      field: 'modules.guestModeRetryCount',
      input: 'integer'
    },
    {
      label: 'Update lead vehicle configuration on crmId retrieval',
      field: 'modules.crmId.retreive',
      input: 'checkbox'
    },
    {
      label: 'Enforce crmId on lead create/update',
      field: 'modules.crmdId.push',
      input: 'checkbox'
    },
    {
      label: 'Display warning message when crmId is empty',
      field: 'modules.crmdId.displayWarning',
      input: 'checkbox'
    },
    {
      label: 'CCT',
      field: 'modules.cct',
      input: 'checkbox'
    },
    {
      label: 'Compare Packages - Method',
      field: 'modules.comparePackagesMethod',
      input: 'select',
      source: [
        'byContent',
        'byId'
      ],
      required: true
    },
    {
      label: 'Trade-In',
      field: 'modules.tradeIn',
      input: 'checkbox'
    },
    {
      label: 'Finance Estimator',
      field: 'modules.financeEstimator',
      input: 'checkbox'
    },
    {
      label: 'Smart Drive',
      field: 'modules.smartDrive',
      input: 'checkbox'
    },
    {
      label: 'Smart Drive Audio',
      field: 'modules.smartDriveAudio',
      input: 'checkbox'
    },
    {
      label: 'Smart Drive Audio - Settings',
      field: 'modules.sdaSettings',
      input: 'checkbox'
    },
    {
      label: 'Smart Drive - Guest Form',
      field: 'modules.sdaGuest',
      input: 'checkbox'
    },
    {
      label: 'Smart Drive - Family and Friends Form',
      field: 'modules.sdaFamilyAndFriends',
      input: 'checkbox'
    },
    {
      label: 'Smart Drive - Dealership Employee Form',
      field: 'modules.sdaDealershipEmployee',
      input: 'checkbox'
    },
    {
      label: 'Smart Drive - Completed In Person Form',
      field: 'modules.sdaCompletedInPerson',
      input: 'checkbox'
    },
    {
      label: 'Inventory',
      field: 'modules.inventory',
      input: 'checkbox'
    },
    {
      label: 'Help Me Choose',
      field: 'modules.helpMeChoose',
      input: 'checkbox'
    },
    {
      label: 'DDH',
      field: 'modules.ddh',
      input: 'checkbox'
    },
    {
      label: 'Offers',
      field: 'modules.offers',
      input: 'checkbox'
    },
    {
      label: 'Language Switcher',
      field: 'modules.languageSwitcher',
      input: 'checkbox'
    },
    {
      label: 'Ford Protect',
      field: 'modules.fordProtect',
      input: 'checkbox'
    },
    {
      label: 'PDC',
      field: 'modules.pdc',
      input: 'checkbox'
    },
    {
      label: 'External PDC',
      field: 'modules.externalPDC',
      input: 'checkbox'
    },
    {
      label: 'External PDC URL',
      field: 'modules.externalPDCUrl',
      input: 'url'
    },
    {
      label: 'Accessories',
      field: 'modules.accessories',
      input: 'checkbox'
    },
    {
      label: 'Dealership Fitted Accessories',
      field: 'modules.dfa',
      input: 'checkbox'
    },
    {
      label: 'Crm Storage',
      field: 'modules.crmStorage',
      input: 'checkbox'
    },
    {
      label: 'Sync To Sap Crm',
      field: 'syncSapCrm.enabled',
      input: 'checkbox'
    },
    {
      label: 'Crm Storage TTL (hh:mm:ss)',
      field: 'syncSapCrm.ttl',
      input: 'string'
    },
    {
      label: 'Account ID',
      field: 'brightCove.accountId',
      input: 'string'
    },
    {
      label: 'Policy Key',
      field: 'brightCove.policyKey',
      input: 'string'
    },
    {
      label: 'Idea Box URL',
      field: 'ideaBoxUrl',
      input: 'string',
      localised: false
    },
    {
      label: 'Enable',
      field: 'disclaimer.first.enable',
      input: 'checkbox'
    },
    {
      label: 'Is OptIn',
      field: 'disclaimer.first.isOptIn',
      input: 'checkbox'
    },
    {
      label: 'Mandatory',
      field: 'disclaimer.first.mandatory',
      input: 'checkbox'
    },
    {
      label: 'Type',
      field: 'disclaimer.first.type',
      input: 'select',
      source: [
        'toggle',
        'enforced_to_read'
      ]
    },
    {
      label: 'Body',
      field: 'disclaimer.first.body',
      input: 'wysiwyg'
    },
    {
      label: 'Enable',
      field: 'disclaimer.second.enable',
      input: 'checkbox'
    },
    {
      label: 'Is OptIn',
      field: 'disclaimer.second.isOptIn',
      input: 'checkbox'
    },
    {
      label: 'Mandatory',
      field: 'disclaimer.second.mandatory',
      input: 'checkbox'
    },
    {
      label: 'Type',
      field: 'disclaimer.second.type',
      input: 'select',
      source: [
        'toggle',
        'enforced_to_read'
      ]
    },
    {
      label: 'Body',
      field: 'disclaimer.second.body',
      input: 'wysiwyg'
    },
    {
      label: 'Enable',
      field: 'disclaimer.third.enable',
      input: 'checkbox'
    },
    {
      label: 'Is OptIn',
      field: 'disclaimer.third.isOptIn',
      input: 'checkbox'
    },
    {
      label: 'Mandatory',
      field: 'disclaimer.third.mandatory',
      input: 'checkbox'
    },
    {
      label: 'Type',
      field: 'disclaimer.third.type',
      input: 'select',
      source: [
        'toggle',
        'enforced_to_read'
      ]
    },
    {
      label: 'Body',
      field: 'disclaimer.third.body',
      input: 'wysiwyg'
    },
    {
      label: 'Terms And Conditions',
      field: 'termsAndConditions',
      input: 'wysiwyg'
    },
    {
      label: 'Display Terms and Conditions on Guest Panel',
      field: 'termsAndConditionsOnGuestPanel',
      input: 'checkbox'
    },
    {
      label: 'Communication Log Types',
      field: 'communicationLogTypes',
      input: 'multiselect',
      source: [
        'email',
        'facebook_messenger',
        'facebook',
        'instagram',
        'kakaotalk',
        'line',
        'phone',
        'postal_mail',
        'telegram',
        'text_message',
        'viber',
        'wechat',
        'citnow',
        'whatsapp'
      ],
      required: true
    },
    {
      label: 'Fullname Template',
      field: 'locale.fullnameTemplate',
      input: 'select',
      source: [
        'firstName',
        'middleName',
        'lastName',
        'firstName_lastName',
        'lastName_firstName',
        'firstName_middleName_lastName',
        'lastName_middleName_firstName'
      ],
      required: true
    },
    {
      label: 'Name components spacing',
      field: 'locale.nameComponentsSpacing',
      input: 'select',
      source: [
        'with',
        'without'
      ],
      required: true
    },
    {
      label: 'Price Rounding',
      field: 'locale.priceRounding',
      input: 'integer',
      required: true
    },
    {
      label: 'Size',
      field: 'locale.postalCode.size',
      input: 'integer',
      required: true
    },
    {
      label: 'Rule',
      field: 'locale.postalCode.rule',
      input: 'select',
      source: [
        'digit',
        'any'
      ],
      required: true
    },
    {
      label: 'DSG - Date Format',
      field: 'locale.dateFormat',
      input: 'string',
      required: true
    },
    {
      label: 'Others - Date Format',
      field: 'locale.dateFormatWebStandard',
      input: 'string',
      required: true
    },
    {
      label: 'Time Format',
      field: 'locale.timeFormat',
      input: 'string',
      required: true
    },
    {
      label: 'Min of digits in a mobile phone number',
      field: 'locale.phoneRule.min',
      input: 'number',
      required: true
    },
    {
      label: 'Max of digits in a mobile phone number',
      field: 'locale.phoneRule.max',
      input: 'number',
      required: true
    },
    {
      label: 'Use Regex for mobile phone number',
      field: 'locale.phoneRule.useRegex',
      input: 'checkbox'
    },
    {
      label: 'Regex of digits in a mobile phone number',
      field: 'locale.phoneRule.regex',
      input: 'string'
    },
    {
      label: 'Calendar Type',
      field: 'locale.calendarType',
      input: 'select',
      source: [
        'gregorian',
        'iso8601',
        'buddhist',
        'chinese'
      ],
      required: true
    },
    {
      label: 'Key',
      field: 'locale.key',
      input: 'string',
      required: true
    },
    {
      label: 'Decimal',
      field: 'locale.number.separator.decimal',
      input: 'string',
      required: true
    },
    {
      label: 'Grouping',
      field: 'locale.number.separator.grouping',
      input: 'string',
      required: true
    },
    {
      label: 'Position',
      field: 'locale.currency.position',
      input: 'select',
      source: [
        'before',
        'after'
      ],
      required: true
    },
    {
      label: 'Decimal',
      field: 'locale.currency.separator.decimal',
      input: 'string',
      required: true
    },
    {
      label: 'Grouping',
      field: 'locale.currency.separator.grouping',
      input: 'string',
      required: true
    },
    {
      label: 'Number of digits after decimal',
      field: 'locale.currency.digitAfterDecimal',
      input: 'integer',
      required: true
    },
    {
      label: 'Symbol',
      field: 'locale.currency.symbol',
      input: 'string',
      required: true
    },
    {
      label: 'Symbol Space',
      field: 'locale.currency.symbolSpace',
      input: 'checkbox'
    },
    {
      label: 'Display External Service Button on PE',
      field: 'finance.externalService.status',
      input: 'checkbox'
    },
    {
      label: 'External Service URL',
      field: 'finance.externalService.url',
      input: 'string'
    },
    {
      label: 'Layout',
      field: 'finance.layout',
      input: 'select',
      source: ['loan-calculator-panel', 'loan-calculator-inline', 'quotation', 'quotation-polk'],
      required: true
    },
    {
      label: 'Downpayment Percentage',
      field: 'finance.downpaymentPercentage',
      input: 'number',
      required: true
    },
    {
      label: 'Rate',
      field: 'finance.rate',
      input: 'number',
      required: true
    },
    {
      label: 'VAT',
      field: 'finance.vat',
      input: 'number',
      required: true
    },
    {
      label: 'Default Terms',
      field: 'finance.defaultTerms',
      input: 'integer',
      required: true
    },
    {
      label: 'Minimum Terms',
      field: 'finance.minimumTerms',
      input: 'integer',
      required: true
    },
    {
      label: 'Maximum Terms',
      field: 'finance.maximumTerms',
      input: 'integer',
      required: true
    },
    {
      label: 'Availables Locales',
      field: 'availablesLocales',
      input: 'multiselect',
      source: ['en', 'zh', 'th', 'vi', 'ko', 'ar', 'kh'],
      required: true
    },
    {
      label: 'Default Locale',
      field: 'defaultLocale',
      input: 'select',
      source: ['en', 'zh', 'th', 'vi', 'ko', 'ar', 'kh'],
      required: true
    },
    {
      label: 'Vehicle Of Interest',
      field: 'vehicleOfInterest',
      input: 'select',
      source: ['vehicle_vdm_categories', 'vehicle_vdm_nameplates'],
      required: true
    },
    {
      label: 'Revision',
      field: 'revision',
      input: 'number',
      required: true,
      options: {
        // readonly: true,
        featured: false,
        disabled: true
      }
    },
    {
      label: 'Smart Drive Agreement Expired Duration (in days)',
      field: 'expiredDuration.smartDriveAgreements',
      input: 'number',
      localised: false
    },
    {
      label: 'Smart Drive Expired Duration (in days)',
      field: 'expiredDuration.token.smartDriveAgreements',
      input: 'number',
      localised: false
    },
    {
      label: 'Price Estimation Expired Duration (in days)',
      field: 'expiredDuration.token.priceEstimations',
      input: 'number',
      localised: false
    },
    {
      label: 'PDC Expired Duration (in days)',
      field: 'expiredDuration.token.personalizedDeliveryChecklists',
      input: 'number',
      localised: false
    },
    {
      label: 'Default VDMKey Nameplate on Showroom',
      field: 'defaultVdmKeyNameplate',
      input: 'string',
      localised: false
    },
    {
      label: 'Prefix',
      field: 'prefix',
      input: 'string',
      localised: false
    }
  ],
  type: 'normal'
})
