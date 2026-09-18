import { beforeEach, describe, expect, it, vi } from 'vitest'

// SchemaService turns a resource's stored schema into the field descriptors the form renders. It
// reaches for ResourceService to resolve a field whose `source` names another resource, so that is
// mocked; TranslateService returns its key so an assertion can name the message id.
vi.mock('@s/TranslateService', () => ({ default: { get: key => key } }))

const cities = [{ _id: 'c1', name: { enUS: 'Shanghai' } }, { _id: 'c2', name: { enUS: 'Berlin' } }]
vi.mock('@s/ResourceService', () => ({
  default: {
    schemas: [{ name: 'articles' }, { name: 'cities' }],
    get: vi.fn(() => cities),
    getSchema: vi.fn(() => ({ locales: ['enUS'], schema: [{ field: 'name' }] }))
  }
}))

const { default: SchemaService } = await import('@s/SchemaService')

const resource = (extra = {}) => ({ name: 'articles', locales: ['enUS', 'zhCN'], ...extra })
const build = (schema, res = resource(), locale = 'enUS') =>
  SchemaService.getSchemaFields(schema, res, locale, 'enUS', false, {}, false)

describe('SchemaService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getSchemaFields', () => {
    it('carries the type mapper entry for the input onto the field', () => {
      const [field] = build([{ field: 'published', input: 'date' }])
      expect(field.type).to.equal('CustomDatetimePicker')
      expect(field.format).to.equal('YYYY-MM-DD')
    })

    it('suffixes the model with the locale for a localised field, and labels it with the locale', () => {
      const [field] = build([{ field: 'title', input: 'string' }])
      expect(field.model).to.equal('title.enUS')
      expect(field.originalModel).to.equal('title')
      expect(field.label).to.equal('title (TL_ENUS)')
      expect(field.localised).to.equal(true)
    })

    it('leaves the model alone when the field opts out of localisation', () => {
      const [field] = build([{ field: 'slug', input: 'string', localised: false }])
      expect(field.model).to.equal('slug')
      expect(field.label).to.equal('slug')
      expect(field.localised).to.equal(false)
    })

    it('leaves the model alone when the resource has no locales at all', () => {
      const [field] = build([{ field: 'title', input: 'string' }], resource({ locales: null }))
      expect(field.model).to.equal('title')
    })

    it('prefers the field label over its name, through the translator', () => {
      const [field] = build([{ field: 'title', input: 'string', label: 'TL_TITLE', localised: false }])
      expect(field.label).to.equal('TL_TITLE')
    })

    it('copies every key of options onto the field, which is how a schema overrides a default', () => {
      const [field] = build([{ field: 'published', input: 'date', options: { format: 'DD/MM/YYYY', readonly: true } }])
      expect(field.format).to.equal('DD/MM/YYYY')
      expect(field.readonly).to.equal(true)
    })

    it('marks a required field and passes disabled through', () => {
      const [field] = build([{ field: 'title', input: 'string', required: true }])
      expect(field.required).to.equal(true)
      expect(field.disabled).to.equal(false)
    })

    it('turns an inline source list into the field values', () => {
      const [field] = build([{ field: 'kind', input: 'select', source: ['a', 'b'] }])
      expect(field.values).to.deep.equal(['a', 'b'])
    })

    it('resolves a source naming another resource into that resource records', () => {
      const [field] = build([{ field: 'city', input: 'multiselect', source: 'cities' }])
      expect(field.values).to.deep.equal(cities)
      expect(field.source).to.equal('cities')
      expect(field.selectOptions.key).to.equal('_id')
    })

    it('labels a related record with the first field of its schema, in the current locale', () => {
      const [field] = build([{ field: 'city', input: 'multiselect', source: 'cities' }])
      expect(field.selectOptions.customLabel('c1')).to.equal('Shanghai')
    })

    it('gives a select its multiselect chrome from the translator', () => {
      const [field] = build([{ field: 'kind', input: 'select', source: ['a'] }])
      expect(field.selectOptions.selectLabel).to.equal('TL_MULTISELECT_SELECT_LABEL')
    })

    it('carries a pillbox min and max into its select options', () => {
      const [field] = build([{ field: 'tags', input: 'pillbox', min: 1, max: 3 }])
      expect([field.selectOptions.min, field.selectOptions.max]).to.deep.equal([1, 3])
    })

    it('offers the resource names as values for a group permission field', () => {
      const [field] = build([{ field: 'create', input: 'multiselect' }], resource({ name: '_groups', locales: null }))
      expect(field.values).to.deep.equal(['articles', 'cities'])
    })
  })

  describe('getNestedGroups', () => {
    const fields = [
      { originalModel: 'meta.author', model: 'meta.author' },
      { originalModel: 'meta.tags', model: 'meta.tags' },
      { originalModel: 'title', model: 'title' }
    ]

    it('returns a lone field as itself and folds siblings into a group', () => {
      const groups = SchemaService.getNestedGroups(resource(), fields, 0)
      const title = groups.find(g => g.originalModel === 'title')
      const meta = groups.find(g => g.key === 'meta')
      expect(title.model).to.equal('title')
      expect(meta.groupOptions.fields.map(f => f.originalModel)).to.deep.equal(['meta.author', 'meta.tags'])
    })

    it('labels a group from the resource groups map when it names one', () => {
      const res = resource({ groups: { meta: { label: 'TL_METADATA' } } })
      const groups = SchemaService.getNestedGroups(res, fields, 0)
      expect(groups.find(g => g.key === 'meta').label).to.equal('TL_METADATA')
    })
  })
})
