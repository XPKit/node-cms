import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// How a record is named in every list and picker in the admin: the first field of its schema,
// unless the resource carries a displayItem template, in which case that wins. ResourceService is
// mocked because a select field resolves its value against another resource's records.
// `_id` last, data fields first, which is the order a stored record actually has - it matters,
// because the label for a related record with no customLabel is `keys().first()` of that record.
const resources = {
  cities: [{ name: { enUS: 'Shanghai' }, country: 'k1', _id: 'c1' }],
  countries: [{ title: 'China', _id: 'k1' }]
}
vi.mock('@s/ResourceService', () => ({ default: { get: vi.fn(name => resources[name]) } }))

const { default: RecordNameHelper } = await import('@c/RecordNameHelper')

const host = (resource, locale = 'enUS') =>
  mount({ mixins: [RecordNameHelper], props: ['resource', 'locale'], template: '<div />' }, { props: { resource, locale } }).vm

describe('RecordNameHelper', () => {
  describe('getName', () => {
    it('names a record by the first field of its schema', () => {
      const vm = host({ locales: ['enUS'], schema: [{ field: 'title' }] })
      expect(vm.getName({ _id: 'a1', title: { enUS: 'A title' } })).to.equal('A title')
    })

    it('falls back to the id when the first field holds nothing readable', () => {
      const vm = host({ locales: ['enUS'], schema: [{ field: 'title' }] })
      expect(vm.getName({ _id: 'a1' })).to.equal('a1')
      expect(vm.getName({ _id: 'a1', title: { enUS: { nested: true } } })).to.equal('a1')
    })

    it('falls back to false when there is not even an id', () => {
      expect(host({ schema: [{ field: 'title' }] }).getName({})).to.equal(false)
    })
  })

  describe('getValue', () => {
    it('reads a plain field on a resource with no locales', () => {
      const vm = host({ schema: [{ field: 'title' }] })
      expect(vm.getValue({ title: 'Plain' }, { field: 'title' })).to.equal('Plain')
    })

    it('reads the current locale on a localised resource, and the field itself when opted out', () => {
      const vm = host({ locales: ['enUS', 'zhCN'], schema: [] }, 'zhCN')
      expect(vm.getValue({ title: { zhCN: '标题' } }, { field: 'title' })).to.equal('标题')
      expect(vm.getValue({ title: 'Plain' }, { field: 'title', localised: false })).to.equal('Plain')
    })

    it('names a file field by its attachment filename', () => {
      const vm = host({ schema: [] })
      const item = { _attachments: [{ _name: 'photo', _filename: 'shot.jpg' }, { _name: 'other', _filename: 'no.jpg' }] }
      expect(vm.getValue(item, { field: 'photo', input: 'file' })).to.equal('shot.jpg')
    })

    it('resolves a select field against the resource it points at, and takes that record first field', () => {
      const vm = host({ schema: [] })
      const field = { field: 'country', input: 'select', source: 'countries' }
      expect(vm.getValue({ country: 'k1' }, field)).to.equal('China')
    })

    // The first field of a *localised* related record is the whole locale map, not a string, so
    // the label comes back as an object - and getName, which insists on a string, then falls back
    // to the id. A localised source needs a customLabel or a displayItem to read properly.
    it('hands back a locale map when the related record first field is localised', () => {
      const vm = host({ schema: [{ field: 'city', input: 'select', source: 'cities' }] })
      expect(vm.getValue({ city: 'c1' }, { field: 'city', input: 'select', source: 'cities' })).to.deep.equal({ enUS: 'Shanghai' })
      expect(vm.getName({ city: 'c1', _id: 'a1' })).to.equal('a1')
    })

    it('renders a custom label for a select field through mustache', () => {
      const vm = host({ schema: [] })
      const field = { field: 'city', input: 'select', source: 'cities', options: { customLabel: '{{name.enUS}}' } }
      expect(vm.getValue({ city: 'c1' }, field)).to.equal('Shanghai')
    })

    it('keeps an inline select value as it is', () => {
      const vm = host({ schema: [] })
      expect(vm.getValue({ kind: 'idle' }, { field: 'kind', input: 'select', source: ['idle', 'busy'] })).to.equal('idle')
    })
  })

  describe('a resource with a displayItem template', () => {
    it('renders the template instead of the first field', () => {
      const vm = host({ locales: ['enUS'], schema: [{ field: 'name' }], displayItem: '{{name.enUS}} ({{_id}})' })
      expect(vm.getName({ _id: 'c1', name: { enUS: 'Shanghai' } })).to.equal('Shanghai (c1)')
    })

    it('resolves an extra source before rendering, so a related record can be named in the template', () => {
      const resource = {
        schema: [{ field: 'name' }],
        displayItem: '{{name}} — {{country.title}}',
        extraSources: { country: 'countries' }
      }
      expect(host(resource).getName({ name: 'Shanghai', country: 'k1' })).to.equal('Shanghai — China')
    })

    it('leaves the field alone when the extra source has no such record', () => {
      const resource = { schema: [{ field: 'name' }], displayItem: '{{country}}', extraSources: { country: 'countries' } }
      expect(host(resource).getName({ name: 'x', country: 'missing' })).to.equal('missing')
    })
  })

  describe('getExtraResources', () => {
    it('merges the resource level sources with those of its first field', () => {
      const resource = { extraSources: { country: 'countries' }, schema: [{ field: 'name', options: { extraSources: { city: 'cities' } } }] }
      expect(host(resource).getExtraResources()).to.deep.equal({ country: 'countries', city: 'cities' })
    })

    it('is an empty map when the resource declares none', () => {
      expect(host({ schema: [{ field: 'name' }] }).getExtraResources()).to.deep.equal({})
    })
  })
})
