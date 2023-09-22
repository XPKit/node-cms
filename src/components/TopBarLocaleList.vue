<template>
  <div class="top-bar-locale-list" :class="{hidden: !locales || locales.length === 0}">
    <template v-if="locales && locales.length === 2">
      <v-btn elevation="0" class="back" rounded text small @click="back"><v-icon>mdi-chevron-left</v-icon> {{ "TL_BACK" | translate }}</v-btn>
      <div v-show="locales" class="locales toggle-mode" @click="toggleLocale()">
        <v-chip v-for="(item, i) in locales" :key="i" small :ripple="false" :class="{selected: item === locale}">
          {{ getLocaleTranslation(item) }}
        </v-chip>
      </div>
    </template>
    <template v-else>
      <v-btn elevation="0" class="back" rounded text small @click="back"><v-icon>mdi-chevron-left</v-icon> {{ "TL_BACK" | translate }}</v-btn>
      <div v-show="locales" class="locales">
        <v-chip v-for="(item, i) in locales" :key="i" small :ripple="false" :class="{selected: item === locale}" @click="selectLocale(item)">
          {{ getLocaleTranslation(item) }}
        </v-chip>
      </div>
    </template>
  </div>
</template>

<script>
import _ from 'lodash'
import TranslateService from '@s/TranslateService'

export default {
  props: {
    locales: {
      type: Array,
      default: () => []
    },
    locale: {
      type: String,
      default: ''
    },
    back: {
      type: Function,
      default: () => {}
    },
    selectLocale: {
      type: Function,
      default: () => {}
    }
  },
  data () {
    return {
      TranslateService
    }
  },
  methods: {
    getLocaleTranslation (locale) {
      return TranslateService.get('TL_' + locale.toUpperCase())
    },
    toggleLocale () {
      this.selectLocale(_.find(this.locales, (l) => l !== this.locale))
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@a/scss/variables.scss';
.top-bar-locale-list {
  display: flex;
  align-items: center;
  gap: 8px;
  .locales {
    border: 2px solid $locales-border-color;
    border-radius: 100px;
    padding: 4px;
    gap: 8px;

    .v-chip {
      user-select: none;
      text-transform: uppercase;
      color: $locales-color;
      background-color: $locales-background;
      transition: all 0.3s;
      @include small-cta-text;
      font-style: normal;
      &.selected {
        color: $locales-selected-color;
        background-color: $locales-selected-background;
      }
    }

    &.toggle-mode {
      cursor: pointer;

      .v-chip {
        cursor: pointer;
      }
    }
  }
  &.hidden {
    opacity: 0;
  }
}
</style>
