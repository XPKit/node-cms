<template>
  <div>
    <div class="field-label">{{ schema.label }}</div>
    <div class="group">
      <custom-form
        ref="vfg"
        :schema="schema.groupOptions"
        :model.sync="model"
        @error="onError"
        @input="onModelUpdated"
      />
    </div>
  </div>
</template>

<script>
// import _ from 'lodash'
import AbstractField from '@m/AbstractField'

export default {
  mixins: [AbstractField],
  props: ['groupOptions'],
  data () {
    return {
      errors: null
    }
  },
  methods: {
    onError (error) {
      console.log(999, 'error', error)
    },
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

<style lang="scss" scoped>
.group {
  border: 1px solid white;
  border-radius: 16px;
  padding: 16px;
}
</style>
