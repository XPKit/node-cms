<template>
  <div class="json-viewer-wrapper">
    <field-label :schema="schema" />
    <json-viewer v-if="schema" ref="input" :key="schema.model" :value="getData()" :copyable="true" tabindex="-1" @focus="onFieldFocus(true)" @blur="onFieldFocus(false)">
      <template #copy><v-btn icon size="small" elevation="0" variant="flat"><v-icon>mdi-content-copy</v-icon></v-btn></template>
    </json-viewer>
  </div>
</template>

<script>
  import {get as objGet} from 'lodash'
  import AbstractField from '@m/AbstractField'

  export default {
    mixins: [AbstractField],
    data () {
      return {
        options: {
          maxDepth: 0,
          modifiable: !this.disabled,
          rootObjectKey: this.schema.model
        }
      }
    },
    watch: {
      'schema.model': function () {
        this.options.rootObjectKey = this.schema.model
      }
    },
    methods: {
      getData () {
        return objGet(this.model, this.schema.model, false)
      }
    }
  }
</script>
<style lang="scss">
.json-viewer-wrapper {
  .jv-container {
    .jv-button {
      padding: 0;
    }
    .jv-code {
      padding: 8px 0px;
      padding-left: 16px;
    }
  }
}
</style>
