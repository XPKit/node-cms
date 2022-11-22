<template>
  <div>
    <vue-form-generator
      ref="vfg"
      :schema="schema.groupOptions"
      :model="model"
      :options="formOptions"
      @model-updated="onModelUpdated"
    />
  </div>
</template>

<script>
import VueFormGenerator, { abstractField } from 'vue-form-generator'

export default {
  components: {
    'vue-form-generator': VueFormGenerator.component
  },
  mixins: [abstractField],
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
