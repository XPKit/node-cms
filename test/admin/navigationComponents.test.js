import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Three of the smaller components around the edges of the admin: the resource list down the side,
// the locale toggle in the top bar, and the hints shown under a file field.
// The mock deliberately does not return the key unchanged. With a passthrough, an assertion that a
// title equals 'TL_ARTICLES' passes whether the component asked the translator or simply handed
// back the key it was given - so the marker is what proves the translation actually happened.
vi.mock('@s/TranslateService', () => ({
  default: { get: (key, params) => (params ? `translated(${key}):${JSON.stringify(params)}` : `translated(${key})`), locale: 'enUS' }
}))

const { default: ResourceList } = await import('@c/ResourceList.vue')
const { default: TopBarLocaleList } = await import('@c/TopBarLocaleList.vue')
const { default: FileInputErrors } = await import('@c/FileInputErrors.vue')

const mountIt = (component, props = {}) =>
  mount(component, { props, shallow: true, global: { mocks: { $filters: { translate: key => key } } } })

describe('ResourceList', () => {
  const list = (props = {}) => mountIt(ResourceList, { groupedList: [], selectedItem: {}, ...props }).vm

  it('titles a resource by its display name when it has one, translated', () => {
    expect(list().getResourceTitle({ displayname: 'TL_ARTICLES', title: 'articles' })).to.equal('translated(TL_ARTICLES)')
    // A resource with no display name keeps its raw title, untranslated - which is the other half
    // of the claim, and only distinguishable because the mock marks what it touched.
    expect(list().getResourceTitle({ title: 'articles' })).to.equal('articles')
  })

  // Identity, not equality - and the comparison has to go through the component's own prop,
  // because Vue hands it a reactive proxy rather than the object the test created.
  it('knows which resource is selected by identity', () => {
    const vm = list({ selectedItem: { title: 'articles' } })
    expect(vm.isSelected(vm.selectedItem)).to.equal(true)
    expect(vm.isSelected({ title: 'articles' })).to.equal(false)
  })

  it('matches a plugin by its component instead, since it is rebuilt rather than kept', () => {
    const selectedItem = { type: 'plugin', pluginComponent: 'SyncResource' }
    expect(list({ selectedItem }).isSelected({ type: 'plugin', pluginComponent: 'SyncResource' })).to.equal(true)
    expect(list({ selectedItem }).isSelected({ type: 'plugin', pluginComponent: 'Other' })).to.equal(false)
  })

  it('sorts without minding case, and numerically rather than by digit', () => {
    const sorted = list().orderedList([{ title: 'item10' }, { title: 'Item2' }, { title: 'apple' }])
    expect(sorted.map(item => item.title)).to.deep.equal(['apple', 'Item2', 'item10'])
  })

  // The pair matters: leading punctuation sorts *before* letters when it is counted, so
  // '-zebra' would come first. Only a title whose position moves proves `ignorePunctuation`.
  it('ignores punctuation, so a leading dash does not jump the queue', () => {
    const sorted = list().orderedList([{ title: '-zebra' }, { title: 'apple' }])
    expect(sorted.map(item => item.title)).to.deep.equal(['apple', '-zebra'])
  })

  // Worth pinning rather than filing: Array.sort is in place, so the caller's array is reordered
  // as a side effect of asking for a sorted copy.
  it('sorts the array it was handed rather than a copy of it', () => {
    const original = [{ title: 'b' }, { title: 'a' }]
    list().orderedList(original)
    expect(original.map(item => item.title)).to.deep.equal(['a', 'b'])
  })

  describe('which group is open', () => {
    it('opens the group the selected resource belongs to', () => {
      const vm = list({ selectedItem: { group: 'Content' } })
      expect(vm.groupSelected({ name: 'Content' })).to.equal(true)
      expect(vm.groupSelected({ name: 'Settings' })).to.equal(false)
    })

    it('reads a localised group name on either side', () => {
      const vm = list({ selectedItem: { group: { enUS: 'Content' } } })
      expect(vm.groupSelected({ name: { enUS: 'Content' } })).to.equal(true)
    })

    it('puts a resource with no group under the others heading', () => {
      const vm = list({ selectedItem: { title: 'ungrouped' } })
      expect(vm.groupSelected({ name: 'TL_OTHERS' })).to.equal(true)
      expect(vm.groupSelected({ name: 'Content' })).to.equal(false)
    })
  })
})

describe('TopBarLocaleList', () => {
  it('names a locale through the translator, upper-cased', () => {
    expect(mountIt(TopBarLocaleList).vm.getLocaleTranslation('enUS')).to.equal('translated(TL_ENUS)')
  })

  it('toggles to the first locale that is not the current one', () => {
    const selectLocale = vi.fn()
    const vm = mountIt(TopBarLocaleList, { locales: ['enUS', 'zhCN'], locale: 'enUS', selectLocale }).vm
    vm.toggleLocale()
    expect(selectLocale).toHaveBeenCalledWith('zhCN')
  })

  it('toggles to nothing when there is only the one locale', () => {
    const selectLocale = vi.fn()
    mountIt(TopBarLocaleList, { locales: ['enUS'], locale: 'enUS', selectLocale }).vm.toggleLocale()
    expect(selectLocale).toHaveBeenCalledWith(undefined)
  })
})

describe('FileInputErrors', () => {
  const errors = (props = {}) => mountIt(FileInputErrors, { schema: {}, ...props }).vm

  it('reports a size limit in kilobytes, and in megabytes past a thousand of them', () => {
    expect(errors().getFileSizeLimit(512 * 1024)).to.equal('512 KB')
    // 2 MiB is 2048 KB, and the megabyte step divides by 1000 rather than 1024, so it reads 2.048.
    expect(errors().getFileSizeLimit(2 * 1024 * 1024)).to.equal('2.048 MB')
  })

  // Pinned rather than filed: the conversion divides by 1024 and then by 1000, and does not round,
  // so a limit that is not a neat multiple is shown to the user in full.
  it('shows the full fraction for a limit that does not divide neatly', () => {
    expect(errors().getFileSizeLimit(1500000)).to.equal('1.46484375 MB')
  })

  it('knows when the field has been given both a width and a height', () => {
    expect(errors({ schema: { options: { width: 100, height: 50 } } }).hasSizeOptions).to.equal(50)
    expect(errors({ schema: { options: { width: 100 } } }).hasSizeOptions).to.equal(false)
  })

  it('names the count messages after the kind of file it is showing', () => {
    const vm = errors({ fileType: 'image', getMaxCount: () => 3 })
    expect(vm.maxCountMsg).to.equal('translated(TL_MAX_NUMBER_OF_IMAGES):{"num":3}')
    expect(vm.unlimitedMsg).to.equal('translated(TL_UNLIMITED_NUMBER_OF_IMAGES)')
  })
})
