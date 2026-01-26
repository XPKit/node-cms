import { defineAsyncComponent, markRaw } from 'vue'

window.plugins = [
  {
    title: 'TestComponent',
    displayname: 'TestComponent',
    name: 'TestComponent',
    component: markRaw(defineAsyncComponent(() => import('./components/TestComponent.vue'))),
    pluginComponent: 'TestComponent',
    group: '- Dashboard -',
  },
]
