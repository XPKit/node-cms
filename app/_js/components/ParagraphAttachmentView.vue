<template>
  <div>
    <draggable
      v-model="items"
      draggable=".file-item"
      handle=".file-item-handle"
      :class="{disabled}"
      @end="onEndDrag"
    >
      <div v-for="fileItem in items" :key="fileItem.id" class="file-item">
        <span class="file-item-handle" />
        <span class="file-item-main">
          <img v-if="schema.fileType === 'image'" :src="getAttachment(fileItem.id, 'url')">
          <span>
            <a :href="getAttachment(fileItem.id, 'url')" target="_blank">
              {{ getAttachment(fileItem.id, '_filename') }}
            </a>
          </span>
          <template v-if="schema.options && schema.options.extraParams">
            <span><input v-model="fileItem.title" placeholder="title" :disabled="disabled" @input="onChange"></span>
            <span><textarea v-model="fileItem.description" placeholder="description" :disabled="disabled" @input="onChange" /></span>
          </template>
        </span>
        <button @click="onClickRemoveFileItem(model, fileItem)">X</button>
      </div>
      <div slot="header">
        <input type="file" :accept="model.input === 'image'? 'image/*': '*'" :disabled="disabled" @change="onChangeFile($event, model)">
      </div>
    </draggable>
  </div>
</template>

<script>
import {v4 as uuid} from 'uuid'
import _ from 'lodash'
import { abstractField } from 'vue-form-generator'

export default {
  components: {
  },
  mixins: [abstractField],
  data () {
    return {
      items: _.get(this.model, this.schema.model, [])
    }
  },
  watch: {
    'schema.model': function () {
      this.items = _.get(this.model, this.schema.model, [])
    }
  },
  mounted () {
  },
  methods: {
    getKeyLocale () {
      const options = {}
      const list = this.schema.model.split('.')
      if (this.schema.localised) {
        options.locale = list.shift()
      }
      options.key = list.join('.')
      return options
    },
    onChange () {
      _.set(this.model, this.schema.model, this.items)
      this.$emit('model-updated', this.model, this.schema.model)
    },
    onEndDrag () {
      _.set(this.model, this.schema.model, this.items)
      this.$emit('model-updated', this.model, this.schema.model)
    },
    onChangeFile (event, item) {
      const files = _.get(event, 'target.files')
      const { key, locale } = this.schema.rootView.getKeyLocale()
      _.each(files, file => {
        const fileItemId = uuid()
        const newItem = {
          id: fileItemId
        }
        this.items.push(newItem)
        this.items = _.clone(this.items)
        _.set(this.model, this.schema.model, this.items)
        this.$emit('model-updated', this.model, this.schema.model)
        const attachments = this.schema.rootView.model._attachments = this.schema.rootView.model._attachments || []

        const attachmentObj = {
          _filename: file.name,
          _name: key,
          _fields: {
            locale,
            fileItemId
          },
          file
        }

        if (this.schema.fileType === 'image') {
          try {
            attachmentObj.url = URL.createObjectURL(file)
          } catch (error) {
            console.error(error)
          }
        }

        attachments.push(attachmentObj)
        event.target.value = null
      })
    },
    getAttachment (fileItemId, field) {
      const attach = _.find(this.schema.rootView.model._attachments, {_fields: {fileItemId}})
      if (field) {
        return _.get(attach, field)
      }
      return attach
    },
    onClickRemoveFileItem (item, fileItem) {
      let attachments = this.schema.rootView.model._attachments = this.schema.rootView.model._attachments || []
      attachments = _.reject(attachments, {_fields: {fileItemId: fileItem.id}})
      this.items = _.difference(this.items, [fileItem])
      _.set(this.schema.rootView.model, '_attachments', attachments)
      _.set(this.model, this.schema.model, this.items)
      this.$emit('model-updated', this.model, this.schema.model)
    }
  }

}
</script>

<style lang="scss" scoped>
.item {
  display: flex;
  margin-bottom: 5px;
  align-items: stretch;
  border: 1px grey solid;

  .handle, .file-item-handle {
    display: inline-block;
    width: 40px;
    background-color: grey;
    cursor: pointer;
  }

  textarea, input {
    width: 100%;
  }
  textarea {
    height: 100px;
  }
  .row {
    display: flex;
    span {
      display: block;
      width: calc(100% - 50px);
      &:first-child {
        width: 50px;
      }
    }
  }
  .item-main {
    width: 100%;
    padding: 10px;
  }
  .file-item {
    display: flex;
    margin-bottom: 10px;
    textarea {
      height: 50px;
    }
  }

  .file-item-main {
    width: 100%;

    img {
      max-width: 100px;
      max-height: 100px;
    }
  }
}
.disabled {
  pointer-events: none;
}
</style>
