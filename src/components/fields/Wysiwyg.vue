<template>
  <div ref="wysiwygWrapper" class="wysiwyg-wrapper">
    <div class="label">{{ schema.label }}</div>
    <tiptap-vuetify
      v-model="localObj[key]"
      :extensions="extensions"
      :toolbar-attributes="{ color: getColorForToolbar() }"
      :disabled="disabled"
      placeholder="Write something …"
      @init="onInit"
      @blur="onInit"
      @focus="onInit"
    />
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
      localObj: this.model,
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
      const list = this.schema.model.split('.')
      this.key = list.pop()
      this.localObj = _.reduce(list, (memo, item) => {
        return memo[item]
      }, this.model)
      this.localObj[this.key] = this.localObj[this.key] || ''
      this.loaded = true
    }
  }
}
</script>
