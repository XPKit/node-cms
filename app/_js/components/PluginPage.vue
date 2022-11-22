<template>
  <div class="plugin-page">
    <component :is="plugin.component" />
  </div>
</template>

<script>

export default {
  props: [
    'plugin'
  ],
  data () {
    return {
    }
  },
  watch: {

  },
  mounted () {
    // console.log(this.plugin)
  },
  methods: {

  }

}
</script>
