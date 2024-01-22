<template>
  <div ref="wysiwygWrapper" class="wysiwyg-wrapper">
    <div class="field-label">{{ schema.label }}</div>
    <div class="border-wrapper">
      <v-card v-if="editor" class="editor" rounded elevation="0">
        <tiptap-menu-bar class="editor__header" :editor="editor" />
        <editor-content class="editor-content" :editor="editor" />
      </v-card>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { Editor, EditorContent } from '@tiptap/vue-2'
import StarterKit from '@tiptap/starter-kit'
import Superscript from '@tiptap/extension-superscript'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TiptapMenuBar from './TiptapMenuBar.vue'
import AbstractField from '@m/AbstractField'

export default {
  components: { EditorContent, TiptapMenuBar },
  mixins: [AbstractField],
  data () {
    return {
      loaded: false,
      key: null,
      editor: null
    }
  },
  watch: {
    model () {
      this.updateObj()
    }
  },
  mounted () {
    this.editor = new Editor({
      content: this.value,
      extensions: [
        StarterKit.configure({history: true, code: true, blockquote: true}),
        Superscript,
        Underline,
        Link
      ],
      onUpdate: () => {
        this.$emit('change', this.editor.getHTML())
      }
    })
    this.loaded = true
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
<style lang="scss">
@import '@a/scss/variables.scss';

.wysiwyg-wrapper {
  position: relative;
  .border-wrapper {
    padding: 0;
  }
  .editor {
    background-color: $imag-light-grey;
    border-radius: 0 !important;
  }
  .editor__header {
    background-color: white;
    border: 2px solid $imag-light-grey;
  }
   .editor-content {
    padding: 16px;
    font-size: 14px;
    font-style: normal;
    font-weight: 300;
    line-height: normal;
    strong {
      font-weight: 700;
    }
    a {
      color: $imag-blue;
    }
    ul li {
      list-style: disc;
    }
    ol li {
      list-style: decimal;
    }
    blockquote {
      padding-left: 1rem;
      border-left: 3px solid rgba(#0D0D0D, 0.1);
    }
  }
  .ProseMirror:focus {
    outline: none;
  }
}
</style>
