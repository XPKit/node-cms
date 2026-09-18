import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormService from '@s/FormService'

const { default: CustomDatetimePicker } = await import('@c/fields/CustomDatetimePicker.vue')

// The picker's whole contract with vue-datepicker is three props, and all three are derived from
// `schema.format`: the display formatter, and whether the minute and second columns exist at all.
// Building the schema from the real `FormService.typeMapper` rather than by hand is the point —
// that is where a date field's format actually comes from, through SchemaService.
const DatePicker = {
  name: 'date-picker',
  props: ['modelValue', 'format', 'enableMinutes', 'enableSeconds', 'enableTimePicker', 'enableDatePicker', 'placeholder', 'locale', 'dayClass'],
  template: '<div />'
}

const mountPicker = (input, overrides = {}) => mount(CustomDatetimePicker, {
  props: {
    model: {},
    schema: {
      ...FormService.typeMapper[input],
      model: 'when',
      originalModel: 'when',
      resource: { schema: [{ field: 'when', input }] },
      ...overrides
    }
  },
  global: {
    components: { 'date-picker': DatePicker, 'field-label': { template: '<div />' }, 'v-icon': { template: '<i />' } }
  }
})

const picker = (wrapper) => wrapper.findComponent(DatePicker)
const when = new Date('2020-01-01T13:45:07')

describe('CustomDatetimePicker', () => {
  it('formats a date field with the date format the form service supplies', () => {
    const p = picker(mountPicker('date'))
    expect(p.props('format')(when)).to.equal('2020-01-01')
  })

  it('formats a datetime field down to the second', () => {
    const p = picker(mountPicker('datetime'))
    expect(p.props('format')(when)).to.equal('2020-01-01 13:45:07')
  })

  // The minute and second columns are switched on by searching the format string for `mm` and `ss`,
  // which is case sensitive: a date-only field carries `YYYY-MM-DD`, whose `MM` is the month.
  it('offers minutes and seconds only when the format asks for them', () => {
    const date = picker(mountPicker('date'))
    expect([date.props('enableMinutes'), date.props('enableSeconds')]).to.deep.equal([false, false])

    const datetime = picker(mountPicker('datetime'))
    expect([datetime.props('enableMinutes'), datetime.props('enableSeconds')]).to.deep.equal([true, true])

    const time = picker(mountPicker('time'))
    expect([time.props('enableMinutes'), time.props('enableSeconds')]).to.deep.equal([true, true])
  })

  // #102: the component used to fill a missing format in with `'YYYY/MM/DD h:i:s'`, which is PHP's
  // date syntax — dayjs passes `i` through literally and reads `h`/`s` as unpadded 12-hour and
  // second, so the value rendered as `2020/01/01 1:i:7` and the minute column vanished. Nothing
  // reaches this path, because SchemaService always extends a field from typeMapper, so the
  // fallback is gone rather than corrected: dayjs's own default is the honest answer.
  it('falls back to dayjs rather than inventing a format when the schema has none', () => {
    const p = picker(mountPicker('datetime', { format: undefined }))
    expect(p.props('format')(when)).to.equal('2020-01-01T13:45:07+00:00')
    expect(p.props('enableMinutes')).to.equal(false)
  })
})
