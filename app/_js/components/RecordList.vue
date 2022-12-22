<template>
  <div v-if="maxCount != 1" class="record-list">
    <div class="top-bar">
      <div class="search" :class="{'is-query': sift.isQuery, 'is-valid': sift.isQuery && sift.isValid == true, 'is-invalid': sift.isQuery && sift.isValid == false}">
        <input v-model="search" :placeholder="'TL_SEARCH' | translate" type="text" name="search">
      </div>
      <div v-if="maxCount <= 0 || listCount < maxCount" class="new" @click="createRecord">+</div>
    </div>
    <div class="records">
      <RecycleScroller
        v-slot="{ item }"
        class="list"
        :items="filteredList"
        :item-size="80"
        key-field="_id"
      >
        <div class="item" :class="{selected: item == selectedItem, frozen:!item._local}" @click="select(item)">
          <div v-if="item" class="main">
            <span class="icon">
              <span v-if="item._searchable" class="serchable">
                <i v-if="item._searchable.query == true" class="fi-target-two" />
                <i v-else-if="item._searchable.id == true" class="fi-key" />
                <i v-else-if="item._searchable.keyFields == true" class="fi-results" />
                <i v-else class="default fi-results" />
              </span>
            </span>
            <span>
              <!-- {{ item._recordDisplayName }} -->
              {{ getName(item) }}
            </span>
          </div>
          <div class="meta">
            <span class="id ng-binding">
              <span>{{ item._id }}</span>
            </span>
            <span class="ts"> {{ 'TL_UPDATED' | translate }} <timeago :since="item._updatedAt" :locale="TranslateService.locale" /></span>
          </div>
        </div>
      </recyclescroller>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import TranslateService from '../services/TranslateService'
import ResourceService from '../services/ResourceService'
import qs from 'qs'
import pAll from 'p-all'
import sift from 'sift'
import JSON5 from 'json5'
import * as Mustache from 'mustache'

export default {
  props: [
    'list',
    'selectedItem',
    'resource',
    'locale'
  ],
  data () {
    return {
      cachedMap: {},
      search: null,
      TranslateService,
      sift: {
        isQuery: false,
        isValid: false
      },
      query: {}
    }
  },
  computed: {
    maxCount () {
      return _.get(this.resource, 'maxCount', 0)
    },
    listCount () {
      return _.get(this.list, 'length', 0)
    },
    filteredList () {
      let fields = this.getSearchableFields()
      if (fields.length === 0) {
        fields = [_.first(this.resource.schema)]
      }
      _.forEach(this.list, item => item._searchable = { id: false, keyFields: false, query: false })
      if (this.sift.isQuery) {
        return _.forEach(this.list.filter(sift(this.query)), item => item._searchable.query = true)
      } else {
        return _.filter(this.list, (item) => {
          if (_.isEmpty(this.search)) {
            return true
          }
          const values = []
          _.forEach(fields, (field) => {
            values.push(this.getValue(item, field, this.resource.displayItem))
          })
          let qItems = 0
          let qValues = 0
          for (const queryKey in this.query) {
            const queryValue = this.query[queryKey]
            qItems = qItems + 1
            let value = _.get(item, queryKey)
            if (_.isUndefined(value) === false) {
              if (_.isArray(value)) {
                if (_.includes(value, queryValue)) {
                  qValues = qValues + 1
                }
              } else {
                if (value === queryValue) {
                  qValues = qValues + 1
                }
              }
            }
          }
          let found = false
          if (qItems > 0 && qItems === qValues) {
            found = true
            item._searchable.query = true
          } else if (this.doesMatch(this.search, values)) {
            found = true
            item._searchable.keyFields = true
          } else if (new RegExp(this.search, 'i').test(item._id)) {
            found = true
            item._searchable.id = true
          }
          return found
        })
      }
    }
  },
  watch: {
    // list: function () {
    //   this.injectDisplayNameToList()
    // },
    search: function () {
      this.query = this.flatten(qs.parse(this.search))
      this.sift.isQuery = false
      try {
        if (this.search.search('sift:') === 0) {
          this.sift.isQuery = true
          this.query = JSON5.parse(this.search.substr(5))
          this.sift.isValid = true
        }
      } catch (error) {
        this.sift.isValid = false
        this.query = {}
      }
    }
  },
  async mounted () {
    // this.injectDisplayNameToList()
  },
  methods: {
    // injectDisplayNameToList () {
    //   _.each(this.list, item => {
    //     item._recordDisplayName = this.getName(item)
    //   })
    // },
    getExtraRessources () {
      return _.extend(_.get(this.resource, 'extraSources', {}), _.get(this.resource, 'schema[0].options.extraSources'))
    },
    dive (currentKey, into, target) {
      for (let i in into) {
        if (into.hasOwnProperty(i)) {
          let newKey = i
          let newVal = into[i]

          if (currentKey.length > 0) {
            newKey = currentKey + '.' + i
          }

          if (typeof newVal === 'object') {
            this.dive(newKey, newVal, target)
          } else {
            target[newKey] = newVal
          }
        }
      }
    },

    flatten (arr) {
      let newObj = {}
      this.dive('', arr, newObj)
      return newObj
    },

    select (item) {
      this.$emit('selectItem', item)
    },
    createRecord () {
      this.$emit('selectItem', { _local: true })
    },
    getValue (item, field, template) {
      let displayname = ''
      if (field) {
        if (field.input === 'file') {
          const attachment = _(item).get('_attachments', []).find(file => file._name === field.field)
          displayname = attachment && attachment._filename
        } if (field.input === 'select') {
          let value = _.get(item, field.field)
          if (_.isString(value)) {
            value = _.find(ResourceService.get(field.source), {_id: value})
            if (value) {
              _.each(field.options && field.options.extraSources, (source, field) => {
                const subId = _.get(value, field)
                if (_.isString(subId)) {
                  _.set(value, field, _.find(ResourceService.get(source), {_id: subId}))
                }
              })
            }
          }
          if (field.options && field.options.customLabel) {
            displayname = Mustache.render(field.options.customLabel, value || {})
          } else {
            displayname = _.get(value, _.chain(value).keys().first().value(), '')
          }
        }
        if (displayname === '') {
          const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised))
          if (isLocalised) {
            displayname = _.get(item, `${this.locale}.${field.field}`)
          } else {
            displayname = _.get(item, field.field)
          }
        }
      }
      if (template) {
        const itemCached = _.clone(item)
        _.each(this.getExtraRessources(), (extraSource, extraField) => {
          const cache = ResourceService.get(extraSource)
          if (cache) {
            const value = _.find(cache, {_id: _.get(itemCached, extraField)})
            if (value) {
              _.set(itemCached, extraField, value)
            }
          }
        })
        displayname = Mustache.render(template, itemCached)
      }
      return displayname
    },
    getName (item) {
      const field = _.first(this.resource.schema)
      let value = this.getValue(item, field, this.resource.displayItem)
      return value
    },
    getSearchableFields () {
      return _.filter(this.resource.schema, item => item.searchable === true)
    },
    doesMatch (search, values) {
      let found = false
      _.forEach(values, (value) => {
        found = new RegExp(this.search, 'i').test(value)
        if (found) {
          return false // Exist loop
        }
      })
      return found
    }
  }
}
</script>
