<template>
  <div v-if="maxCount != 1" class="record-list">
    <div class="top-bar">
      <div class="search" :class="{'is-query': sift.isQuery, 'is-valid': sift.isQuery && sift.isValid == true, 'is-invalid': sift.isQuery && sift.isValid == false}">
        <input v-model="search" :placeholder="'TL_SEARCH' | translate" type="text" name="search">
      </div>
      <div class="search-buttons">
        <div class="multiselect" :class="{active: multiselect}" @click="onClickMultiselect">S</div>
        <tempalte v-if="maxCount <= 0 || listCount < maxCount">
          <div class="new" @click="onClickNew">+</div>
        </tempalte>
      </div>
    </div>
    <div class="records">
      <RecycleScroller
        v-slot="{ item }"
        class="list"
        :items="filteredList"
        :item-size="80"
        key-field="_id"
      >
        <div class="item"
             :class="{selected: (item == selectedItem) || (multiselect && includes(multiselectItems, item)), frozen:!item._local}"
             @click="select(item)"
        >
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
import RecordNameHelper from './RecordNameHelper'
import qs from 'qs'
import sift from 'sift'
import JSON5 from 'json5'

export default {
  mixins: [RecordNameHelper],
  props: [
    'list',
    'selectedItem',
    'resource',
    'locale',
    'multiselect',
    'multiselectItems'
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
      query: {},
      includes: _.includes
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
    dive (currentKey, into, target) {
      for (var i in into) {
        if (into.hasOwnProperty(i)) {
          var newKey = i
          var newVal = into[i]

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
      var newObj = {}
      this.dive('', arr, newObj)
      return newObj
    },

    select (item) {
      if (this.multiselect) {
        if (_.includes(this.multiselectItems, item)) {
          this.multiselectItems = _.difference(this.multiselectItems, [item])
        } else {
          this.multiselectItems.push(item)
        }
        this.$emit('changeMultiselectItems', this.multiselectItems)
      } else {
        this.$emit('selectItem', item)
      }
    },
    onClickMultiselect () {
      this.multiselectItems = []
      this.$emit('changeMultiselectItems', this.multiselectItems)
      this.$emit('selectMultiselect', !this.multiselect)
    },
    onClickNew () {
      this.multiselectItems = []
      this.$emit('changeMultiselectItems', this.multiselectItems)
      this.$emit('selectMultiselect', false)
      this.$emit('selectItem', { _local: true })
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
