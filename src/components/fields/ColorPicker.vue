<template>
  <div class="wrapper-color">
    <field-label :schema="schema" />
    <v-color-picker
      v-if="options.model" ref="input" :key="schema.model + 'custom'" v-model="color" variant="outlined"
      elevation="1" :dot-size="options.dotSize" :hide-canvas="options.hideCanvas" :hide-sliders="options.hideSliders"
      :hide-inputs="options.hideInputs" :model="options.outputModel" :class="{disabled: disabled}"
    />
  </div>
</template>

<script>
  import _ from 'lodash'
  import AbstractField from '@m/AbstractField'

  export default {
    mixins: [AbstractField],
    props: {
      locale: { type: String, default: 'enUS' }
    },
    data () {
      return {
        acceptedModes: ['hexa', 'rgba', 'hsla', 'hex', 'rgb'],
        color: '',
        options: { outputModel: 'hexa', hideInputs: false, hideCanvas: false, hideSliders: false }
      }
    },
    watch: {
      color () {
        this.onChangeData(this.color)
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
        return _.get(this.model, `${this.schema.model}`, '#000000FF')
      }
    }
  }
</script>
