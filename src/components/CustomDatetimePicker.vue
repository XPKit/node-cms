<template>
  <div>
    <datetime :format="schema.format" :value="_get(model,schema.model)" @input="onChangeData" />
  </div>
</template>

<script>
import _ from 'lodash'
// import { abstractField } from 'vue-form-generator'
import datetime from './DatetimePicker.vue'

export default {
  components: {
    datetime
  },
  // mixins: [abstractField],
  props: ['options',
    'customDatetimePickerOptions'],
  data () {
    return {
    }
  },
  created () {
    this.schema.format = this.schema.format || 'DD/MM/YYYY h:i:s'
  },
  methods: {
    onChangeData (data) {
      _.set(this.model, this.schema.model, data)
      this.$emit('model-updated', data, this.schema.model)

      // work around to force label update
      const dummy = this.schema.label
      this.schema.label = null
      this.schema.label = dummy
    },
    _get: _.get
  }
}
</script>
