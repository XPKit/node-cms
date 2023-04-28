<template>
  <div class="wrapper-color">
    <v-color-picker
      v-if="options.model"
      :key="schema.model + 'custom'"
      v-model="color"
      :dot-size="options.dotSize"
      :hide-canvas="options.hideCanvas"
      :hide-sliders="options.hideSliders"
      :hide-inputs="options.hideInputs"
      :hide-mode-switch="options.hideModeSwitch"
      :model="options.outputModel"
      :class="{disabled: disabled}"
    />
  </div>
</template>

<script>
import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  props: ['locale'],
  data () {
    return {
      acceptedModes: ['hexa', 'rgba', 'hsla'],
      color: '',
      options: { outputModel: 'hexa', hideInputs: false, hideCanvas: false, hideSliders: false, hideModeSwitch: false }
    }
  },
  watch: {
    color () {
      _.set(this.model, this.schema.model, this.color)
    },
    'schema.model': function () {
      this.color = this.getColor()
    }
  },
  created () {
    const options = _.extend(this.options, this.schema)
    if (_.indexOf(this.acceptedModes, options.outputModel) === -1) {
      console.warn(`Invalid color mode detected: '${options.outputModel}', will default to hexa`)
      options.outputModel = 'hexa'
    }
    this.options = options
  },
  mounted () {
    this.color = this.getColor()
  },
  methods: {
    getColor () {
      return _.get(this.model, this.schema.model)
    }
  }
}
</script>
