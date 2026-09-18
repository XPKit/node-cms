import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// The paragraph field, the largest component in the admin. These cover its pure decisions: what a
// paragraph is labelled and styled as, when it will take no more items, which file types it
// accepts, and the recursive id hunt that finds the attachments a removed paragraph owned.
vi.mock('@s/TranslateService', () => ({ default: { get: key => key, locale: 'enUS' } }))
vi.mock('@s/ResourceService', () => ({ default: { get: vi.fn(() => []), getParagraphSchema: vi.fn(), cache: vi.fn(async () => []) } }))
vi.mock('@s/FieldSelectorService', () => ({ default: { events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }, highlightParagraph: vi.fn() } }))
vi.mock('@s/NotificationsService', () => ({ default: { send: vi.fn(), sendOmnibarDisplayStatus: vi.fn(), events: { on: vi.fn(), off: vi.fn() } } }))
vi.mock('@s/RequestService', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
// Mocked because the template renders a nested form per item: the real one walks a full resource
// schema, which these fixtures deliberately do not carry, and the render error it throws leaves
// the component unusable for every case after it.
vi.mock('@s/SchemaService', () => ({ default: { getSchemaFields: vi.fn(() => []), getNestedGroups: vi.fn(() => []) } }))

const { default: ParagraphView } = await import('@c/fields/ParagraphView.vue')
const { default: ResourceService } = await import('@s/ResourceService')

const mountField = (schema = {}, model = {}, props = {}) => mount(ParagraphView, {
  props: { schema: { model: 'blocks', ...schema }, model, ...props },
  shallow: true,
  global: {
    stubs: { RecycleScroller: { template: '<div />' } },
    mocks: { $filters: { translate: key => key }, $loading: { start: vi.fn(), stop: vi.fn() } }
  }
})

describe('ParagraphView', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('labelling', () => {
    it('prefers an english label, then a plain one, then nothing', () => {
      const { vm } = mountField()
      expect(vm.getLabel({ label: { enUS: 'A block' } })).to.equal('A block')
      expect(vm.getLabel({ label: 'A block' })).to.equal('A block')
      expect(vm.getLabel({})).to.equal(false)
    })

    it('nests one level shallower than it sits, never below zero', () => {
      expect(mountField({}, {}, { paragraphLevel: 3 }).vm.getParagraphLevel()).to.equal(2)
      expect(mountField({}, {}, { paragraphLevel: 0 }).vm.getParagraphLevel()).to.equal(0)
    })
  })

  describe('whether more paragraphs may be added', () => {
    it('stops at the count the schema allows', () => {
      const field = mountField({ options: { maxCount: 2 } })
      field.vm.items = [{}, {}]
      expect(field.vm.blockMoreItems()).to.equal(true)
      field.vm.items = [{}]
      expect(field.vm.blockMoreItems()).to.equal(false)
    })

    it('never blocks when no count was set', () => {
      const field = mountField()
      field.vm.items = [{}, {}, {}]
      expect(field.vm.blockMoreItems()).to.equal(false)
    })

    it('blocks while the field is disabled, however few there are', () => {
      expect(mountField({ disabled: true }).vm.blockMoreItems()).to.equal(true)
      expect(mountField({}, {}, { disabled: true }).vm.blockMoreItems()).to.equal(true)
    })
  })

  describe('validation', () => {
    it('demands at least one paragraph when the field is required', () => {
      const field = mountField({ required: true })
      expect(field.vm.validateField()).to.equal(false)
      field.vm.items = [{}]
      expect(field.vm.validateField()).to.equal(true)
    })

    it('is content with none when the field is optional', () => {
      expect(mountField().vm.validateField()).to.equal(true)
    })
  })

  describe('highlighting', () => {
    it('lights up only the paragraph at its own level and index', () => {
      const field = mountField({}, {}, { paragraphLevel: 1 })
      field.vm.onHighlightParagraph(1, 2)
      expect([field.vm.isHighlighted(2), field.vm.isHighlighted(3)]).to.deep.equal([true, false])
      field.vm.onHighlightParagraph(2, 2)
      expect(field.vm.isHighlighted(2)).to.equal(false)
    })

    it('classes the others as not-highlighted while one is lit', () => {
      const field = mountField({}, {}, { paragraphLevel: 1 })
      field.vm.onHighlightParagraph(1, 0)
      expect(field.vm.getItemClasses(0, {})).to.include('highlighted')
      expect(field.vm.getItemClasses(1, {})).to.include('not-highlighted')
    })

    it('classes nothing specially while none is lit', () => {
      const field = mountField({}, {}, { paragraphLevel: 1 })
      const classes = field.vm.getItemClasses(0, {})
      expect(classes).to.not.include('highlighted')
      expect(classes).to.not.include('not-highlighted')
    })
  })

  describe('the file types it accepts', () => {
    const mapping = { options: { mapping: { '.png,.jpg': { type: 'image' }, 'pdf': { type: 'file' }, default: { type: 'text' } } } }

    it('collects every extension the mapping names, dotted and lower case', () => {
      expect(mountField(mapping).vm.getAllAcceptedTypes()).to.equal('.png,.jpg,.pdf')
    })

    it('leaves the default entry out, it being a fallback rather than a type', () => {
      expect(mountField(mapping).vm.getAllAcceptedTypes()).to.not.contain('default')
    })

    it('accepts nothing when no mapping was configured', () => {
      expect(mountField().vm.getAllAcceptedTypes()).to.equal('')
    })

    it('knows whether it handles files at all', () => {
      expect(mountField(mapping).vm.hasFileOrImageTypes).to.equal(true)
      expect(mountField().vm.hasFileOrImageTypes).to.equal(false)
    })
  })

  describe('finding the attachments a paragraph owns', () => {
    it('gathers every id, however deeply nested', () => {
      const { vm } = mountField()
      const paragraph = { id: 'a', child: { id: 'b', list: [{ id: 'c' }, { nothing: true }] } }
      expect(vm.findIds(paragraph)).to.deep.equal(['a', 'b', 'c'])
    })

    it('returns nothing for a paragraph that owns none', () => {
      expect(mountField().vm.findIds({ title: 'plain', nested: { also: 'plain' } })).to.deep.equal([])
    })
  })

  describe('a dynamic layout', () => {
    it('recognises one from the schema, or from an item carrying its own slots', () => {
      expect(mountField({ options: { dynamicLayout: true } }).vm.isDynamicLayoutContainer).to.be.ok
      const field = mountField()
      field.vm.items = [{ slots: 6 }]
      expect(field.vm.isDynamicLayoutContainer).to.be.ok
      expect(mountField().vm.isDynamicLayoutContainer).to.equal(false)
    })

    it('spans twelve slots unless it is a dynamic container that says otherwise', () => {
      expect(mountField().vm.parentSlots).to.equal(12)
      expect(mountField({ options: { dynamicLayout: true } }, { slots: 6 }).vm.parentSlots).to.equal(6)
    })

    it('takes an item width from the item, then from its paragraph schema', () => {
      const field = mountField({ options: { dynamicLayout: true } })
      expect(field.vm.getItemStyles({ _value: { slots: 4 } })).to.be.an('object')
      ResourceService.getParagraphSchema.mockReturnValueOnce({ layout: { slots: 3 } })
      expect(field.vm.getItemStyles({ _type: 'hero' })).to.be.an('object')
    })
  })
})
