<template>
  <div v-if="menuBarButtons" class="toolbar">
    <template v-for="(button, index) in menuBarButtons">
      <tiptap-menu-item :key="index" v-bind="button" />
    </template>
  </div>
</template>

<script>
import TiptapMenuItem from './TiptapMenuItem.vue'

export default {
  components: {
    TiptapMenuItem
  },

  props: {
    editor: {
      type: Object,
      required: true
    },
    buttons: {
      type: Array,
      default: () => []
    }
  },

  data () {
    return {
      menuBarButtons: false,
      defaultButtons: [
        {
          icon: 'mdi-format-bold',
          title: 'Bold',
          action: () => this.editor.chain().focus().toggleBold().run(),
          isActive: () => this.editor.isActive('bold')
        },
        {
          icon: 'mdi-format-italic',
          title: 'Italic',
          action: () => this.editor.chain().focus().toggleItalic().run(),
          isActive: () => this.editor.isActive('italic')
        },
        {
          icon: 'mdi-format-strikethrough',
          title: 'Strike through',
          action: () => this.editor.chain().focus().toggleStrike().run(),
          isActive: () => this.editor.isActive('strike')
        },
        {
          icon: 'mdi-format-paragraph',
          title: 'Paragraph',
          action: () => this.editor.chain().focus().setParagraph().run(),
          isActive: () => this.editor.isActive('paragraph')
        },
        {
          icon: 'mdi-format-list-bulleted',
          title: 'Bullet List',
          action: () => this.editor.chain().focus().toggleBulletList().run(),
          isActive: () => this.editor.isActive('bulletList')
        },
        {
          icon: 'mdi-format-list-numbered',
          title: 'Ordered List',
          action: () => this.editor.chain().focus().toggleOrderedList().run(),
          isActive: () => this.editor.isActive('orderedList')
        },
        {
          icon: 'mdi-format-superscript',
          title: 'Superscript',
          action: () => this.editor.chain().focus().toggleSuperscript().run()
        },
        {
          icon: 'mdi-format-header-1',
          title: 'Heading 1',
          action: () => this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
          isActive: () => this.editor.isActive('heading', { level: 1 })
        },
        {
          icon: 'mdi-format-header-2',
          title: 'Heading 2',
          action: () => this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
          isActive: () => this.editor.isActive('heading', { level: 2 })
        },
        {
          icon: 'mdi-format-header-3',
          title: 'Heading 3',
          action: () => this.editor.chain().focus().toggleHeading({ level: 3 }).run(),
          isActive: () => this.editor.isActive('heading', { level: 3 })
        },
        {
          icon: 'mdi-format-underline',
          title: 'Underline',
          action: () => this.editor.chain().focus().toggleUnderline().run(),
          isActive: () => this.editor.isActive('underline')
        },
        {
          icon: 'mdi-link',
          title: 'Link',
          action: () => this.setLink(),
          isActive: () => this.editor.isActive('link')
        },
        {
          icon: 'mdi-format-quote-open',
          title: 'Quote',
          action: () => this.editor.chain().focus().toggleBlockquote().run(),
          isActive: () => this.editor.isActive('blockquote')
        },
        {
          icon: 'mdi-xml',
          title: 'Code',
          action: () => this.editor.chain().focus().toggleCode().run(),
          isActive: () => this.editor.isActive('code')
        },
        {
          icon: 'mdi-format-clear',
          title: 'Clear Format',
          action: () => this.editor.chain().focus().clearNodes().unsetAllMarks().run()
        },
        {
          icon: 'mdi-minus',
          title: 'Horizontal Rule',
          action: () => this.editor.chain().focus().setHorizontalRule().run()
        },
        {
          icon: 'mdi-arrow-u-left-top',
          title: 'Undo',
          action: () => this.editor.chain().focus().undo().run()
        },
        {
          icon: 'mdi-arrow-u-right-top',
          title: 'Redo',
          action: () => this.editor.chain().focus().redo().run()
        }
      ]
    }
  },
  mounted () {
    this.menuBarButtons = this.buttons.length > 0 ? this.buttons : this.defaultButtons
  },
  methods: {
    setLink () {
      const previousUrl = this.editor.getAttributes('link').href
      const url = window.prompt('URL', previousUrl)

      // cancelled
      if (url === null) {
        return
      }

      // empty
      if (url === '') {
        this.editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .unsetLink()
          .run()

        return
      }

      // update link
      this.editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run()
    }
  }
}
</script>

<style lang="scss" scoped>
.toolbar {
  padding: 8px 16px;
  display: flex;
  gap: 8px;
}
</style>
