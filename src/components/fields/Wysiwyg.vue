<template>
  <div ref="wysiwygWrapper" class="wysiwyg-wrapper">
    <div class="field-label">{{ schema.label }}</div>
    <div class="border-wrapper">
      <tiptap-vuetify
        ref="input"
        v-model="value"
        :card-props="{ flat: true }"
        :extensions="extensions"
        :toolbar-attributes="{ color: getColorForToolbar(), dense: true, outlined: true, elevation: 1 }"
        :disabled="disabled"
        placeholder="Write something …"
        @init="onInit"
        @blur="onInit"
        @focus="onInit"
      />
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { TiptapVuetify, Heading, Bold, Italic, Strike, Underline, Code, Paragraph, BulletList, OrderedList, ListItem, Link, Blockquote, HardBreak, HorizontalRule, History } from 'tiptap-vuetify'
import AbstractField from '@m/AbstractField'

export default {
  components: { TiptapVuetify },
  mixins: [AbstractField],
  data () {
    return {
      loaded: false,
      key: null,
      extensions: [
        History,
        Blockquote,
        Link,
        Underline,
        Strike,
        Italic,
        ListItem,
        BulletList,
        OrderedList,
        [Heading, {
          options: {
            levels: [1, 2, 3]
          }
        }],
        Bold,
        Code,
        HorizontalRule,
        Paragraph,
        HardBreak
      ]
    }
  },
  watch: {
    model () {
      this.updateObj()
    }
  },
  mounted () {
    this.updateObj()
  },
  created () {
  },
  methods: {
    getColorForToolbar () {
      return this.$vuetify.theme.dark ? 'black' : 'white'
    },
    onInit () {
      setTimeout(() => {
        const elems = _.get(this.$refs.wysiwygWrapper, 'children[1].children[0].children[0].children[0].children[0].children[0].children', [])
        _.each(elems, (elem) => {
          elem.tabIndex = -1
          _.each(elem.children, (children) => {
            children.tabIndex = -1
            _.each(children.children, (c) => {
              c.tabIndex = -1
            })
          })
        })
      }, 10)
    },
    updateObj () {
      if (!_.get(this.schema, 'model', false)) {
        return false
      }
      this.loaded = true
    }
  }
}
</script>
<style lang="scss" scoped>
.wysiwyg-wrapper {
  position: relative;

}
</style>
