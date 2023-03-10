<template>
  <div>
    <vuetify-form-base-ssr
      ref="vfg"
      :schema="schema.groupOptions"
      :model="model"
      @model-updated="onModelUpdated"
    />
  </div>
</template>

<script>
import VuetifyFormBaseSsr from 'vuetify-form-base-ssr/src/vuetify-form-base-ssr.vue'
import AbstractField from '@m/AbstractField'

export default {
  components: {
    'vuetify-form-base-ssr': VuetifyFormBaseSsr
  },
  mixins: [AbstractField],
  props: ['groupOptions'],
  data () {
    return {
      errors: null
    }
  },
  created () {
  },
  methods: {
    validate () {
      const isValid = this.$refs.vfg.validate()
      if (!isValid) {
        this.errors = this.$refs.vfg.errors
        throw new Error('group validation error')
      }
      return isValid
    },
    debouncedValidate () {
      return this.$refs.vfg.debouncedValidate()
    },
    clearValidationErrors () {
      return this.$refs.vfg.clearValidationErrors()
    },
    onModelUpdated (value, model) {
      this.$emit('model-updated', value, model)
    }
  }
}
</script>
