<template>
  <verte
    v-if="options.model"
    :key="schema.model"
    v-model="color"
    :picker="options.picker"
    :model="options.outputModel"
    :menu-position="options.menuPosition"
    :recent-colors="options.recentColors"
    :display="options.display"
    :draggable="options.draggable"
    :enable-alpha="options.enableAlpha"
    :rgb-sliders="options.rgbSliders"
    :class="{disabled: disabled}"
  />
</template>

<script>
import Verte from 'verte'
import _ from 'lodash'
// import { abstractField } from 'vue-form-generator'

export default {
  components: {
    verte: Verte
  },
  // mixins: [abstractField],
  props: [
    'locale'
  ],
  data () {
    return {
      color: '',
      options: { recentColors: null, enableAlpha: false, outputModel: 'hex' }
    }
  },
  watch: {
    color () {
      _.set(this.model, this.schema.model, this.color)
    },
    'schema.model': function () {
      this.color = _.get(this.model, this.schema.model)
    }
  },
  created () {
    this.options = _.extend(this.options, this.schema)
  },
  mounted () {
    this.color = _.get(this.model, this.schema.model)
  },
  methods: {
  }
}
</script>
