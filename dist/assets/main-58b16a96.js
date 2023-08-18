import { V as Vuetify, a as Vue$1, i as ih, _, E as Emitter, b as axios, c as axios$1, d as autoBind, e as dayjs, r as relativeTime, f as __unplugin_components_0, g as __unplugin_components_1, h as __unplugin_components_5, j as __unplugin_components_0$1, k as __unplugin_components_9, l as __unplugin_components_2, m as __unplugin_components_3, n as VListItemTitle, o as __unplugin_components_0$2, p as VToolbarTitle, q as __unplugin_components_3$1, s as mustache, t as sift, u as qs, v as lib, w as __unplugin_components_0$3, x as __unplugin_components_0$4, y as __unplugin_components_1$1, z as __unplugin_components_2$1, A as h, B as pAll, C as __unplugin_components_0$5, D as VScrollYTransition, F as __unplugin_components_2$2, G as __unplugin_components_0$6, H as __unplugin_components_3$2, I as __unplugin_components_1$2, J as lodashExports, K as vueCodemirrorExports, L as __unplugin_components_0$7, M as jsoneditorExports, N as Ci, O as qi, P as ji, Q as Ki, R as Pi, S as Ii, T as Li, U as Vi, W as zi, $ as $i, X as Ni, Y as Ri, Z as Di, a0 as Fi, a1 as Bi, a2 as Hi, a3 as v4, a4 as __unplugin_components_2$3, a5 as __unplugin_components_3$3, a6 as ne, a7 as __unplugin_components_0$8, a8 as __unplugin_components_2$4, a9 as __unplugin_components_0$9, aa as __unplugin_components_0$a, ab as __unplugin_components_0$b, ac as draggable, ad as VueEasytable, ae as TreeView, af as plugin, ag as VueRouter$1, ah as VueShortkey, ai as VueTimeago, aj as enUS, ak as zhCN } from "./vendor-1e4d2904.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity)
      fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy)
      fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous")
      fetchOpts.credentials = "omit";
    else
      fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const main = "";
const vuetify = new Vuetify({
  theme: {
    themes: {
      light: {
        primary: "#00095B",
        "node-cms-black": "#00142E",
        "node-cms-blue": "#00095B",
        "node-cms-grabber": "#1700F4",
        "node-cms-twilight": "#00142E",
        "node-cms-grey": "#AFAFAF",
        "node-cms-light-grey": "#DBDBDB",
        "node-cms-light-white-grey": "#EDEDED",
        "node-cms-off-white": "#F6F6F6",
        "node-cms-red": "#C90000"
      },
      dark: {
        primary: "#00142E",
        "node-cms-black": "#00142E",
        "node-cms-blue": "00142E",
        "node-cms-grabber": "00142E",
        "node-cms-twilight": "00142E",
        "node-cms-grey": "00142E",
        "node-cms-light-grey": "00142E",
        "node-cms-light-white-grey": "00142E",
        "node-cms-off-white": "00142E",
        "node-cms-red": "00142E"
      }
    }
  },
  icons: {
    iconfont: "mdi"
    // 'mdi' || 'mdiSvg' || 'md' || 'fa' || 'fa4' || 'faSvg'
  }
});
Vue$1.use(Vuetify);
Vue$1.use(ih, {
  // the next line is important! You need to provide the Vuetify Object to this place.
  vuetify,
  // same as "vuetify: vuetify"
  // optional, default to 'md' (default vuetify icons before v2.0.0)
  iconsGroup: "mdi"
});
class LoadingService {
  constructor() {
    this.isShow = false;
    this.list = [];
  }
  start(param) {
    this.isShow = true;
    this.list = _.union(this.list, [param]);
  }
  stop(param) {
    this.list = _.difference(this.list, [param]);
    if (_.isEmpty(this.list)) {
      this.isShow = false;
    }
  }
}
const LoadingService$1 = new LoadingService();
class NotificationsService {
  constructor() {
    this.events = new Emitter();
  }
  send(message, type = "success") {
    this.events.emit("notification", { message, type });
  }
}
const NotificationsService$1 = new NotificationsService();
class LoginService {
  constructor() {
    this.user = null;
    this.logoutCallbackList = [];
  }
  init() {
    console.info("LoginService - init");
    setInterval(async () => {
      this.checkStatus();
    }, 1e3 * 15);
  }
  async getStatus() {
    try {
      const { data } = await axios.get(`${window.location.pathname}login`);
      this.user = data;
      return data;
    } catch (error) {
      return null;
    }
  }
  async checkStatus() {
    let status;
    const userBefore = _.cloneDeep(this.user);
    try {
      status = await this.getStatus();
    } catch (error) {
    }
    if (_.isEmpty(status) && !_.isEmpty(userBefore)) {
      console.info("will logout");
      await this.logout();
    }
  }
  async changeTheme(isDark) {
    try {
      const newTheme = _.get(this.user, "theme", "dark") === "dark" ? "light" : "dark";
      console.warn("changeTheme ", this.user, newTheme);
      await axios.get(`${window.location.pathname}changeTheme/${newTheme}`);
      console.warn("Successfully changed the theme for user");
    } catch (error) {
      console.error("Failed to change theme: ", error);
    }
  }
  async logout() {
    this.user = null;
    try {
      await axios.get(`${window.location.pathname}logout`);
      window.location.reload();
    } catch (error) {
      console.error("Failed to logout: ", error);
    }
    _.each(this.logoutCallbackList, (callback) => {
      callback();
    });
  }
  onLogout(callback) {
    this.logoutCallbackList.push(callback);
  }
  checkPermission(module) {
    return _.includes(this.user.group.modules, module);
  }
}
const LoginService$1 = new LoginService();
class ConfigService {
  constructor() {
    this.config = {};
  }
  async init() {
    try {
      const { data } = await axios$1.get(`${window.location.pathname}config`);
      this.config = data;
    } catch (error) {
      console.error("Error during init of ConfigService:", error);
    }
  }
}
const ConfigService$1 = new ConfigService();
let TranslateService$3 = class TranslateService {
  constructor() {
    this.dict = {};
    this.locale = "enUS";
  }
  async init() {
    const { data } = await axios$1.get(`${window.location.pathname}i18n/config.json`);
    this.config = _.get(data, "config.language", { "defaultLocale": "enUS", "locales": ["enUS"] });
    this.locale = _.get(this.config, "defaultLocale", "enUS");
    for (const locale of this.config.locales) {
      try {
        const { data: data2 } = await axios$1.get(`${window.location.pathname}i18n/${locale}.json`);
        this.dict[locale] = data2;
      } catch (error) {
        console.warn(`TranslateService wasn't able to pull ${locale}: `, error);
      }
    }
  }
  setLocale(locale) {
    this.locale = locale;
  }
  get(key, locale, params) {
    if (_.isString(key)) {
      const value = this.dict[locale || this.locale] && this.dict[locale || this.locale][key];
      if (value) {
        const compiled = _.template(value);
        return compiled(params);
      }
      return key;
    }
    if (_.isEmpty(key)) {
      return "";
    }
    return key[locale || this.locale] || "";
  }
};
const TranslateService$4 = new TranslateService$3();
class ResourceService {
  constructor() {
    this.cacheMap = {};
  }
  async cache(resource) {
    const { data } = await axios$1.get(`${window.location.pathname}../api/${resource}`);
    if (_.get(data, "userLoggedOut", false)) {
      console.info("Received userLoggedOut from server, will redirect to login page");
      window.location.reload();
      return [];
    }
    this.cacheMap[resource] = data;
    return this.get(resource);
  }
  get(resource) {
    const data = this.cacheMap[resource];
    if (_.isUndefined(data)) {
      console.info(`resource (${resource}) is not cached`);
    }
    return data;
  }
  setSchemas(schemas) {
    this.schemas = schemas;
  }
  getSchema(resource) {
    return _.find(this.schemas, { title: resource });
  }
}
const ResourceService$1 = new ResourceService();
function normalizeComponent(scriptExports, render39, staticRenderFns, functionalTemplate, injectStyles, scopeId, moduleIdentifier, shadowMode) {
  var options = typeof scriptExports === "function" ? scriptExports.options : scriptExports;
  if (render39) {
    options.render = render39;
    options.staticRenderFns = staticRenderFns;
    options._compiled = true;
  }
  if (functionalTemplate) {
    options.functional = true;
  }
  if (scopeId) {
    options._scopeId = "data-v-" + scopeId;
  }
  var hook;
  if (moduleIdentifier) {
    hook = function(context) {
      context = context || // cached call
      this.$vnode && this.$vnode.ssrContext || // stateful
      this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext;
      if (!context && typeof __VUE_SSR_CONTEXT__ !== "undefined") {
        context = __VUE_SSR_CONTEXT__;
      }
      if (injectStyles) {
        injectStyles.call(this, context);
      }
      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier);
      }
    };
    options._ssrRegister = hook;
  } else if (injectStyles) {
    hook = shadowMode ? function() {
      injectStyles.call(
        this,
        (options.functional ? this.parent : this).$root.$options.shadowRoot
      );
    } : injectStyles;
  }
  if (hook) {
    if (options.functional) {
      options._injectStyles = hook;
      var originalRender = options.render;
      options.render = function renderWithStyleInjection(h2, context) {
        hook.call(context);
        return originalRender(h2, context);
      };
    } else {
      var existing = options.beforeCreate;
      options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
    }
  }
  return {
    exports: scriptExports,
    options
  };
}
const _sfc_main$C = {
  data() {
    return {};
  },
  mounted() {
  },
  methods: {
    notify(message, type = "success") {
      const logFunc = _.get(console, type, console.info);
      logFunc(message);
      NotificationsService$1.send(message, type);
    }
  }
};
const _sfc_render$C = null;
const _sfc_staticRenderFns$C = null;
var __component__$C = /* @__PURE__ */ normalizeComponent(
  _sfc_main$C,
  _sfc_render$C,
  _sfc_staticRenderFns$C,
  false,
  null,
  null,
  null,
  null
);
const Notification = __component__$C.exports;
const _sfc_main$B = {};
var _sfc_render$B = function render() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "showbox active" }, [_c("div", { staticClass: "loader" }, [_c("svg", { staticClass: "circular", attrs: { "viewBox": "25 25 50 50" } }, [_c("circle", { staticClass: "path", attrs: { "cx": "50", "cy": "50", "r": "20", "fill": "none", "stroke-width": "2", "stroke-miterlimit": "10" } })])])]);
};
var _sfc_staticRenderFns$B = [];
var __component__$B = /* @__PURE__ */ normalizeComponent(
  _sfc_main$B,
  _sfc_render$B,
  _sfc_staticRenderFns$B,
  false,
  null,
  null,
  null,
  null
);
const Loading$1 = __component__$B.exports;
const _sfc_main$A = {
  props: {
    localeList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      TranslateService: TranslateService$4
    };
  },
  methods: {
    select(item) {
      TranslateService$4.setLocale(item);
    }
  }
};
var _sfc_render$A = function render2() {
  var _vm = this, _c = _vm._self._c;
  return _vm.localeList && _vm.localeList.length > 1 ? _c("div", { staticClass: "locale-list" }, _vm._l(_vm.localeList, function(locale, index) {
    return _c("div", { key: index, staticClass: "locale", class: { active: _vm.TranslateService.locale == locale }, on: { "click": function($event) {
      return _vm.select(locale);
    } } }, [_vm._v(" " + _vm._s(_vm._f("translate")("TL_" + locale.toUpperCase())) + " ")]);
  }), 0) : _vm._e();
};
var _sfc_staticRenderFns$A = [];
var __component__$A = /* @__PURE__ */ normalizeComponent(
  _sfc_main$A,
  _sfc_render$A,
  _sfc_staticRenderFns$A,
  false,
  null,
  null,
  null,
  null
);
const LocaleList = __component__$A.exports;
class WebsocketService {
  constructor() {
    autoBind(this);
    this.events = new Emitter();
    this.connection = null;
    this.clientID = 0;
    this.isConnecting = false;
    this.isConnected = false;
    this.connecting = false;
    this.serverUrl = false;
  }
  async init(config) {
    this.serverUrl = `ws://${window.location.hostname}:${_.get(config, "webserver.port", 9090)}`;
    this.connect();
  }
  connect() {
    clearTimeout(this.connecting);
    if (this.isConnecting) {
      return;
    }
    this.isConnecting = true;
    this.isConnected = false;
    this.events.emit("connected", false);
    setTimeout(() => {
      this.client = new WebSocket(this.serverUrl, "json");
      console.info(`Created websocket client for ${this.serverUrl}`);
      this.client.onopen = this.onOpen;
      this.client.onclose = this.onClose;
      this.client.onmessage = this.onMessage;
    }, 150);
  }
  onClose(event2) {
    console.info("Websocket - onClose", event2);
    this.isConnecting = false;
    this.isConnected = false;
    this.events.emit("connected", false);
    clearTimeout(this.heatbeat);
    clearTimeout(this.connecting);
    this.connecting = setTimeout(async () => {
      await this.connect();
    }, 500);
  }
  onOpen(event2) {
    this.onHeartbeat();
    this.isConnecting = false;
    this.isConnected = true;
    this.events.emit("connected", true);
  }
  onMessage(event2) {
    const msg2 = JSON.parse(event2.data);
    const action = _.get(msg2, "action", "??");
    if (action === "ping") {
      return this.pong();
    }
    this.events.emit(action, _.get(msg2, "data", {}));
  }
  pong() {
    this.send({ action: "pong", bearer: "9-0123456789" });
    this.onHeartbeat();
  }
  send(data) {
    try {
      if (this.client) {
        this.client.send(JSON.stringify(data));
      }
    } catch (error) {
      console.error("WebSocket::send: Error:", error);
    }
  }
  onHeartbeat() {
    clearTimeout(this.heatbeat);
    this.heatbeat = setTimeout(() => {
      this.client.close();
    }, 3e4 + 5e3);
  }
}
const WebsocketService$1 = new WebsocketService();
const SystemInfo_vue_vue_type_style_index_0_scoped_72b13096_lang = "";
dayjs.extend(relativeTime);
const _sfc_main$z = {
  props: {
    config: {
      type: [Object, Boolean],
      default: false
    }
  },
  data() {
    return {
      TranslateService: TranslateService$4,
      destroyed: false,
      type: null,
      timer: null,
      system: {
        cpu: {
          count: 0,
          usage: 0,
          model: "Unknown"
        },
        memory: {
          totalMemMb: 0,
          usedMemMb: 0,
          freeMemMb: 0,
          freeMemPercentage: 0
        },
        network: "not supported",
        drive: "not supported",
        uptime: 0
      }
    };
  },
  computed: {
    showLogoutButton() {
      return !_.get(window, "disableJwtLogin", false);
    }
  },
  async mounted() {
    WebsocketService$1.events.on("getSystemInfo", (system) => {
      this.system = system;
      this.$forceUpdate();
    });
    await WebsocketService$1.init(this.config);
    this.getSystemData();
  },
  destroyed() {
    this.destroyed = true;
    clearTimeout(this.timer);
  },
  methods: {
    getTheme() {
      return _.get(LoginService$1, "user.theme", "light") === "dark";
    },
    async onChangeTheme(value) {
      this.$vuetify.theme.dark = value;
    },
    async logout() {
      await LoginService$1.logout();
    },
    async getSystemData() {
      try {
        WebsocketService$1.send({ action: "getSystemInfo" });
      } catch (error) {
        console.error(error);
      }
      if (!this.destroyed) {
        this.timer = setTimeout(this.getSystemData, this.error ? 1e4 : 5e3);
      }
    },
    select(item) {
      this.$emit("selectItem", item);
    },
    timeAgo(current) {
      return dayjs().subtract(parseInt(current, 10), "second").fromNow();
    },
    convertBytes(megaBytes) {
      const sizes = ["MB", "GB", "TB"];
      if (megaBytes === 0) {
        return "0 MB";
      }
      if (Math.log(megaBytes) <= 0) {
        return `${megaBytes.toFixed(1)} MB`;
      }
      const i = parseInt(Math.floor(Math.log(megaBytes) / Math.log(1024)));
      if (i <= 0) {
        return megaBytes + " " + sizes[i];
      }
      return (megaBytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
    }
  }
};
var _sfc_render$z = function render3() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "system-info" }, [_c(__unplugin_components_0, { attrs: { "content-class": "system-info-menu", "offset-y": "", "close-on-content-click": false }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
    return [_c(__unplugin_components_1, _vm._g(_vm._b({ attrs: { "icon": "" } }, "v-btn", attrs, false), on), [_c(__unplugin_components_5, [_vm._v("mdi-cog-outline")])], 1)];
  } }]) }, [_c("div", { staticClass: "system-info-wrapper" }, [_c("div", { staticClass: "theme-switch" }, [_c("div", { staticClass: "theme-switch-container" }, [_c(__unplugin_components_5, [_vm._v("mdi-theme-light-dark")]), _c(__unplugin_components_0$1, { attrs: { "input-value": _vm.getTheme(), "compact": "", "dense": "", "hide-details": "", "solo": "" }, on: { "change": _vm.onChangeTheme } })], 1)]), _c("div", { staticClass: "node-cms-title flex" }, [_vm._v(" " + _vm._s(_vm._f("translate")("TL_SYSTEM")) + " "), _vm.showLogoutButton ? _c(__unplugin_components_1, { attrs: { "color": "error", "small": "" }, on: { "click": function($event) {
    return _vm.logout();
  } } }, [_c(__unplugin_components_5, { attrs: { "small": "", "color": "black" } }, [_vm._v("mdi-link-variant-off")]), _vm._v(_vm._s(_vm._f("translate")("TL_LOGOUT")))], 1) : _vm._e()], 1), _c("div", { staticClass: "stats cpu" }, [_c("div", { staticClass: "node-cms-title" }, [_c("small", [_c("b", [_vm._v("CPU Usage")])])]), _c(__unplugin_components_9, { attrs: { "color": "#6af", "rounded": "", "value": _vm.system.cpu.usage } }), _c("small", { staticClass: "text" }, [_vm._v(_vm._s(_vm.system.cpu.count) + " cores (" + _vm._s(_vm.system.cpu.model) + ")")])], 1), _c("div", { staticClass: "stats ram" }, [_c("div", { staticClass: "node-cms-title" }, [_c("small", [_c("b", [_vm._v("Memory Usage")])])]), _c(__unplugin_components_9, { attrs: { "color": "#6af", "rounded": "", "value": 100 - _vm.system.memory.freeMemPercentage } }), _c("small", { staticClass: "text" }, [_vm._v(_vm._s(_vm.convertBytes(_vm.system.memory.usedMemMb)) + " / " + _vm._s(_vm.convertBytes(_vm.system.memory.totalMemMb)))])], 1), _vm.system.drive != "not supported" ? _c("div", { staticClass: "stats drive" }, [_c("div", { staticClass: "node-cms-title" }, [_c("small", [_c("b", [_vm._v("Disk Usage")])])]), _c(__unplugin_components_9, { attrs: { "color": "#6af", "rounded": "", "value": 100 - _vm.system.drive.usedPercentage } }), _c("small", { staticClass: "text" }, [_vm._v(_vm._s(_vm.convertBytes(_vm.system.drive.usedGb * 1024)) + " / " + _vm._s(_vm.convertBytes(_vm.system.drive.totalGb * 1024)))])], 1) : _vm._e(), _c("div", { staticClass: "stats two-by-two" }, [_vm.system.network != "not supported" ? _c("div", { staticClass: "stats network" }, [_c("div", { staticClass: "node-cms-title" }, [_c("small", [_c("b", [_vm._v("Network Usage")])])]), _c("small", { staticClass: "text" }, [_vm._v(_vm._s(_vm.convertBytes(_vm.system.network.total.outputMb)) + " "), _c(__unplugin_components_5, [_vm._v("mdi-arrow-up")]), _vm._v(" / " + _vm._s(_vm.convertBytes(_vm.system.network.total.inputMb)) + " "), _c(__unplugin_components_5, [_vm._v("mdi-arrow-down")])], 1)]) : _vm._e(), _c("div", { staticClass: "stats uptime" }, [_c("div", { staticClass: "node-cms-title" }, [_c("small", [_c("b", [_vm._v("Uptime")])])]), _c("small", { staticClass: "text" }, [_vm._v(_vm._s(_vm.timeAgo(_vm.system.uptime)))])])])])])], 1);
};
var _sfc_staticRenderFns$z = [];
var __component__$z = /* @__PURE__ */ normalizeComponent(
  _sfc_main$z,
  _sfc_render$z,
  _sfc_staticRenderFns$z,
  false,
  null,
  "72b13096",
  null,
  null
);
const SystemInfo = __component__$z.exports;
const ResourceList_vue_vue_type_style_index_0_scoped_22877e5c_lang = "";
const _sfc_main$y = {
  props: {
    selectResourceCallback: {
      type: Function,
      default: () => {
      }
    },
    resourceList: {
      type: Array,
      default: () => []
    },
    plugins: {
      type: Array,
      default: () => []
    },
    selectedItem: {
      type: Object,
      default: () => {
      }
    }
  },
  computed: {
    groupedList() {
      const others = { name: "TL_OTHERS" };
      const plugins = { name: "TL_PLUGINS" };
      let groups = [others, plugins];
      let list = _.union(this.resourceList, _.map(this.plugins, (item) => _.extend(item, { type: "plugin" })));
      _.each(list, (item) => {
        if (_.isEmpty(item.group)) {
          return;
        }
        if (!_.isString(item.group)) {
          const oldGroup = _.find(groups, (group) => {
            if (_.isEqual(group.name, item.group)) {
              return group;
            }
          });
          if (!oldGroup) {
            groups.push({ name: item.group });
          }
        }
      });
      _.each(list, (item) => {
        if (_.isEmpty(item.group)) {
          return;
        }
        if (_.isString(item.group)) {
          const oldGroup = _.find(groups, (group) => {
            if (group === item.group) {
              return group;
            }
            if (group.name === item.group) {
              return group;
            }
            if (_.includes(_.values(group.name), item.group)) {
              return group;
            }
          });
          if (!oldGroup) {
            groups.push({ name: item.group });
          }
        }
      });
      _.each(list, (item) => {
        const oldGroup = _.find(groups, (group) => {
          if (_.isEqual(group.name, item.group) || group === item.group || group.name === item.group || _.includes(_.values(group.name), item.group)) {
            return group;
          }
        });
        if (oldGroup) {
          oldGroup.list = oldGroup.list || [];
          oldGroup.list.push(item);
          return;
        }
        if (item.type === "plugin") {
          plugins.list = plugins.list || [];
          plugins.list.push(item);
        } else {
          others.list = others.list || [];
          others.list.push(item);
        }
      });
      groups = _.orderBy(groups, (item) => {
        if (item.name === "CMS") {
          return String.fromCharCode(0);
        } else if (item === others) {
          return String.fromCharCode(255);
        }
        return `${TranslateService$4.get(item.name, "enUS")}`.toLowerCase();
      }, "asc");
      return _.filter(groups, (group) => group.list && group.list.length !== 0);
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (_.isEmpty(this.selectedItem)) {
        this.selectResourceCallback(_.first(_.get(_.first(this.groupedList), "list", [])));
      }
    });
  },
  methods: {
    getResourceTitle(resource) {
      return resource.displayname ? TranslateService$4.get(resource.displayname) : resource.title;
    },
    groupSelected(resourceGroup) {
      if (!this.selectedItem) {
        return false;
      }
      const selectedItemGroup = _.get(this.selectedItem, "group.enUS", _.get(this.selectedItem, "group", false));
      const groupName = _.get(resourceGroup, "name.enUS", resourceGroup.name);
      if (groupName === "TL_OTHERS" && !selectedItemGroup) {
        return true;
      }
      return groupName === selectedItemGroup;
    }
  }
};
var _sfc_render$y = function render4() {
  var _vm = this, _c = _vm._self._c;
  return _vm.groupedList ? _c("div", { staticClass: "resources-content" }, [_c("div", { staticClass: "resource-list" }, _vm._l(_vm.groupedList, function(resourceGroup, index) {
    return _c("div", { key: `resource-group-${index}`, staticClass: "resource" }, [_c(__unplugin_components_0, { attrs: { "open-on-hover": "", "offset-y": "" }, scopedSlots: _vm._u([{ key: "activator", fn: function({ on, attrs }) {
      return [_c(__unplugin_components_1, _vm._g(_vm._b({ class: { selected: _vm.groupSelected(resourceGroup) }, attrs: { "outlined": _vm.groupSelected(resourceGroup), "text": "", "small": "" } }, "v-btn", attrs, false), on), [_vm._v(" " + _vm._s(_vm._f("translate")(resourceGroup.name)) + " ")])];
    } }], null, true) }, [_c(__unplugin_components_2, { attrs: { "dense": "", "nav": "" } }, _vm._l(resourceGroup.list, function(resource) {
      return _c(__unplugin_components_3, { key: resource.name, class: { selected: _vm.selectedItem === resource }, attrs: { "dense": "" }, on: { "click": function($event) {
        return _vm.selectResourceCallback(resource);
      } } }, [_c(VListItemTitle, [_vm._v(_vm._s(_vm.getResourceTitle(resource)))])], 1);
    }), 1)], 1)], 1);
  }), 0)]) : _vm._e();
};
var _sfc_staticRenderFns$y = [];
var __component__$y = /* @__PURE__ */ normalizeComponent(
  _sfc_main$y,
  _sfc_render$y,
  _sfc_staticRenderFns$y,
  false,
  null,
  "22877e5c",
  null,
  null
);
const ResourceList = __component__$y.exports;
const NavBar_vue_vue_type_style_index_0_lang = "";
const _sfc_main$x = {
  components: { SystemInfo, ResourceList },
  props: {
    toolbarTitle: {
      type: [String, Boolean],
      default: false
    },
    config: {
      type: [Object, Boolean],
      default: false
    },
    localeClass: {
      type: Object,
      default: () => {
      }
    },
    selectResourceCallback: {
      type: Function,
      default: () => {
      }
    },
    resourceList: {
      type: Array,
      default: () => []
    },
    plugins: {
      type: Array,
      default: () => []
    },
    selectedItem: {
      type: Object,
      default: () => {
      }
    }
  },
  methods: {
    getPageTitle() {
      const nameParts = [];
      if (this.toolbarTitle) {
        nameParts.push(this.toolbarTitle);
      }
      const selectedItemName = this.getSelectedItemName();
      if (selectedItemName) {
        nameParts.push(selectedItemName);
      }
      return _.join(nameParts, " - ");
    },
    getSelectedItemName() {
      if (_.get(this.selectedItem, "displayname", false)) {
        return TranslateService$4.get(this.selectedItem.displayname);
      }
      return _.get(this.selectedItem, "name", false);
    }
  }
};
var _sfc_render$x = function render5() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "nav-bar-wrapper" }, [_c(__unplugin_components_0$2, { staticClass: "nav-bar", class: _vm.localeClass, attrs: { "min-width": "100%", "width": "100%" } }, [_c(VToolbarTitle, [_vm._v(_vm._s(_vm.getPageTitle()))]), _c(__unplugin_components_3$1), _c("resource-list", { attrs: { "select-resource-callback": _vm.selectResourceCallback, "resource-list": _vm.resourceList, "plugins": _vm.plugins, "selected-item": _vm.selectedItem } }), _c(__unplugin_components_3$1), _vm.config ? _c("system-info", { attrs: { "config": _vm.config } }) : _vm._e()], 1)], 1);
};
var _sfc_staticRenderFns$x = [];
var __component__$x = /* @__PURE__ */ normalizeComponent(
  _sfc_main$x,
  _sfc_render$x,
  _sfc_staticRenderFns$x,
  false,
  null,
  null,
  null,
  null
);
const NavBar = __component__$x.exports;
const RecordNameHelper = {
  methods: {
    getName(item) {
      return this.getValue(item, _.first(this.resource.schema), this.resource.displayItem);
    },
    getValue(item, field, template) {
      let displayname = "";
      if (field) {
        if (field.input === "file") {
          const attachment = _(item).get("_attachments", []).find((file) => file._name === field.field);
          displayname = attachment && attachment._filename;
        } else if (field.input === "select") {
          let value = _.get(item, field.field);
          if (_.isString(value)) {
            value = _.find(ResourceService$1.get(field.source), { _id: value });
            if (value) {
              _.each(field.options && field.options.extraSources, (source, field2) => {
                const subId = _.get(value, field2);
                if (_.isString(subId)) {
                  _.set(value, field2, _.find(ResourceService$1.get(source), { _id: subId }));
                }
              });
            }
          }
          if (field.options && field.options.customLabel) {
            displayname = mustache.render(field.options.customLabel, value || {});
          } else {
            displayname = _.get(value, _.chain(value).keys().first().value(), "");
          }
        }
        if (displayname === "") {
          const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised));
          if (isLocalised) {
            displayname = _.get(item, `${this.locale}.${field.field}`);
          } else {
            displayname = _.get(item, field.field);
          }
        }
      }
      if (template) {
        const itemCached = _.clone(item);
        _.each(this.getExtraRessources(), (extraSource, extraField) => {
          const cache = ResourceService$1.get(extraSource);
          if (cache) {
            const value = _.find(cache, { _id: _.get(itemCached, extraField) });
            if (value) {
              _.set(itemCached, extraField, value);
            }
          }
        });
        displayname = mustache.render(template, itemCached);
      }
      return displayname;
    },
    getExtraRessources() {
      return _.extend(_.get(this.resource, "extraSources", {}), _.get(this.resource, "schema[0].options.extraSources"));
    }
  }
};
const RecordList_vue_vue_type_style_index_0_scoped_80947743_lang = "";
const _sfc_main$w = {
  mixins: [RecordNameHelper],
  props: {
    list: {
      type: [Array, Boolean],
      default: () => []
    },
    resource: {
      type: [Object, Boolean],
      default: () => {
      }
    },
    selectedItem: {
      type: Object,
      default: () => {
      }
    },
    locale: {
      type: String,
      default: "enUS"
    },
    multiselect: {
      type: Boolean,
      default: false
    },
    multiselectItems: {
      type: [Array, Boolean],
      default: () => []
    }
  },
  data() {
    return {
      cachedMap: {},
      search: null,
      TranslateService: TranslateService$4,
      sift: {
        isQuery: false,
        isValid: false
      },
      query: {},
      localMultiselectItems: [],
      includes: _.includes
    };
  },
  computed: {
    maxCount() {
      return _.get(this.resource, "maxCount", 0);
    },
    listCount() {
      return _.get(this.list, "length", 0);
    },
    filteredList() {
      let fields = this.getSearchableFields();
      if (fields.length === 0) {
        fields = [_.first(this.resource.schema)];
      }
      _.forEach(this.list, (item) => item._searchable = { id: false, keyFields: false, query: false });
      if (this.sift.isQuery) {
        return _.forEach(this.list.filter(sift(this.query)), (item) => item._searchable.query = true);
      }
      return _.filter(this.list, (item) => {
        if (_.isEmpty(this.search)) {
          return true;
        }
        const values = [];
        _.forEach(fields, (field) => {
          values.push(this.getValue(item, field, this.resource.displayItem));
        });
        let qItems = 0;
        let qValues = 0;
        for (const queryKey in this.query) {
          const queryValue = this.query[queryKey];
          qItems = qItems + 1;
          let value = _.get(item, queryKey);
          if (_.isUndefined(value) === false) {
            if (_.isArray(value)) {
              if (_.includes(value, queryValue)) {
                qValues = qValues + 1;
              }
            } else {
              if (value === queryValue) {
                qValues = qValues + 1;
              }
            }
          }
        }
        let found = false;
        if (qItems > 0 && qItems === qValues) {
          found = true;
          item._searchable.query = true;
        } else if (this.doesMatch(this.search, values)) {
          found = true;
          item._searchable.keyFields = true;
        } else if (new RegExp(this.search, "i").test(item._id)) {
          found = true;
          item._searchable.id = true;
        }
        return found;
      });
    }
  },
  watch: {
    // list: function () {
    //   this.injectDisplayNameToList()
    // },
    search: function() {
      this.query = this.flatten(qs.parse(this.search));
      this.sift.isQuery = false;
      try {
        if (this.search.search("sift:") === 0) {
          this.sift.isQuery = true;
          this.query = lib.parse(this.search.substr(5));
          this.sift.isValid = true;
        }
      } catch (error) {
        this.sift.isValid = false;
        this.query = {};
      }
    },
    multiselectItems() {
      this.localMultiselectItems = _.cloneDeep(this.multiselectItems);
    }
  },
  async mounted() {
  },
  methods: {
    // injectDisplayNameToList () {
    //   _.each(this.list, item => {
    //     item._recordDisplayName = this.getName(item)
    //   })
    // },
    selectAll() {
      if (!this.multiselect) {
        return;
      }
      if (this.localMultiselectItems.length === this.filteredList.length) {
        this.localMultiselectItems = [];
      } else {
        this.localMultiselectItems = this.filteredList;
      }
      this.$emit("changeMultiselectItems", this.localMultiselectItems);
    },
    dive(currentKey, into, target) {
      for (let i in into) {
        if (i in into) {
          let newKey = i;
          let newVal = into[i];
          if (currentKey.length > 0) {
            newKey = currentKey + "." + i;
          }
          if (typeof newVal === "object") {
            this.dive(newKey, newVal, target);
          } else {
            target[newKey] = newVal;
          }
        }
      }
    },
    flatten(arr) {
      let newObj = {};
      this.dive("", arr, newObj);
      return newObj;
    },
    async interactiveSearch(event2) {
      const action = _.get(event2, "srcKey", false);
      const elem = _.get(this.$refs, "['search']", false);
      if (!action || !elem) {
        return;
      }
      return action === "esc" ? elem.blur() : elem.focus();
    },
    select(item) {
      if (this.multiselect) {
        if (_.includes(this.multiselectItems, item)) {
          this.localMultiselectItems = _.difference(this.localMultiselectItems, [item]);
        } else {
          this.localMultiselectItems.push(item);
        }
        this.$emit("changeMultiselectItems", this.localMultiselectItems);
      } else {
        this.$emit("selectItem", item);
      }
    },
    selectTo(item) {
      if (this.multiselect) {
        const start = _.first(this.localMultiselectItems);
        let found = false;
        for (const iterator of this.filteredList) {
          if (iterator === start) {
            this.localMultiselectItems = [iterator];
          }
          if (found === true) {
            this.localMultiselectItems.push(iterator);
          }
          if (iterator === start) {
            found = true;
          }
          if (iterator === item) {
            found = false;
          }
        }
        this.$emit("changeMultiselectItems", this.localMultiselectItems);
      } else {
        this.$emit("selectItem", item);
      }
    },
    onClickMultiselect() {
      this.localMultiselectItems = [];
      this.$emit("changeMultiselectItems", this.localMultiselectItems);
      this.$emit("selectMultiselect", !this.multiselect);
    },
    onClickNew() {
      this.localMultiselectItems = [];
      this.$emit("changeMultiselectItems", this.localMultiselectItems);
      this.$emit("selectMultiselect", false);
      this.$emit("selectItem", { _local: true });
    },
    getSearchableFields() {
      return _.filter(this.resource.schema, (item) => item.searchable === true);
    },
    doesMatch(search, values) {
      let found = false;
      _.forEach(values, (value) => {
        found = new RegExp(this.search, "i").test(value);
        if (found) {
          return false;
        }
      });
      return found;
    }
  }
};
var _sfc_render$w = function render6() {
  var _vm = this, _c = _vm._self._c;
  return _vm.maxCount != 1 ? _c("div", { staticClass: "record-list" }, [_c("div", { staticClass: "top-bar" }, [_c("div", { directives: [{ name: "shortkey", rawName: "v-shortkey", value: { esc: ["esc"], open: ["/"] }, expression: "{esc: ['esc'], open: ['/']}" }], staticClass: "search", class: { "is-query": _vm.sift.isQuery, "is-valid": _vm.sift.isQuery && _vm.sift.isValid == true, "is-invalid": _vm.sift.isQuery && _vm.sift.isValid == false }, on: { "shortkey": _vm.interactiveSearch } }, [_c(__unplugin_components_0$3, { ref: "search", staticClass: "search-bar", attrs: { "flat": "", "outlined": "", "hide-details": "", "dense": "", "placeholder": _vm._f("translate")("TL_SEARCH"), "type": "text", "name": "search" }, model: { value: _vm.search, callback: function($$v) {
    _vm.search = $$v;
  }, expression: "search" } }), _c("div", { staticClass: "multiselect", class: { active: _vm.multiselect }, on: { "click": _vm.onClickMultiselect } }, [_c(__unplugin_components_5, { attrs: { "color": "black" } }, [_vm._v("mdi-list-box")])], 1), _vm.maxCount <= 0 || _vm.listCount < _vm.maxCount ? [_c("div", { staticClass: "new", on: { "click": _vm.onClickNew } }, [_vm._v("+")])] : _vm._e()], 2)]), _c("div", { directives: [{ name: "shortkey", rawName: "v-shortkey", value: _vm.multiselect ? ["ctrl", "a"] : false, expression: "multiselect ? ['ctrl', 'a'] : false" }], staticClass: "records", on: { "shortkey": function($event) {
    return _vm.selectAll();
  } } }, [_c("RecycleScroller", { staticClass: "list", attrs: { "items": _vm.filteredList, "item-size": 80, "key-field": "_id" }, scopedSlots: _vm._u([{ key: "default", fn: function({ item }) {
    return [_c("div", { staticClass: "item", class: { selected: item == _vm.selectedItem || _vm.multiselect && _vm.includes(_vm.multiselectItems, item), frozen: !item._local }, on: { "click": [function($event) {
      if ($event.ctrlKey || $event.shiftKey || $event.altKey || $event.metaKey)
        return null;
      return _vm.select(item);
    }, function($event) {
      if (!$event.shiftKey)
        return null;
      return _vm.selectTo(item);
    }] } }, [item ? _c("div", { staticClass: "main" }, [_c("span", { staticClass: "icon" }, [item._searchable ? _c("span", { staticClass: "searchable" }, [item._searchable.query == true ? _c(__unplugin_components_5, [_vm._v("mdi-target")]) : item._searchable.id == true ? _c(__unplugin_components_5, [_vm._v("mdi-key")]) : item._searchable.keyFields == true ? _c(__unplugin_components_5, [_vm._v("mdi-format-list-bulleted")]) : _c(__unplugin_components_5, { staticClass: "default" }, [_vm._v("mdi-format-list-bulleted")])], 1) : _vm._e()]), _c("span", [_vm._v(" " + _vm._s(_vm.getName(item)) + " ")])]) : _vm._e(), _c("div", { staticClass: "meta" }, [_c("span", { staticClass: "id ng-binding" }, [_c("span", [_vm._v(_vm._s(item._id))])]), _c("span", { staticClass: "ts" }, [_vm._v(" " + _vm._s(_vm._f("translate")("TL_UPDATED")) + " "), _c("timeago", { attrs: { "since": item._updatedAt, "locale": _vm.TranslateService.locale } })], 1)])])];
  } }], null, false, 1004161279) })], 1)]) : _vm._e();
};
var _sfc_staticRenderFns$w = [];
var __component__$w = /* @__PURE__ */ normalizeComponent(
  _sfc_main$w,
  _sfc_render$w,
  _sfc_staticRenderFns$w,
  false,
  null,
  "80947743",
  null,
  null
);
const RecordList = __component__$w.exports;
let TranslateService$2;
if (window.TranslateService) {
  TranslateService$2 = window.TranslateService;
} else {
  TranslateService$2 = TranslateService$4;
}
const getKeyLocale = (schema) => {
  const options = {};
  const list = _.get(schema, "model", "").split(".");
  if (_.get(schema, "localised", false)) {
    options.locale = list.shift();
  }
  options.key = list.join(".");
  return options;
};
const validateEmail = (email) => {
  return String(email).toLowerCase().match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};
const validators$1 = {
  url: (u) => {
    try {
      const validUrl = new URL(u);
      return !!validUrl;
    } catch (error) {
      return false;
    }
  },
  number: (n) => _.isNumber(n),
  integer: (n) => _.isNumber(n) && _.isInteger(n),
  double: (n) => _.isNumber(n) && (_.isInteger(n) || n === +n && n !== (n | 0)),
  text: (t) => _.isString(t),
  array: (a) => _.isArray(a),
  email: (e) => validateEmail(e)
};
const messages = {
  fieldIsRequired: TranslateService$2.get("TL_FIELD_IS_REQUIRED"),
  invalidFormat: TranslateService$2.get("TL_INVALID_FORMAT")
};
const checkNumber = (field, value, model, type) => {
  if (_.get(field, "required", false) && !_.isNumber(value)) {
    return messages.fieldIsRequired;
  }
  const func = _.get(validators$1, type, false);
  if (func) {
    return func(Number(value || 0), field, model, messages);
  }
  console.error(`checkNumber - No validator found for type '${type}'`);
  return false;
};
const customValidators = {
  array: (a) => _.isArray(a),
  email: (e) => new RegExp("/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/").test(e),
  text: (value, field, model) => {
    if (_.get(field, "required", false) && (!_.isString(value) || _.isEmpty(value))) {
      return messages.fieldIsRequired;
    }
    const locale = _.head(_.get(field, "model", "").split("."));
    if (_.get(field, "regex.value", false) === false && _.get(field, `regex['${locale}'].value`, false) === false) {
      return true;
    }
    let regexText = false;
    let regexDescription = false;
    if (field.localised && locale) {
      regexText = _.get(field, `regex['${locale}'].value`, false);
      regexDescription = _.get(field, `regex['${locale}'].description`, false);
    }
    if (regexText === false) {
      regexText = _.get(field, "regex.value", false);
      regexDescription = _.get(field, "regex.description", false);
    }
    if (regexDescription === false) {
      regexDescription = regexText;
    }
    if (regexText && _.isString(regexText)) {
      const fragments = regexText.match(/\/(.*?)\/([gimy])?$/);
      const regex = new RegExp(fragments[1], fragments[2] || "");
      if (!regex.test(value)) {
        return `${messages.invalidFormat} (${TranslateService$2.get(regexDescription)})`;
      }
    }
    return true;
  },
  number: (value, field, model) => checkNumber(field, value, model, "number"),
  double: (value, field, model) => checkNumber(field, value, model, "double"),
  integer: (value, field, model) => {
    if (_.isUndefined(value)) {
      value = "";
    }
    if (value.toString().indexOf(".") !== -1) {
      return false;
    }
    return checkNumber(field, value, model, "integer");
  },
  image: (value, field, model) => {
    const { key, locale } = getKeyLocale(field);
    const attachment = _.find(_.get(model, "_attachments", []), (item) => {
      if (item._name !== key || locale && item._fields.locale !== locale) {
        return false;
      }
      return true;
    });
    if (_.get(field, "required", false) && !attachment) {
      return messages.fieldIsRequired;
    }
    return true;
  },
  file: (value, field, model) => {
    const { key, locale } = getKeyLocale(field);
    const attachment = _.find(_.get(model, "_attachments", []), (item) => {
      if (item._name !== key || locale && item._fields.locale !== locale) {
        return false;
      }
      return true;
    });
    if (_.get(field, "required", false) && !attachment) {
      return messages.fieldIsRequired;
    }
    return true;
  },
  select: (value, field, model) => {
    return _.get(field, "required", false) && _.isEmpty(value) ? messages.fieldIsRequired : true;
  }
};
let typeMapper = {
  string: {
    type: "input",
    overrideType: "CustomInput",
    validator: customValidators.text
  },
  text: {
    type: "textarea",
    overrideType: "CustomTextarea",
    rows: 5,
    validator: customValidators.text
  },
  password: {
    type: "input",
    inputFieldType: "password",
    overrideType: "CustomInput"
  },
  email: {
    type: "input",
    overrideType: "CustomInput",
    inputFieldType: "email",
    validator: validators$1.email
  },
  url: {
    type: "input",
    overrideType: "CustomInput",
    validator: validators$1.url
  },
  number: {
    type: "input",
    overrideType: "CustomInput",
    inputFieldType: "number",
    validator: customValidators.number
  },
  double: {
    type: "input",
    overrideType: "CustomInput",
    inputFieldType: "number",
    validator: customValidators.double
  },
  integer: {
    type: "input",
    overrideType: "CustomInput",
    inputFieldType: "number",
    validator: customValidators.integer
  },
  checkbox: {
    type: "switch",
    overrideType: "CustomSwitch"
  },
  date: {
    type: "CustomDatetimePicker",
    format: "YYYY-MM-DD",
    customDatetimePickerOptions: {
      format: "YYYY-MM-DD"
    }
  },
  time: {
    type: "CustomDatetimePicker",
    format: "hh:mm:ss a",
    customDatetimePickerOptions: {
      format: "hh:mm:ss a"
    }
  },
  datetime: {
    type: "CustomDatetimePicker",
    format: "YYYY-MM-DD hh:mm:ss a",
    customDatetimePickerOptions: {
      format: "YYYY-MM-DD hh:mm:ss a"
    }
  },
  pillbox: {
    type: "CustomInputTag",
    selectOptions: {
      taggable: true,
      multiple: true,
      searchable: true,
      onNewTag(newTag, id, options, value) {
        options.push(newTag);
        value.push(newTag);
      }
    },
    values: [],
    validator: validators$1.array
  },
  select: {
    type: "CustomMultiSelect",
    selectOptions: {
      multiple: false,
      trackBy: "_id",
      customLabel: (item, labelProp) => {
        return _.get(labelProp, item, item);
      },
      searchable: true
    },
    validator: customValidators.select
  },
  multiselect: {
    type: "CustomChecklist",
    validator: validators$1.array
  },
  json: {
    type: "TreeView",
    overrideType: "CustomTreeView",
    treeViewOptions: {
      maxDepth: 4,
      rootObjectKey: "root",
      modifiable: false
    }
  },
  code: {
    type: "Code",
    overrideType: "CustomCode",
    options: {}
  },
  wysiwyg: {
    type: "Wysiwyg",
    overrideType: "WysiwygField"
  },
  image: {
    type: "ImageView",
    validator: customValidators.image
  },
  file: {
    type: "AttachmentView",
    validator: customValidators.file
  },
  paragraph: {
    type: "ParagraphView"
  },
  group: {
    type: "group",
    overrideType: "Group"
  },
  object: {
    type: "JsonEditor"
  },
  color: {
    type: "ColorPicker",
    colorPickerOptions: {}
  },
  paragraphImage: {
    type: "paragraphAttachmentView",
    overrideType: "ParagraphAttachmentView",
    fileType: "image",
    validator: customValidators.image
  },
  paragraphFile: {
    type: "paragraphAttachmentView",
    overrideType: "ParagraphAttachmentView",
    validator: customValidators.file
  }
};
_.each(typeMapper, (type) => {
  type.dense = true;
  type.outlined = true;
});
class FormService {
  constructor() {
    this.typeMapper = typeMapper;
  }
  getKeyLocale(schema) {
    return getKeyLocale(schema);
  }
}
const FormService$1 = new FormService();
let TranslateService$1;
if (window.TranslateService) {
  TranslateService$1 = window.TranslateService;
} else {
  TranslateService$1 = TranslateService$4;
}
class SchemaService {
  constructor() {
    this.typeMapper = FormService$1.typeMapper;
  }
  getSchemaFields(schema, resource, locale, userLocale, disabled, extraSources, rootView) {
    let fields = _.map(schema, (field) => {
      const isLocalised = resource.locales && (field.localised || _.isUndefined(field.localised));
      const name = field.label && TranslateService$1.get(field.label);
      let schema2 = _.extend({}, this.typeMapper[field.input], {
        label: `${name || field.field}${isLocalised ? ` (${TranslateService$1.get(`TL_${locale.toUpperCase()}`)})` : ""}`,
        model: isLocalised ? `${locale}.${field.field}` : field.field,
        originalModel: field.field,
        placeholder: `${name || field.field}${isLocalised ? ` (${TranslateService$1.get(`TL_${locale.toUpperCase()}`)})` : ""}`,
        disabled: disabled || _.get(field, "options.disabled", false),
        readonly: _.get(field, "options.readonly", false),
        required: !!field.required,
        options: field.options,
        resource,
        locale,
        userLocale,
        rootView
      });
      schema2 = _.merge({}, field.options, schema2);
      if (field.input === "file" && _.get(schema2, "maxCount", false) === false) {
        schema2.maxCount = Infinity;
      } else if (field.input === "select" && _.get(schema2, "labels", false)) {
        schema2.selectOptions.label = _.map(schema2.labels, (label, value) => {
          return { value, text: _.get(label, `${locale}`, label) };
        });
      } else if (field.input === "multiselect" && _.get(schema2, "labels", false)) {
        if (!_.isObject(_.first(field.source))) {
          const values = [];
          _.forEach(field.source, (value) => {
            values.push({
              text: _.get(schema2, `labels.${value}`, value),
              value
            });
          });
          field.source = values;
        }
      }
      if (field.input === "select" || field.input === "pillbox") {
        schema2.selectOptions.selectLabel = TranslateService$1.get("TL_MULTISELECT_SELECT_LABEL");
        schema2.selectOptions.selectGroupLabel = TranslateService$1.get("TL_MULTISELECT_SELECT_GROUP_LABEL");
        schema2.selectOptions.selectedLabel = TranslateService$1.get("TL_MULTISELECT_SELECTED_LABEL");
        schema2.selectOptions.deselectLabel = TranslateService$1.get("TL_MULTISELECT_DESELECT_LABEL");
        schema2.selectOptions.deselectGroupLabel = TranslateService$1.get("TL_MULTISELECT_DESELECT_GROUP_LABEL");
        schema2.selectOptions.tagPlaceholder = TranslateService$1.get("TL_MULTISELECT_TAG_PLACEHOLDER");
      }
      return schema2;
    });
    for (const id in schema) {
      const field = schema[id];
      if (_.isArray(field.source)) {
        fields[id].values = field.source;
      } else if (_.isString(field.source)) {
        this.updateFieldSchema(fields, field, id, locale, extraSources);
      }
      fields[id].localised = resource.locales && (field.localised || _.isUndefined(field.localised));
    }
    return fields;
  }
  updateFieldSchema(fields, field, id, locale, extraSources) {
    const cachedData = ResourceService$1.get(field.source);
    extraSources = _.extend({}, extraSources, _.get(field, "options.extraSources"));
    _.each(extraSources, (source, key2) => {
      const list = ResourceService$1.get(source);
      _.each(cachedData, (item) => {
        const value = _.get(item, key2);
        if (_.isString(value)) {
          _.set(item, key2, _.find(list, { _id: value }));
        }
      });
    });
    const relatedSchema = ResourceService$1.getSchema(field.source);
    const firstField = relatedSchema && _.first(relatedSchema.schema);
    let key = "_id";
    if (firstField) {
      key = firstField.field;
      if (relatedSchema.locales && locale && (firstField.localised || _.isUndefined(firstField.localised))) {
        key = `${locale}.${key}`;
      }
    }
    fields[id].values = cachedData || [];
    if (fields[id].type === "CustomMultiSelect") {
      fields[id].selectOptions = fields[id].selectOptions || {};
      fields[id].selectOptions = _.clone(fields[id].selectOptions);
      fields[id].selectOptions.key = "_id";
      fields[id].selectOptions.customLabel = (itemId) => {
        const item = _.isString(itemId) ? _.find(cachedData, { _id: itemId }) : itemId;
        if (fields[id].customLabel) {
          return mustache.render(fields[id].customLabel, item);
        } else {
          return _.get(item, key);
        }
      };
    } else if (fields[id].type === "CustomChecklist") {
      fields[id].customChecklistOptions = fields[id].customChecklistOptions || {};
      fields[id].customChecklistOptions.name = key;
      fields[id].customChecklistOptions.value = "_id";
    }
  }
  getKeyLocale(schema) {
    return FormService$1.getKeyLocale(schema);
  }
  getNestedGroups(resource, fields, level, path, prefix) {
    let groups = _.groupBy(fields, (item) => {
      let list = item.originalModel;
      if (prefix) {
        list = list.replace(prefix, "");
      }
      list = list.split(".");
      return list[level];
    });
    groups = _.map(groups, (list, key) => {
      if (_.uniqBy(list, "originalModel").length === 1) {
        const value = _.first(list);
        if (list.length > 1) {
          console.warn(`duplicated field '${value.model}' detected in resource '${resource.displayname || resource.title}'`);
        }
        return value;
      }
      let currentPath = `${path}.${key}`;
      if (_.isUndefined(path)) {
        currentPath = key;
      }
      let label = _.get(resource, `groups.${currentPath}.label`, key);
      label = TranslateService$1.get(label);
      return _.extend({}, this.typeMapper.group, {
        label,
        key,
        path,
        groupOptions: {
          fields: this.getNestedGroups(resource, list, level + 1, path, prefix)
        }
      });
    });
    return groups;
  }
}
const SchemaService$1 = new SchemaService();
const TranslateService2 = window.TranslateService || TranslateService$4;
const AbstractEditorView = {
  mixins: [Notification],
  methods: {
    async uploadAttachments(id, attachments) {
      this.$loading.start("uploadAttachments");
      try {
        for (const attachment of attachments) {
          const data = new FormData();
          data.append(attachment._name, attachment.file);
          if (attachment._fields.locale) {
            data.append("locale", attachment._fields.locale);
          }
          if (attachment._filename) {
            data.append("_filename", attachment._filename);
          }
          if (attachment._fields.fileItemId) {
            data.append("fileItemId", attachment._fields.fileItemId);
          }
          if (_.get(attachment, "cropOptions", false)) {
            console.warn("detected cropOptions, will add it to the request");
            data.append("cropOptions", JSON.stringify(attachment.cropOptions));
          }
          if (_.get(attachment, "orderUpdated", false) && _.get(attachment, "order", false)) {
            data.append("order", attachment.order);
          }
          await axios$1.post(`../api/${this.resource.title}/${id}/attachments`, data);
        }
      } catch (error) {
        console.error("Error happen during uploadAttachments:", error);
      }
      this.$loading.stop("uploadAttachments");
    },
    async updateAttachments(id, attachments) {
      this.$loading.start("updateAttachments");
      try {
        for (const [i, attachment] of attachments.entries()) {
          const cropOptions = _.omit(_.get(attachment, "cropOptions", {}), ["updated"]);
          const order = _.get(attachment, "order", i + 1);
          await axios$1.put(`../api/${this.resource.title}/${id}/attachments/${attachment._id}`, { cropOptions, order });
        }
      } catch (error) {
        console.error("Error happen during updateAttachments:", error);
      }
      this.$loading.stop("updateAttachments");
    },
    async removeAttachments(id, attachments) {
      this.$loading.start("remove-attachments");
      try {
        for (const attachment of attachments) {
          await axios$1.delete(`../api/${this.resource.title}/${id}/attachments/${attachment._id}`);
        }
      } catch (error) {
        console.error("Error happen during removeAttachments:", error);
      }
      this.$loading.stop("remove-attachments");
    },
    getTypePrexix(type) {
      let typePrefix = false;
      if (type === "create") {
        typePrefix = "TL_ERROR_ON_RECORD_CREATION";
      } else if (type === "update") {
        typePrefix = "TL_ERROR_ON_RECORD_UPDATE";
      } else if (type === "delete") {
        typePrefix = "TL_ERROR_ON_RECORD_DELETE";
      }
      return typePrefix ? TranslateService2.get(typePrefix) : "Error";
    },
    manageError(error, type, record) {
      let typePrefix = this.getTypePrexix(type);
      let errorMessage = typePrefix;
      if (_.get(error, "response.data.code", 500) === 400) {
        const serverError = _.get(error, "response.data");
        if (_.get(serverError, "message", false)) {
          errorMessage = `${typePrefix}: ${serverError.message}`;
        } else {
          errorMessage = `${typePrefix}: ${TranslateService2.get("TL_UNKNOWN_ERROR")}`;
        }
      }
      console.error(errorMessage, record);
      this.notify(errorMessage, "error");
    },
    async updateSchema() {
      try {
        const disabled = !(this.record && this.record._local);
        this.$loading.start("loading-schema");
        const fields = SchemaService$1.getSchemaFields(this.resource.schema, this.resource, this.locale || this.userLocale, this.userLocale, disabled, this.resource.extraSources);
        this.$loading.stop("loading-schema");
        const groups = SchemaService$1.getNestedGroups(this.resource, fields, 0);
        this.schema.fields = groups;
        this.originalFieldList = fields;
      } catch (error) {
        console.error("AbstractEditorView - updateSchema - Error happen during updateSchema:", error);
      }
    }
  }
};
const _sfc_main$v = {
  mixins: [AbstractEditorView, Notification],
  props: {
    resourceList: {
      type: [Array, Boolean],
      default: () => []
    },
    resource: {
      type: Object,
      default: () => {
      }
    },
    record: {
      type: Object,
      default: () => {
      }
    },
    locale: {
      type: String,
      default: () => "enUS"
    },
    userLocale: {
      type: String,
      default: () => "enUS"
    }
  },
  data() {
    return {
      formValid: false,
      fileInputTypes: ["file", "img", "image", "imageView", "attachmentView"],
      cachedMap: {},
      editingRecord: {},
      activeLocale: _.indexOf(this.resource.locales, this.locale),
      originalFieldList: [],
      schema: { fields: [] },
      isReady: false,
      formOptions: {
        validateAfterLoad: true,
        validateAfterChanged: true
      },
      // TODO: hugo - LATER -  put the formatting in the resource's definition to allow custom layout
      rowOptions: { justify: "start", align: "start", noGutters: false }
    };
  },
  watch: {
    async locale() {
      await this.updateSchema();
      this.editingRecord = _.clone(this.editingRecord);
      this.activeLocale = _.indexOf(this.resource.locales, this.locale);
      this.checkDirty();
    },
    async record() {
      await this.updateSchema();
      this.cloneEditingRecord();
    },
    async userLocale() {
      await this.updateSchema();
      this.editingRecord = _.clone(this.editingRecord);
      this.checkDirty();
    },
    model() {
      console.warn("MODEL CHANGED: ", this.model);
    }
  },
  async mounted() {
    await this.updateSchema();
    this.cloneEditingRecord();
    this.isReady = true;
    console.warn("EDITING RECORD - ", this.editingRecord);
  },
  methods: {
    back() {
      this.$emit("back");
    },
    onError(error) {
      console.log(999, "error", error);
    },
    selectLocale(item) {
      this.activeLocale = _.indexOf(this.resource.locales, item);
      this.$emit("update:locale", item);
    },
    cloneEditingRecord() {
      const dummy = {};
      _.each(this.resource.schema, (field) => {
        if (_.includes(this.fileInputTypes, field.input)) {
          return;
        }
        const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised));
        if (isLocalised) {
          _.each(this.resource.locales, (locale) => {
            const fieldName = `${locale}.${field.field}`;
            let value = _.get(this.record, fieldName);
            if (field.input === "pillbox") {
              value = value || [];
            } else if (field.input === "json") {
              value = value || {};
            }
            if (_.isPlainObject(value)) {
              value = _.cloneDeep(value);
            }
            _.set(dummy, fieldName, value);
          });
        } else {
          const fieldName = field.field;
          let value = _.get(this.record, fieldName);
          if (field.input === "pillbox") {
            value = value || [];
          }
          if (field.input === "json") {
            value = value || {};
          }
          if (_.isPlainObject(value)) {
            value = _.cloneDeep(value);
          }
          _.set(dummy, fieldName, value);
        }
      });
      this.editingRecord = _.clone(dummy);
      this.editingRecord._id = this.record._id;
      try {
        this.editingRecord._attachments = _.cloneDeep(this.record._attachments || []);
      } catch (error) {
        console.error("Error during cloneEditingRecord:", error);
        this.editingRecord._attachments = [];
      }
      this.removeDirtyFlags();
    },
    async deleteRecord() {
      if (!window.confirm(
        TranslateService$4.get("TL_ARE_YOU_SURE_TO_DELETE"),
        TranslateService$4.get("TL_YES"),
        TranslateService$4.get("TL_NO")
      )) {
        return;
      }
      if (_.isUndefined(this.editingRecord._id)) {
        this.editingRecord = {};
        this.$emit("update:record", null);
      } else {
        this.$loading.start("delete-record");
        try {
          await axios$1.delete(`../api/${this.resource.title}/${this.editingRecord._id}`);
          this.notify(TranslateService$4.get("TL_RECORD_DELETED", null, { id: this.editingRecord._id }));
          this.$emit("updateRecordList", null);
        } catch (error) {
          console.error("Error happen during deleteRecord:", error);
          this.manageError(error, "delete", this.editingRecord);
        }
        this.$loading.stop("delete-record");
      }
    },
    checkFormValid() {
      let formValid = false;
      try {
        formValid = this.$refs.vfg.validate();
      } catch (error) {
        console.error("Not valid: ", error);
        formValid = false;
      }
      const firstInvalidField = _.find(this.$refs.vfg.inputs, (input) => !input.valid);
      if (!_.isUndefined(firstInvalidField)) {
        formValid = false;
        firstInvalidField.focus();
      }
      this.formValid = formValid;
      if (!this.formValid) {
        const notificationText = this.editingRecord._id ? TranslateService$4.get("TL_ERROR_CREATING_RECORD_ID", null, { id: this.editingRecord._id }) : TranslateService$4.get("TL_ERROR_CREATING_RECORD");
        this.notify(notificationText, "error");
      }
    },
    fieldValueOrDefault(field, value) {
      if (field.input === "pillbox") {
        return value || [];
      } else if (field.input === "json") {
        return value || {};
      }
      return value;
    },
    updateLocalisedField(uploadObject, field) {
      _.each(this.resource.locales, (locale) => {
        if (!this.formValid) {
          return this.handleFormNotValid();
        }
        const fieldName = `${locale}.${field.field}`;
        const value = this.fieldValueOrDefault(field, _.get(this.editingRecord, fieldName));
        if (locale !== this.locale && field.required && (_.isUndefined(value) || field.input === "string" && value.length === 0)) {
          this.selectLocale(locale);
          this.formValid = false;
          this.$forceUpdate();
          this.$nextTick(() => {
            this.checkFormValid();
          });
          console.warn("required field empty", field, this.formValid);
          return;
        }
        if (!_.isEqual(value, _.get(this.record, fieldName))) {
          _.set(uploadObject, fieldName, value);
        }
      });
    },
    handleFormNotValid() {
      console.info("form not valid");
    },
    async createUpdateClicked() {
      this.checkFormValid();
      if (!this.formValid) {
        return this.handleFormNotValid();
      }
      const uploadObject = {};
      _.each(this.resource.schema, (field) => {
        if (!this.formValid || _.includes(this.fileInputTypes, field.input)) {
          return;
        }
        const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised));
        if (isLocalised) {
          this.updateLocalisedField(uploadObject, field);
        } else {
          const fieldName = field.field;
          const value = this.fieldValueOrDefault(field, _.get(this.editingRecord, fieldName));
          if (!_.isEqual(value, _.get(this.record, fieldName))) {
            _.set(uploadObject, fieldName, value);
          }
        }
      });
      const newAttachments = _.filter(this.editingRecord._attachments, (item) => !item._id);
      if (!_.isEmpty(newAttachments)) {
        console.warn("NEW ATTACHMENTS = ", newAttachments);
      }
      if (!this.formValid) {
        return this.handleFormNotValid();
      }
      if (_.isUndefined(this.editingRecord._id)) {
        return this.createRecord(uploadObject, newAttachments);
      }
      this.updateRecord(uploadObject, newAttachments);
    },
    async createRecord(uploadObject, newAttachments) {
      this.$loading.start("create-record");
      try {
        const { data } = await axios$1.post(`../api/${this.resource.title}`, uploadObject);
        await this.uploadAttachments(data._id, newAttachments);
        this.notify(TranslateService$4.get("TL_RECORD_CREATED", null, { id: data._id }));
        this.$emit("updateRecordList", data);
      } catch (error) {
        console.error("Error happen during createRecord:", error);
        this.manageError(error, "create");
      }
      this.$loading.stop("create-record");
    },
    async updateRecord(uploadObject, newAttachments) {
      this.$loading.start("update-record");
      try {
        let data = this.editingRecord;
        console.warn("Will send", uploadObject);
        if (!_.isEmpty(uploadObject)) {
          const response = await axios$1.put(`../api/${this.resource.title}/${this.editingRecord._id}`, uploadObject);
          data = response.data;
        }
        await this.uploadAttachments(data._id, newAttachments);
        const newAttachmentsIds = _.map(newAttachments, "_id");
        const updatedAttachments = _.filter(this.editingRecord._attachments, (item) => {
          return item._id && !_.includes(newAttachmentsIds, item._id) && (_.get(item, "cropOptions.updated", false) || _.get(item, "orderUpdated", false));
        });
        if (!_.isEmpty(updatedAttachments)) {
          console.warn("UPDATED ATTACHMENTS = ", _.map(updatedAttachments, (a) => `${a.orderUpdated}-${a.order}-${a._filename}`));
          await this.updateAttachments(data._id, updatedAttachments);
        }
        const removedAttachments = _.filter(this.record._attachments, (item) => !_.find(this.editingRecord._attachments, { _id: item._id }));
        if (!_.isEmpty(removedAttachments)) {
          console.warn("REMOVED ATTACHMENTS = ", _.map(removedAttachments, (a) => `${a.order}-${a._filename}`));
          await this.removeAttachments(data._id, removedAttachments);
        }
        this.notify(TranslateService$4.get("TL_RECORD_UPDATED", null, { id: this.editingRecord._id }));
        this.$emit("updateRecordList", data);
      } catch (error) {
        console.error("Error happen during updateRecord:", error);
        this.manageError(error, "update", this.editingRecord);
      }
      this.$loading.stop("update-record");
    },
    getAttachmentModel(attachment) {
      const modelParts = [];
      if (_.get(attachment, "_fields.locale", false)) {
        modelParts.push(attachment._fields.locale);
      }
      modelParts.push(attachment._name);
      return _.join(modelParts, ".");
    },
    updateFields(value, model) {
      if (!this.isAttachmentField(model)) {
        return _.set(this.editingRecord, model, value);
      }
      _.set(this.editingRecord, "_attachments", value);
      console.info(`Will update attachment ${model}`, value);
    },
    onModelUpdated(value, model) {
      this.updateFields(value, model);
      console.info("editingRecord =", this.editingRecord);
      this.$refs.vfg.validate();
      this.checkDirty();
    },
    isAttachmentField(model) {
      const foundField = _.get(_.find(_.get(this.schema, "fields", []), { model }), "originalModel", false);
      const fieldType = _.get(_.find(this.resource.schema, { field: foundField }), "input", false);
      return _.includes(this.fileInputTypes, fieldType);
    },
    checkDirty() {
      _.each(this.originalFieldList, (field) => {
        let isEqual = true;
        if (_.includes(["AttachmentView", "ImageView"], field.type)) {
          const { key, locale } = this.getKeyLocale(field);
          const list1 = _.filter(this.record._attachments, (attachment) => attachment._name === key && (attachment._fields && attachment._fields.locale) === locale);
          const list2 = _.filter(this.editingRecord._attachments, (attachment) => attachment._name === key && (attachment._fields && attachment._fields.locale) === locale);
          isEqual = _.isEqual(list1, list2);
        } else {
          isEqual = _.isEqual(_.get(this.record, field.model), _.get(this.editingRecord, field.model));
        }
        field.labelClasses = isEqual ? "" : "dirty";
      });
    },
    removeDirtyFlags() {
      _.each(this.originalFieldList, (field) => {
        delete field.labelClasses;
      });
    },
    getKeyLocale(schema) {
      const options = {};
      const list = schema.model.split(".");
      if (schema.localised) {
        options.locale = list.shift();
      }
      options.key = list.join(".");
      return options;
    }
  }
};
var _sfc_render$v = function render7() {
  var _vm = this, _c = _vm._self._c;
  return _vm.record ? _c("div", { staticClass: "record-editor", class: { frozen: !_vm.record._local } }, [_c(__unplugin_components_0$4, { directives: [{ name: "show", rawName: "v-show", value: _vm.resource.locales, expression: "resource.locales" }], attrs: { "fixed-tabs": "", "background-color": "white", "dark": "", "height": "39", "hide-slider": "" }, model: { value: _vm.activeLocale, callback: function($$v) {
    _vm.activeLocale = $$v;
  }, expression: "activeLocale" } }, _vm._l(_vm.resource.locales, function(item) {
    return _c(__unplugin_components_1$1, { key: item, staticClass: "locale", on: { "click": function($event) {
      return _vm.selectLocale(item);
    } } }, [_vm._v(" " + _vm._s(_vm._f("translate")("TL_" + item.toUpperCase())) + " ")]);
  }), 1), _c(__unplugin_components_2$1, { ref: "vfg", attrs: { "lazy-validation": "" }, model: { value: _vm.formValid, callback: function($$v) {
    _vm.formValid = $$v;
  }, expression: "formValid" } }, [_vm.isReady ? _c("custom-form", { attrs: { "schema": _vm.schema, "form-options": _vm.formOptions, "model": _vm.editingRecord, "row": _vm.rowOptions }, on: { "update:model": function($event) {
    _vm.editingRecord = $event;
  }, "error": _vm.onError, "input": _vm.onModelUpdated } }) : _vm._e()], 1), _c("div", { staticClass: "buttons" }, [_c(__unplugin_components_1, { staticClass: "back", on: { "click": _vm.back } }, [_vm._v(_vm._s(_vm._f("translate")("TL_BACK")))]), _c(__unplugin_components_1, { staticClass: "update", attrs: { "color": "primary" }, on: { "click": _vm.createUpdateClicked } }, [_vm._v(_vm._s(_vm._f("translate")(_vm.editingRecord._id ? "TL_UPDATE" : "TL_CREATE")))]), _c(__unplugin_components_1, { staticClass: "delete", attrs: { "color": "error" }, on: { "click": _vm.deleteRecord } }, [_vm._v(_vm._s(_vm._f("translate")("TL_DELETE")))])], 1)], 1) : _vm._e();
};
var _sfc_staticRenderFns$v = [];
var __component__$v = /* @__PURE__ */ normalizeComponent(
  _sfc_main$v,
  _sfc_render$v,
  _sfc_staticRenderFns$v,
  false,
  null,
  null,
  null,
  null
);
const RecordEditor = __component__$v.exports;
const _sfc_main$u = {
  props: ["resource", "schema", "items", "locale", "options"],
  data() {
    return {
      selectedRecords: [],
      showRecordsSelection: false,
      columns: [],
      sourceData: [],
      tableData: [],
      filteredColumns: [],
      sortOption: {
        multipleSort: true,
        sortAlways: true,
        sortChange: (params) => {
          console.log("sortChange::", _.keys(params), _.values(params));
          this.tableData = _.sortBy(this.tableData, _.keys(params), _.values(params));
        }
      },
      columnHiddenOption: {
        defaultHiddenColumnKeys: ["__RECORD_SELECTION__"]
      },
      clipboardOption: {
        copy: true,
        paste: false,
        cut: false,
        delete: false,
        beforeCopy: ({
          data,
          selectionRangeIndexes,
          selectionRangeKeys
        }) => {
          navigator.clipboard.writeText(this.getDataToCopy(selectionRangeIndexes));
          return false;
        }
      },
      columnWidthResizeOption: {
        enable: true,
        minWidth: 50
      }
    };
  },
  computed: {
    orderedItem() {
      return this.items;
    },
    schemaFields() {
      let fields = this.schema.fields;
      let newFields = [];
      _.forEach(fields, (field) => {
        if (_.get(field, "options.breakdown", false)) {
          _.forEach(this.resource.locales, (locale) => {
            if (field.model === `${locale}.${field.originalModel}`) {
              field.localised = false;
            } else {
              let newField = _.clone(field);
              newField.localised = false;
              const name = field.originalModel && TranslateService$4.get(field.originalModel);
              newField.label = `${name} (${TranslateService$4.get(`TL_${locale.toUpperCase()}`)})`;
              newField.model = `${locale}.${field.originalModel}`;
              newFields.push(newField);
            }
          });
        }
        field.disabled = true;
      });
      fields = fields.concat(newFields);
      let list = _.filter(fields, (item) => _.isNumber(_.get(item, "options.index", false)));
      if (_.isEmpty(list)) {
        return this.schema.fields;
      }
      return _.sortBy(list, (item) => item.options.index);
    }
  },
  watch: {
    items() {
      this.resetRecordsFiltering();
    }
  },
  mounted() {
    this.resetRecordsFiltering();
    this.createTableColumns();
  },
  methods: {
    getDataToCopy(indexes) {
      let startCol = indexes.startColIndex;
      let endCol = indexes.endColIndex;
      if (!this.showRecordsSelection) {
        startCol++;
        endCol++;
      }
      const fieldNames = this.columns.slice(startCol, endCol + 1).map((x) => x.field);
      const dataToCopy = this.tableData.slice(indexes.startRowIndex, indexes.endRowIndex + 1).map((rowData) => {
        return _.map(fieldNames, (fieldName) => {
          return _.get(rowData, fieldName, "");
        });
      });
      let text = "";
      _.each(dataToCopy, (line, i) => {
        if (i !== 0) {
          text += "\n";
        }
        text += line.join("	");
      });
      return text;
    },
    deleteSelectedRecords() {
      this.$emit("remove-records", _.filter(this.sourceData, (row) => _.includes(this.selectedRecords, row._id)));
    },
    toggleSelection() {
      this.showRecordsSelection = !this.showRecordsSelection;
      if (this.showRecordsSelection) {
        return this.$refs["tableRef"].showColumnsByKeys(["__RECORD_SELECTION__"]);
      }
      return this.$refs["tableRef"].hideColumnsByKeys(["__RECORD_SELECTION__"]);
    },
    resetRecordsFiltering() {
      this.sourceData = this.orderedItem;
      this.tableData = this.sourceData.slice(0);
    },
    createTableColumns() {
      const columns = [{
        field: "__RECORD_SELECTION__",
        key: "__RECORD_SELECTION__",
        title: TranslateService$4.get("TL_RECORD_SELECTION"),
        fixed: "left",
        align: "center",
        disableResizing: true,
        width: 50,
        renderBodyCell: ({
          row,
          column,
          rowIndex
        }, h2) => {
          return h2("TableRecordSelection", {
            props: {
              row,
              selected: this.isRecordSelected(row),
              onChange: this.onSelectRecord
            }
          });
        }
      }];
      _.each(this.schemaFields, (field, key) => {
        const fieldType = this.getFieldType(field);
        const tableFieldType = "Table" + fieldType;
        const column = {
          field: field.model,
          key: "a" + key,
          title: field.label,
          ellipsis: {
            showTitle: true,
            lineClamp: _.get(field, "options.lineClamp", 1)
          },
          // width: _.get(field, 'options.width', 50),
          renderBodyCell: ({
            row,
            column: column2,
            rowIndex
          }, h2) => {
            if (_.includes(["CustomInput", "CustomMultiSelect"], fieldType)) {
              return _.get(row, column2.field, "");
            }
            if (!(tableFieldType in Vue.options.components)) {
              console.error(`${tableFieldType} isn't defined as a custom field type, will not render it`);
              return _.get(row, column2.field, "");
            }
            return h2(tableFieldType, {
              props: {
                row,
                column: column2,
                rowIndex,
                field
              }
            });
          }
        };
        if (_.get(field, "options.filter", false)) {
          column.filter = {
            filterList: _.uniqBy(_.map(this.sourceData, (item, i) => {
              return {
                value: i,
                label: field.type === "switch" ? TranslateService$4.get("TL_" + _.toUpper(_.get(item, field.model, false))) : _.get(item, field.model),
                realValue: _.get(item, field.model),
                selected: false
              };
            }), "label"),
            isMultiple: _.get(field, "options.filter", false) === "multiple",
            // filter confirm hook
            filterConfirm: (filterList) => {
              const items = filterList.filter((x) => x.selected).map((x) => x.realValue);
              this.searchBy(items, field.model);
              if (!_.includes(this.filteredColumns, column.field)) {
                this.filteredColumns.push(column.field);
              }
            },
            // filter reset hook
            filterReset: (filterList) => {
              this.searchBy([], field.model);
              this.filteredColumns = _.filter(this.filteredColumns, column.field);
            },
            filterIcon: () => {
              if (_.includes(this.filteredColumns, column.field)) {
                return h(__unplugin_components_5, ["mdi-filter"]);
              }
              return h(__unplugin_components_5, ["mdi-filter-outline"]);
            },
            // max height
            maxHeight: 200
          };
        }
        _.each(["sortBy", "align"], (key2) => {
          const val = _.get(field, `options.${key2}`, false);
          if (val !== false) {
            _.set(column, key2, val);
          }
        });
        columns.push(column);
      });
      columns.push({
        field: "__ACTIONS__",
        key: "__ACTIONS__",
        title: TranslateService$4.get("TL_ACTIONS"),
        fixed: "right",
        disableResizing: true,
        width: 180,
        renderBodyCell: ({
          row,
          column,
          rowIndex
        }, h2) => {
          return h2("TableRowActions", {
            props: {
              row,
              column,
              rowIndex,
              remove: (row2) => {
                this.$emit("remove", row2);
              },
              edit: (row2) => {
                this.$emit("edit", row2);
              }
            }
          });
        }
      });
      this.columns = columns;
    },
    isRecordSelected(record) {
      return _.includes(this.selectedRecords, _.get(record, "_id", false));
    },
    onSelectRecord(val, rowId) {
      if (val) {
        this.selectedRecords.push(rowId);
      } else {
        this.selectedRecords = _.filter(this.selectedRecords, (id) => id !== rowId);
      }
      console.warn("this.selectedRecords = ", this.selectedRecords);
    },
    searchBy(items, fieldKey) {
      this.tableData = this.sourceData.filter((x) => items.length === 0 || items.includes(_.get(x, fieldKey)));
    },
    editRow(row) {
      console.warn("editRow", row);
    },
    getFieldType(field) {
      return _.get(field, "overrideType", _.get(field, "type", false));
    }
  }
};
const VueTableGenerator_vue_vue_type_style_index_0_scoped_8ab39179_lang = "";
var _sfc_render$u = function render8() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { ref: "excel-container", staticClass: "vue-table-generator vue-form-generator table" }, [_c("div", { attrs: { "id": "table-top" } }, [_c(__unplugin_components_1, { on: { "click": function($event) {
    return _vm.toggleSelection();
  } } }, [_vm._v(_vm._s(_vm._f("translate")(`TL_${_vm.showRecordsSelection ? "HIDE" : "SHOW"}_RECORD_SELECTION`)))]), _vm.selectedRecords.length > 0 ? _c(__unplugin_components_1, { attrs: { "color": "node-cms-red" }, on: { "click": function($event) {
    return _vm.deleteSelectedRecords();
  } } }, [_vm._v(_vm._s(_vm._f("translate")(`TL_DELETE_SELECTED_RECORDS`)))]) : _vm._e()], 1), _c("ve-table", { ref: "tableRef", attrs: { "scroll-width": "0", "sort-option": _vm.sortOption, "virtual-scroll-option": { enable: true }, "column-width-resize-option": _vm.columnWidthResizeOption, "columns": _vm.columns, "table-data": _vm.tableData, "fixed-header": true, "border-around": true, "border-x": true, "border-y": true, "clipboard-option": _vm.clipboardOption, "column-hidden-option": _vm.columnHiddenOption, "max-height": "100%", "row-key-field-name": "_id" } }), _c("div", { directives: [{ name: "show", rawName: "v-show", value: _vm.tableData.length === 0, expression: "tableData.length === 0" }], staticClass: "empty-data" }, [_vm._v(_vm._s(_vm._f("translate")("TL_NO_DATA_FOUND")))])], 1);
};
var _sfc_staticRenderFns$u = [];
var __component__$u = /* @__PURE__ */ normalizeComponent(
  _sfc_main$u,
  _sfc_render$u,
  _sfc_staticRenderFns$u,
  false,
  null,
  "8ab39179",
  null,
  null
);
const VueTableGenerator = __component__$u.exports;
const _sfc_main$t = {
  components: {
    VueTableGenerator,
    RecordEditor
    // Paginate
  },
  mixins: [AbstractEditorView, Notification],
  props: {
    resourceList: {
      type: Array,
      default: () => []
    },
    recordList: {
      type: Array,
      default: () => []
    },
    locale: {
      type: String,
      default: "enUS"
    },
    resource: {
      type: Object,
      default: () => {
      }
    },
    record: {
      type: Object,
      default: () => {
      }
    }
  },
  data() {
    return {
      page: 1,
      isReady: false,
      search: null,
      cachedMap: {},
      schema: { fields: [] },
      TranslateService: TranslateService$4,
      localLocale: false,
      localRecord: {},
      clonedRecordList: null
    };
  },
  computed: {
    options() {
      return {
        paging: _.get(this.resource, "options.paging", 10),
        displayId: _.get(this.resource, "options.displayId", true),
        displayUpdatedAt: _.get(this.resource, "options.displayUpdatedAt", true)
      };
    },
    pageCount() {
      return Math.ceil(this.listCount / this.options.paging);
    },
    maxCount() {
      return _.get(this.resource, "maxCount", 0);
    },
    listCount() {
      return _.get(this.clonedRecordList, "length", 0);
    },
    filteredList() {
      let fields = this.getSearchableFields();
      if (fields.length === 0) {
        fields = [_.first(this.resource.schema)];
      }
      return _.filter(this.clonedRecordList, (item, index) => {
        if (_.isEmpty(this.search)) {
          return index >= this.options.paging * (this.page - 1) && index < this.options.paging * this.page;
        }
        const values = [];
        _.forEach(fields, (field) => {
          values.push(this.getValue(item, field));
        });
        return this.doesMatch(this.search, values) || new RegExp(this.search, "i").test(item._id);
      });
    }
  },
  watch: {
    async locale() {
      this.isReady = false;
      this.localLocale = this.locale;
      this.$emit("update:locale", this.localLocale);
      await this.updateSchema();
      this.isReady = true;
    },
    async record() {
      this.localRecord = _.cloneDeep(this.record);
    },
    async recordList() {
      this.clonedRecordList = _.cloneDeep(this.recordList);
      this.isReady = false;
      await this.updateSchema();
      this.isReady = true;
      this.$forceUpdate();
    },
    async userLocale() {
      this.isReady = false;
      await this.updateSchema();
      this.isReady = true;
    }
  },
  methods: {
    onPaginationClick() {
      console.warn("onPaginationClick ---", arguments);
    },
    updateRecordList(record) {
      this.$emit("updateRecordList", record);
    },
    selectRecord(record) {
      this.localLocale = this.locale;
      this.$emit("update:record", record);
    },
    editRecord(record) {
      this.selectRecord(record);
    },
    askConfirmation(forMultipleRecords = false) {
      return window.confirm(
        TranslateService$4.get(`TL_ARE_YOU_SURE_TO_DELETE${forMultipleRecords ? "_SELECTED_RECORDS" : ""}`),
        TranslateService$4.get("TL_YES"),
        TranslateService$4.get("TL_NO")
      );
    },
    async removeRecords(records) {
      if (!this.askConfirmation(true)) {
        return;
      }
      console.warn("will delete selected records");
      const promises = _.map(records, (record) => {
        return this.removeRecord(record, true);
      });
      await Promise.all(promises);
      console.warn("all selected records deleted !");
    },
    async removeRecord(record, skipConfirm = false) {
      if (!skipConfirm && this.askConfirmation()) {
        return;
      }
      if (_.isUndefined(record._id)) {
        record = {};
        this.$emit("update:record", null);
      } else {
        this.$loading.start("delete-record");
        try {
          await axios$1.delete(`../api/${this.resource.title}/${record._id}`);
          this.notify(TranslateService$4.get("TL_RECORD_DELETED", null, { id: record._id }));
          this.$emit("updateRecordList", null);
        } catch (error) {
          console.error("Error happen during deleteRecord:", error);
          this.manageError(error, "delete", this.editingRecord);
        }
        this.$loading.stop("delete-record");
      }
      this.clonedRecordList = _.filter(this.clonedRecordList, (item) => record !== item);
    },
    doesMatch(search, values) {
      let found = false;
      _.forEach(values, (value) => {
        found = new RegExp(this.search, "i").test(value);
        if (found) {
          return false;
        }
      });
      return found;
    },
    async updateRecord(record) {
      const uploadObject = {};
      let oldRecord = _.find(this.recordList, { _id: record._id });
      _.each(this.resource.schema, (field) => {
        if (field.input === "file") {
          return;
        }
        if (field.input === "image") {
          return;
        }
        const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised));
        if (isLocalised) {
          _.each(this.resource.locales, (locale) => {
            const fieldName = `${locale}.${field.field}`;
            let value = _.get(record, fieldName);
            if (field.input === "pillbox") {
              value = value || [];
            } else if (field.input === "json") {
              value = value || {};
            }
            if (_.isEqual(value, _.get(oldRecord, fieldName))) {
              return;
            }
            _.set(uploadObject, fieldName, value);
          });
        } else {
          const fieldName = field.field;
          let value = _.get(record, fieldName);
          if (field.input === "pillbox") {
            value = value || [];
          } else if (field.input === "json") {
            value = value || {};
          }
          if (_.isEqual(value, _.get(oldRecord, fieldName))) {
            return;
          }
          _.set(uploadObject, fieldName, value);
        }
      });
      const newAttachments = _.filter(record._attachments, (item) => !item._id);
      const removeAttachments = _.filter(oldRecord && oldRecord._attachments, (item) => !_.find(record._attachments, { _id: item._id }));
      if (_.isUndefined(record._id)) {
        this.$loading.start("create-record");
        try {
          const response = await axios$1.post(`../api/${this.resource.title}`, uploadObject);
          await this.uploadAttachments(response.data._id, newAttachments);
          this.notify(TranslateService$4.get("TL_RECORD_CREATED", null, { id: response.data._id }));
          this.$emit("updateRecordList", response.data);
        } catch (error) {
          console.error("Error happend during updateRecord/create:", error);
          this.manageError(error, "create");
        }
        this.$loading.stop("create-record");
      } else {
        this.$loading.start("update-record");
        try {
          let response;
          if (!_.isEmpty(uploadObject)) {
            response = await axios$1.put(`../api/${this.resource.title}/${record._id}`, uploadObject);
          } else {
            response = { data: record };
          }
          await this.uploadAttachments(response.data._id, newAttachments);
          await this.removeAttachments(response.data._id, removeAttachments);
          if (!_.isEmpty(uploadObject) || !_.isEmpty(newAttachments) || !_.isEmpty(removeAttachments)) {
            this.notify(TranslateService$4.get("TL_RECORD_UPDATED", null, { id: record._id }));
          }
          this.$emit("updateRecordList", response.data);
        } catch (error) {
          console.error("Error happend during updateRecord/create:", error);
          this.manageError(error, "update", record);
        }
        this.$loading.stop("update-record");
      }
    },
    async updateRecords() {
      try {
        const promises = [];
        this.$loading.start("update-records");
        let removedRecordList = _.filter(this.recordList, (item) => !_.find(this.clonedRecordList, { _id: item._id }));
        for (const record of removedRecordList) {
          promises.push(async () => {
            this.$loading.start("delete-record");
            await axios$1.delete(`../api/${this.resource.title}/${record._id}`);
            this.notify(TranslateService$4.get("TL_RECORD_DELETED", null, { id: record._id }));
            this.$emit("updateRecordList", null);
            this.$loading.stop("delete-record");
          });
        }
        for (const record of _.reverse(this.clonedRecordList)) {
          promises.push(async () => await this.updateRecord(record));
        }
        await pAll(promises, { concurrency: 10 });
      } catch (error) {
        console.error("Error happens during updateRecords:", error);
      }
      this.$loading.stop("update-records");
    },
    createRecord() {
      let obj = { _local: true };
      _.each(this.schema.fields, (item) => {
        _.set(obj, item.model, void 0);
      });
      this.clonedRecordList.push(obj);
      this.selectRecord(obj);
    },
    getSearchableFields() {
      return _.filter(this.resource.schema, (item) => item.searchable === true);
    },
    selectLocale(item) {
      this.$emit("update:locale", item);
    },
    getValue(item, field) {
      let displayname = "";
      if (field) {
        if (field.input === "file") {
          const attachment = _(item).get("_attachments", []).find((file) => file._name === field.field);
          displayname = attachment && attachment._filename;
        } else {
          const isLocalised = this.resource.locales && (field.localised || _.isUndefined(field.localised));
          if (isLocalised) {
            displayname = _.get(item, `${this.locale}.${field.field}`);
          } else {
            displayname = _.get(item, field.field);
          }
        }
      }
      return displayname;
    },
    back() {
      this.$emit("unsetRecord");
    }
  }
};
var _sfc_render$t = function render9() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "record-table" }, [!_vm.record ? [_c("ul", { directives: [{ name: "show", rawName: "v-show", value: _vm.resource.locales, expression: "resource.locales" }], staticClass: "locales" }, _vm._l(_vm.resource.locales, function(item) {
    return _c("li", { key: item, class: { selected: item == _vm.locale }, on: { "click": function($event) {
      return _vm.selectLocale(item);
    } } }, [_vm._v(" " + _vm._s(_vm._f("translate")("TL_" + item.toUpperCase())) + " ")]);
  }), 0), _c("div", { attrs: { "id": "top-actions" } }, [_c("div", { staticClass: "search" }, [_c(__unplugin_components_0$3, { attrs: { "flat": "", "dense": "", "compact": "", "outlined": "", "solo": "", "hide-details": "", "clearable": "", "placeholder": _vm._f("translate")("TL_SEARCH"), "type": "text", "name": "search" }, model: { value: _vm.search, callback: function($$v) {
    _vm.search = $$v;
  }, expression: "search" } })], 1), _vm.maxCount <= 0 || _vm.listCount < _vm.maxCount ? _c("div", { staticClass: "new", on: { "click": _vm.createRecord } }, [_vm._v("+")]) : _vm._e()]), _vm.isReady ? _c("vue-table-generator", { attrs: { "options": _vm.options, "resource": _vm.resource, "schema": _vm.schema, "items": _vm.filteredList, "locale": _vm.localLocale }, on: { "update:locale": function($event) {
    _vm.localLocale = $event;
  }, "remove": _vm.removeRecord, "remove-records": _vm.removeRecords, "edit": _vm.editRecord } }) : _vm._e()] : _vm._e(), _vm.record ? _c("record-editor", { key: _vm.record._id, staticClass: "has-back-button", attrs: { "resource-list": _vm.resourceList, "record": _vm.localRecord, "resource": _vm.resource, "locale": _vm.localLocale, "user-locale": _vm.TranslateService.locale }, on: { "update:record": function($event) {
    _vm.localRecord = $event;
  }, "update:locale": function($event) {
    _vm.localLocale = $event;
  }, "updateRecordList": _vm.updateRecordList, "back": _vm.back } }) : _vm._e()], 2);
};
var _sfc_staticRenderFns$t = [];
var __component__$t = /* @__PURE__ */ normalizeComponent(
  _sfc_main$t,
  _sfc_render$t,
  _sfc_staticRenderFns$t,
  false,
  null,
  null,
  null,
  null
);
const RecordTable = __component__$t.exports;
const App_vue_vue_type_style_index_0_lang = "";
const _sfc_main$s = {
  components: {
    // ResourceList,
    NavBar,
    RecordList,
    RecordEditor,
    Loading: Loading$1,
    LocaleList,
    RecordTable
  },
  mixins: [Notification],
  data() {
    return {
      config: false,
      locale: "enUS",
      resourceList: [],
      selectedResource: null,
      localeList: [],
      recordList: [],
      notification: {},
      toolbarTitle: false,
      selectedResourceGroup: null,
      selectedRecord: null,
      selectedPlugin: null,
      LoadingService: LoadingService$1,
      TranslateService: TranslateService$4,
      user: null,
      multiselect: false,
      multiselectItems: []
    };
  },
  computed: {
    pluginList() {
      let list = _.filter(window.plugins, (item) => {
        if (_.isUndefined(item.allowed)) {
          return true;
        }
        if (_.isEmpty(this.user)) {
          return false;
        }
        return _.includes(item.allowed, this.user.group);
      });
      return list;
    }
  },
  watch: {
    "$route": function() {
      if (this.$route.query.id != null) {
        this.selectResource(_.find(_.union(this.pluginList, this.resourceList), { title: this.$route.query.id }));
      }
    }
  },
  destroyed() {
    NotificationsService$1.events.off("notification", this.onGetNotification);
  },
  mounted() {
    this.$loading.start("init");
    LoginService$1.onLogout(() => {
      console.info("User logged out");
      window.location.reload();
    });
    NotificationsService$1.events.on("notification", this.onGetNotification);
    this.$nextTick(async () => {
      await ConfigService$1.init();
      this.config = ConfigService$1.config;
      await TranslateService$4.init();
      this.setToolbarTitle();
      const noLogin = _.get(window, "noLogin", false);
      if (noLogin) {
        this.user = {};
      } else {
        LoginService$1.init();
        try {
          this.user = await LoginService$1.getStatus();
          const isDark = _.get(this.user, "theme", "light") === "dark";
          this.$vuetify.theme.dark = isDark;
          this.$forceUpdate();
        } catch (error) {
          const errorMessage = _.get(error, "response.data.message", error.message);
          this.notify(errorMessage, "error");
          throw error;
        }
      }
      try {
        const resourcesResponse = await axios$1.get(`${window.location.pathname}resources`);
        this.$loading.stop("init");
        const resourceList = _.sortBy(resourcesResponse.data, (item) => item.title);
        this.resourceList = _.filter(resourceList, (resource) => {
          if (_.isUndefined(resource.allowed)) {
            return true;
          }
          return _.includes(resource.allowed, this.user.group);
        });
        ResourceService$1.setSchemas(this.resourceList);
        this.localeList = TranslateService$4.config.locales;
        if (this.$route.query.id != null) {
          const resource = _.find(_.union(this.pluginList, this.resourceList), { title: this.$route.query.id });
          this.selectResource(resource);
        }
      } catch (error) {
        console.error("Error while getting resources: ", error);
      }
    });
  },
  methods: {
    setToolbarTitle() {
      this.toolbarTitle = _.get(ConfigService$1.config, `toolbarTitle.${TranslateService$4.locale}`, _.get(ConfigService$1.config, "toolbarTitle", false));
    },
    onGetNotification(data) {
      this.notification = data;
    },
    getNotificationClass() {
      return `notification-${this.notification.type}`;
    },
    getThemeClass() {
      const classes = {};
      _.set(classes, `theme--${_.get(this.user, "theme", "light")}`, true);
      return classes;
    },
    async selectResourceGroup(resourceGroup) {
      this.selectedResourceGroup = resourceGroup;
    },
    async selectResource(resource) {
      try {
        if (_.get(this.$router, "history.current.query.id", false) !== resource.title) {
          this.$router.push({ query: { id: resource.title } }).catch((error) => console.error("Router throw an error:", error));
        }
        if (resource.type === "plugin") {
          this.selectedResource = null;
          this.selectedPlugin = resource;
          return;
        }
        this.onCancelMultiselectPage();
        this.selectedResource = resource;
        this.selectedPlugin = null;
        this.recordList = null;
        this.selectedRecord = null;
        if (!this.selectedResource) {
          return;
        }
        this.locale = _.first(this.selectedResource.locales);
        this.$loading.start("selectResource");
        await this.cacheRelatedResources(resource);
        const data = ResourceService$1.get(resource.title);
        this.recordList = _.sortBy(data, (item) => -item._updatedAt);
        if (_.get(resource, "maxCount", 0) === 1) {
          const first = _.get(this.recordList, "[0]", false);
          if (!first) {
            this.selectRecord({ _local: true });
          } else {
            this.selectRecord(first);
          }
        }
        this.$loading.stop("selectResource");
      } catch (error) {
        console.error("Error happen during selectResource:", error);
      }
    },
    async cacheRelatedResources(resource) {
      let resources2 = _.union([resource.title], _.values(resource.extraSources));
      const extraResrouces = (obj) => {
        if (_.isArray(obj)) {
          _.each(obj, (item) => {
            extraResrouces(item);
          });
        } else {
          _.each(obj, (value, key) => {
            switch (key) {
              case "input": {
                const extraSources = _.get(obj, "options.extraSources");
                resources2.push(..._.values(extraSources));
                switch (value) {
                  case "select":
                  case "multiselect":
                    const source = _.get(obj, "source");
                    if (_.isString(source)) {
                      resources2.push(source);
                      const schema = ResourceService$1.getSchema(source);
                      resources2.push(..._.values(schema.extraSources));
                    }
                    break;
                  case "paragraph":
                    _.each(_.get(obj, "options.types"), (item) => {
                      extraResrouces(item);
                      const paragraphSchema = _.get(item, "schema");
                      extraResrouces(paragraphSchema);
                    });
                }
                break;
              }
              case "extraSources":
                resources2.push(..._.values(value));
            }
          });
        }
      };
      extraResrouces(resource.schema);
      resources2 = _.uniq(resources2);
      await pAll(_.map(resources2, (item) => {
        return async () => await ResourceService$1.cache(item);
      }), { concurrency: 10 });
    },
    selectRecord(record) {
      this.selectedRecord = record;
    },
    onSelectMultiselect(isMultiselect) {
      this.multiselect = isMultiselect;
      if (isMultiselect) {
        this.unsetSelectedRecord();
      }
    },
    onChangeMultiselectItems(items) {
      this.multiselectItems = _.clone(items);
    },
    async updateRecordList(record) {
      try {
        this.$loading.start("updateRecordList");
        const data = await ResourceService$1.cache(this.selectedResource.title);
        this.$loading.stop("updateRecordList");
        this.recordList = _.sortBy(data, (item) => -item._updatedAt);
        this.selectRecord(_.find(this.recordList, { _id: _.get(record, "_id") }));
      } catch (error) {
        console.error("Error happen during updateRecordList:", error);
      }
    },
    unsetSelectedRecord() {
      this.selectedRecord = null;
    },
    onCancelMultiselectPage() {
      this.multiselect = false;
      this.multiselectItems = [];
    }
  }
};
var _sfc_render$s = function render10() {
  var _vm = this, _c = _vm._self._c;
  return _c(__unplugin_components_0$5, [_c(VScrollYTransition, [_vm.notification.type ? _c(__unplugin_components_2$2, { staticClass: "notification", class: _vm.getNotificationClass(), attrs: { "multi-line": "", "top": "", "centered": "", "timeout": _vm.notification.type === "error" ? -1 : 1e3 }, scopedSlots: _vm._u([{ key: "action", fn: function({ attrs }) {
    return [_vm.notification.type === "error" ? _c(__unplugin_components_1, _vm._b({ attrs: { "text": "" }, on: { "click": function($event) {
      _vm.notification = {};
    } } }, "v-btn", attrs, false), [_vm._v(" " + _vm._s(_vm._f("translate")("TL_CLOSE")) + " ")]) : _vm._e()];
  } }], null, false, 3083842718), model: { value: _vm.notification, callback: function($$v) {
    _vm.notification = $$v;
  }, expression: "notification" } }, [_c("p", [_vm._v(_vm._s(_vm.notification.message))])]) : _vm._e()], 1), _vm.user ? _c("div", { staticClass: "cms-layout" }, [_c("div", { staticClass: "cms-inner-layout", class: _vm.getThemeClass() }, [_vm.resourceList.length > 0 ? _c("nav-bar", { attrs: { "config": _vm.config, "toolbar-title": _vm.toolbarTitle, "locale-class": { locale: _vm.localeList && _vm.localeList.length > 1 }, "select-resource-group-callback": _vm.selectResourceGroup, "select-resource-callback": _vm.selectResource, "resource-list": _vm.resourceList, "plugins": _vm.pluginList, "selected-resource-group": _vm.selectedResourceGroup, "selected-item": _vm.selectedResource || _vm.selectedPlugin } }) : _vm._e(), _c("div", { staticClass: "resources" }, [_vm.localeList ? _c("locale-list", { attrs: { "locale-list": _vm.localeList } }) : _vm._e()], 1), _c("div", { staticClass: "records" }, [_vm.selectedResource && (!_vm.selectedResource.view || _vm.selectedResource.view == "list") ? [_vm.selectedResource ? _c("record-list", { attrs: { "list": _vm.recordList, "locale": _vm.locale, "selected-item": _vm.selectedRecord, "resource": _vm.selectedResource, "multiselect": _vm.multiselect, "multiselect-items": _vm.multiselectItems }, on: { "selectItem": _vm.selectRecord, "changeMultiselectItems": _vm.onChangeMultiselectItems, "selectMultiselect": _vm.onSelectMultiselect } }) : _vm._e(), _vm.selectedRecord ? _c("record-editor", { key: _vm.selectedRecord._id, attrs: { "resource-list": _vm.resourceList, "record": _vm.selectedRecord, "resource": _vm.selectedResource, "locale": _vm.locale, "user-locale": _vm.TranslateService.locale }, on: { "update:record": function($event) {
    _vm.selectedRecord = $event;
  }, "update:locale": function($event) {
    _vm.locale = $event;
  }, "updateRecordList": _vm.updateRecordList } }) : _vm._e()] : _vm._e(), _vm.selectedResource && _vm.selectedResource.view == "table" ? _c("record-table", { attrs: { "record-list": _vm.recordList, "resource-list": _vm.resourceList, "resource": _vm.selectedResource, "record": _vm.selectedRecord, "locale": _vm.locale, "user-locale": _vm.TranslateService.locale }, on: { "update:record": function($event) {
    _vm.selectedRecord = $event;
  }, "update:locale": function($event) {
    _vm.locale = $event;
  }, "unsetRecord": _vm.unsetSelectedRecord, "updateRecordList": _vm.updateRecordList } }) : _vm._e(), _vm.selectedPlugin ? _c("plugin-page", { attrs: { "plugin": _vm.selectedPlugin } }) : _vm._e(), _vm.selectedResource && _vm.multiselect ? _c("multiselect-page", { attrs: { "multiselect-items": _vm.multiselectItems, "locale": _vm.locale, "resource": _vm.selectedResource, "record-list": _vm.recordList }, on: { "cancel": _vm.onCancelMultiselectPage, "changeMultiselectItems": _vm.onChangeMultiselectItems, "updateRecordList": _vm.updateRecordList } }) : _vm._e()], 2), _vm.LoadingService.isShow ? _c("loading") : _vm._e()], 1)]) : _vm._e()], 1);
};
var _sfc_staticRenderFns$s = [];
var __component__$s = /* @__PURE__ */ normalizeComponent(
  _sfc_main$s,
  _sfc_render$s,
  _sfc_staticRenderFns$s,
  false,
  null,
  null,
  null,
  null
);
const App = __component__$s.exports;
const LoginApp_vue_vue_type_style_index_0_scoped_d22c9055_lang = "";
const _sfc_main$r = {
  components: {
    Loading: Loading$1
  },
  mixins: [Notification],
  data() {
    return {
      username: null,
      password: null,
      activeField: false,
      loginFailed: false,
      loggingIn: false,
      showLoginForm: false,
      loaded: false,
      LoadingService: LoadingService$1,
      TranslateService: TranslateService$4
    };
  },
  async mounted() {
    console.warn("Login page mounted");
    this.$loading.start("init");
    try {
      const noLogin = _.get(window, "noLogin", false);
      if (!noLogin) {
        LoginService$1.init();
      }
      await ConfigService$1.init();
      await TranslateService$4.init();
      this.loaded = true;
    } catch (error) {
      console.error("Error happen during mounted:", error);
    }
    this.loaded = true;
    this.$nextTick(() => {
      setTimeout(() => {
        this.showLoginForm = true;
      }, 100);
    });
    this.$loading.stop("init");
  },
  methods: {
    async login() {
      if (this.loggingIn) {
        return;
      }
      if (!this.username) {
        return this.$refs.username.focus();
      }
      if (!this.password) {
        return this.$refs.password.focus();
      }
      this.$loading.start("login");
      this.loggingIn = true;
      try {
        await axios$1.post(`${window.location.pathname}login`, { username: this.username, password: this.password });
        this.$loading.stop("login");
        window.location.reload();
      } catch (error) {
        console.error("Error happen during login:", error);
        this.loginFailed = true;
        this.$loading.stop("login");
      }
      this.loggingIn = false;
    }
  }
};
var _sfc_render$r = function render11() {
  var _vm = this, _c = _vm._self._c;
  return _c(__unplugin_components_0$5, [_vm.loaded ? _c("div", { staticClass: "cms-layout", class: { displayed: _vm.showLoginForm } }, [_c("div", { staticClass: "login-canvas" }, [_c("form", { on: { "submit": function($event) {
    $event.preventDefault();
    return _vm.login.apply(null, arguments);
  } } }, [_c("div", { staticClass: "node-cms-title" }, [_vm._v(" " + _vm._s(_vm._f("translate")("TL_LOGIN")) + " ")]), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.username, expression: "username" }], ref: "username", attrs: { "autofocus": "", "type": "test", "name": "nodeCmsUsername", "autocomplete": "on", "placeholder": _vm._f("translate")("TL_USERNAME") }, domProps: { "value": _vm.username }, on: { "input": function($event) {
    if ($event.target.composing)
      return;
    _vm.username = $event.target.value;
  } } }), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.password, expression: "password" }], ref: "password", attrs: { "type": "password", "name": "nodeCmsPassword", "autocomplete": "on", "placeholder": _vm._f("translate")("TL_PASSWORD") }, domProps: { "value": _vm.password }, on: { "input": function($event) {
    if ($event.target.composing)
      return;
    _vm.password = $event.target.value;
  } } }), _vm.loginFailed ? _c("span", { staticClass: "error-message" }, [_vm._v(_vm._s(_vm._f("translate")("TL_LOGIN_FAIL")))]) : _vm._e(), _c("div", { staticClass: "login-btn-wrapper", class: { disabled: !_vm.username || !_vm.password || _vm.loggingIn } }, [_c("button", { attrs: { "disabled": _vm.loggingIn } }, [_vm._v(" " + _vm._s(_vm._f("translate")("TL_CONFIRM")) + " ")])])])])]) : _vm._e(), _vm.LoadingService.isShow ? _c("loading") : _vm._e()], 1);
};
var _sfc_staticRenderFns$r = [];
var __component__$r = /* @__PURE__ */ normalizeComponent(
  _sfc_main$r,
  _sfc_render$r,
  _sfc_staticRenderFns$r,
  false,
  null,
  "d22c9055",
  null,
  null
);
const LoginApp = __component__$r.exports;
const MultiselectPage_vue_vue_type_style_index_0_scoped_55ec3ee9_lang = "";
const _sfc_main$q = {
  mixins: [RecordNameHelper, AbstractEditorView, Notification],
  props: {
    resource: {
      type: Object,
      default: () => {
      }
    },
    locale: {
      type: String,
      default: "enUS"
    },
    multiselectItems: {
      type: Array,
      default: () => []
    },
    recordList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      size: _.size,
      isEmpty: _.isEmpty
    };
  },
  methods: {
    onClickCancel() {
      this.$emit("cancel");
    },
    onClickSelectAll() {
      this.$emit("changeMultiselectItems", this.recordList);
    },
    onClickDeselectAll() {
      this.$emit("changeMultiselectItems", []);
    },
    async onClickDelete() {
      if (!window.confirm(
        TranslateService$4.get("TL_ARE_YOU_SURE_TO_DELETE_RECORDS", null, { num: _.size(this.multiselectItems) }),
        TranslateService$4.get("TL_YES"),
        TranslateService$4.get("TL_NO")
      )) {
        return;
      }
      this.$loading.start("onDeleteMultiselectedItems");
      try {
        await pAll(_.map(this.multiselectItems, (item) => {
          return async () => {
            try {
              await axios.delete(`../api/${this.resource.title}/${item._id}`);
              this.notify(TranslateService$4.get("TL_RECORD_DELETED", null, { id: item._id }));
            } catch (error) {
              console.error(error);
              this.manageError(error, "delete", item);
            }
          };
        }), { concurrency: 1 });
      } catch (error) {
        console.error(error);
      }
      this.multiselect = false;
      this.$loading.stop("onDeleteMultiselectedItems");
      this.$emit("updateRecordList", null);
      this.$emit("cancel");
    }
    // async onClickClone () {
    //   if (!window.confirm(
    //     TranslateService.get('TL_ARE_YOU_SURE_TO_CLONE_RECORDS', null, {num: _.size(this.multiselectItems)}),
    //     TranslateService.get('TL_YES'),
    //     TranslateService.get('TL_NO')
    //   )) {
    //     return
    //   }
    //   this.$loading.start('onCloneMultiselectedItems')
    //   try {
    //     await pAll(_.map(this.multiselectItems, item => {
    //       return async () => {
    //         try {
    //           const {data} = await axios.post(`../api/${this.resource.title}`, item)
    //           this.notify(TranslateService.get('TL_RECORD_CREATED', null, { id: data._id })
    //         } catch (error) {
    //           console.error(error)
    //           this.manageError(error, 'create')
    //         }
    //       }
    //     }), {concurrency: 1})
    //   } catch (error) {
    //     console.error(error)
    //   }
    //   this.multiselect = false
    //   this.$loading.stop('onCloneMultiselectedItems')
    //   this.$emit('updateRecordList', null)
    //   this.$emit('cancel')
    // }
  }
};
var _sfc_render$q = function render12() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "multiselect-page" }, [_c("h3", [_vm._v(_vm._s(_vm._f("translate")("TL_YOU_HAVE_SELECTED_NUM_ITEMS", null, { num: _vm.size(_vm.multiselectItems) })))]), _c("ul", _vm._l(_vm.multiselectItems, function(item) {
    return _c("li", { key: item._id }, [_vm._v(" " + _vm._s(_vm.getName(item)) + " (" + _vm._s(item._id) + ") ")]);
  }), 0), _c("br"), _c("div", { staticClass: "actions" }, [_c(__unplugin_components_1, { on: { "click": _vm.onClickSelectAll } }, [_vm._v(_vm._s(_vm._f("translate")("TL_SELECT_ALL_ITEMS")))]), _c(__unplugin_components_1, { attrs: { "disabled": _vm.multiselectItems.length === 0 }, on: { "click": _vm.onClickDeselectAll } }, [_vm._v(_vm._s(_vm._f("translate")("TL_DESELECT_ALL_ITEMS")))])], 1), _c("div", { staticClass: "buttons" }, [_c(__unplugin_components_1, { staticClass: "back", on: { "click": _vm.onClickCancel } }, [_vm._v(_vm._s(_vm._f("translate")("TL_CANCEL")))]), _c(__unplugin_components_1, { staticClass: "delete right", attrs: { "disabled": _vm.isEmpty(_vm.multiselectItems) }, on: { "click": _vm.onClickDelete } }, [_vm._v(_vm._s(_vm._f("translate")("TL_DELETE")))])], 1)]);
};
var _sfc_staticRenderFns$q = [];
var __component__$q = /* @__PURE__ */ normalizeComponent(
  _sfc_main$q,
  _sfc_render$q,
  _sfc_staticRenderFns$q,
  false,
  null,
  "55ec3ee9",
  null,
  null
);
const MultiselectPage = __component__$q.exports;
const _sfc_main$p = {
  props: ["schema", "model", "row", "formOptions", "disabled"],
  created() {
    _.each(this.schema.fields, (field) => {
      const fieldType = this.getFieldType(field);
      if (!(fieldType in Vue.options.components)) {
        console.error(`${fieldType} isn't defined as a custom field type, will not render it`);
      }
    });
  },
  methods: {
    getFieldType(field) {
      return _.get(field, "overrideType", _.get(field, "type", false));
    },
    onInput(value, model) {
      if (_.isUndefined(model)) {
        model = _.get(_.first(value), "parentKey", false);
      }
      this.$emit("input", value, model);
    }
  }
};
var _sfc_render$p = function render13() {
  var _vm = this, _c = _vm._self._c;
  return _vm.schema != null ? _c("div", { staticClass: "vue-form-generator" }, [_vm.schema.fields ? _c("fieldset", _vm._l(_vm.schema.fields, function(field) {
    return _c("div", { key: field.model, staticClass: "field-wrapper" }, [_c(_vm.getFieldType(field), { key: field.model, tag: "component", attrs: { "schema": field, "model": _vm.model, "form-options": _vm.formOptions, "disabled": _vm.disabled }, on: { "input": _vm.onInput } })], 1);
  }), 0) : _vm._e()]) : _vm._e();
};
var _sfc_staticRenderFns$p = [];
var __component__$p = /* @__PURE__ */ normalizeComponent(
  _sfc_main$p,
  _sfc_render$p,
  _sfc_staticRenderFns$p,
  false,
  null,
  null,
  null,
  null
);
const CustomForm = __component__$p.exports;
const _sfc_main$o = {
  props: [
    "plugin"
  ],
  data() {
    return {};
  },
  watch: {},
  mounted() {
  },
  methods: {}
};
var _sfc_render$o = function render14() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "plugin-page" }, [_c(_vm.plugin.component, { tag: "component" })], 1);
};
var _sfc_staticRenderFns$o = [];
var __component__$o = /* @__PURE__ */ normalizeComponent(
  _sfc_main$o,
  _sfc_render$o,
  _sfc_staticRenderFns$o,
  false,
  null,
  null,
  null,
  null
);
const PluginPage = __component__$o.exports;
const Syslog_vue_vue_type_style_index_0_scoped_e330bd3e_lang = "";
const _sfc_main$n = {
  data() {
    return {
      timer: null,
      isLoading: true,
      sysLog: [],
      error: false,
      scrollBottom: true,
      data: "",
      stickyId: -1,
      count: 0,
      destroyed: false,
      autoscroll: true,
      lastId: -1,
      tempId: 0,
      logLines: [],
      filterOutLines: [],
      searchKey: null,
      warningQty: 0,
      errorQty: 0,
      ignoreNextScrollEvent: false,
      fakeData: [],
      config: null
    };
  },
  async mounted() {
    const { data: config } = await axios.get(`${window.location.pathname}../api/_syslog/config`);
    this.config = config;
    if (this.config.wss) {
      WebsocketService$1.events.on("syslog", (data) => {
        if (!_.isEmpty(data)) {
          this.error = false;
          this.logLines.push(...data);
          this.lastId = _.last(this.logLines).id;
          this.updateSysLog();
        }
        if (this.autoscroll) {
          this.ignoreNextScrollEvent = true;
          this.$refs.scroller.scrollToBottom();
        }
      });
    }
    this.$nextTick(() => {
      this.refreshLog();
      if (this.$refs.scroller) {
        const element = this.$refs.scroller.$el;
        element.addEventListener("scroll", this.detectScroll);
      }
    });
  },
  async destroyed() {
    this.destroyed = true;
    if (this.$refs.scroller) {
      const element = this.$refs.scroller.$el;
      element.removeEventListener("scroll", this.detectScroll);
    }
    clearTimeout(this.timer);
  },
  methods: {
    filterLevel(level) {
      this.searchKey = `sift:{level: {$gte: ${level}}}`;
      this.updateSysLog();
    },
    detectScroll(event2) {
      const scrollHeight = _.get(event2, "srcElement.scrollHeight", 0);
      const scrollTop = _.get(event2, "srcElement.scrollTop", 0);
      const clientHeight = _.get(event2, "srcElement.clientHeight", 0);
      if (this.ignoreNextScrollEvent) {
        this.ignoreNextScrollEvent = false;
        return;
      }
      this.$nextTick(() => {
        if (this.autoscroll === false && scrollTop + clientHeight >= scrollHeight) {
          this.stickyId = -1;
        }
        this.autoscroll = scrollTop + clientHeight >= scrollHeight;
      });
    },
    getLogViewerHeight() {
      return _.get(this.$refs["log-viewer"], "offsetHeight", 100);
    },
    onInputSearch() {
      this.updateSysLog();
    },
    onClickRefresh() {
      this.error = false;
      this.searchKey = null;
      this.logLines = [];
      this.sysLog = [];
      this.updateSysLog();
      this.lastId = -1;
    },
    onClickClearSearch() {
      this.searchKey = null;
      this.updateSysLog();
    },
    onClickAutoscroll() {
      this.autoscroll = !this.autoscroll;
    },
    onClickClear() {
      this.searchKey = null;
      this.logLines = [];
      this.sysLog = [];
      this.updateSysLog();
    },
    calculateLineNumberSpacing(line) {
      return _.padStart(line, 8, "0") + " |";
    },
    jumpTo(id) {
      if (!this.searchKey && this.stickyId !== id) {
        return;
      }
      if (this.stickyId === id) {
        this.stickyId = -1;
        this.autoscroll = true;
        return;
      }
      this.ignoreNextScrollEvent = true;
      this.autoscroll = false;
      this.onClickClearSearch();
      this.$nextTick(() => {
        const isActive = document.querySelector(`[data-line-id='${id}'][data-is-active='true']`);
        if (!isActive) {
          this.$refs.scroller.scrollToItem(_.findIndex(this.logLines, (item) => item.id === id) - 14);
        }
        this.stickyId = id;
      });
    },
    async refreshLog() {
      try {
        if (this.config.wss) {
          if (WebsocketService$1.client) {
            WebsocketService$1.send({ action: "syslog", id: this.lastId });
            this.isLoading = false;
            this.error = false;
          }
        } else {
          const response = await axios.get(`${window.location.pathname}../api/_syslog`, { params: { id: this.lastId } });
          this.isLoading = false;
          this.error = false;
          if (!_.isEmpty(response.data)) {
            this.error = false;
            this.logLines.push(...response.data);
            this.lastId = _.last(this.logLines).id;
            this.updateSysLog();
          }
          if (this.autoscroll) {
            this.ignoreNextScrollEvent = true;
            this.$refs.scroller.scrollToBottom();
          }
        }
      } catch (error) {
        console.error(error);
        this.error = true;
      }
      if (!this.destroyed) {
        this.timer = setTimeout(this.refreshLog, this.error ? 2e3 : 200);
      }
    },
    updateSysLog() {
      let lines = _.uniqBy(this.logLines, "id");
      const byLevel = _.groupBy(this.logLines, "level");
      this.warningQty = _.get(byLevel, "[1].length", 0);
      this.errorQty = _.get(byLevel, "[2].length", 0);
      if (!_.isEmpty(this.searchKey)) {
        if (this.searchKey.search("sift:") === 0) {
          try {
            const query = lib.parse(this.searchKey.substr(5));
            lines = lines.filter(sift(query));
          } catch (e) {
          }
        } else {
          lines = _.filter(lines, (lineItem) => {
            return _.includes(_.toLower(lineItem.line), _.toLower(this.searchKey));
          });
        }
      }
      this.sysLog = lines;
      this.filterOutLines = _.get(this.logLines, "length", 0) - _.get(this.sysLog, "length", 0);
    }
  }
};
var _sfc_render$n = function render15() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "syslog" }, [_c("div", { staticClass: "buttons" }, [_c("button", { staticClass: "item autoscroll", class: { active: _vm.autoscroll }, on: { "click": _vm.onClickAutoscroll } }, [_vm.autoscroll ? _c(__unplugin_components_5, [_vm._v("mdi-lock-outline")]) : _c(__unplugin_components_5, [_vm._v("mdi-unlock")])], 1), _c("button", { staticClass: "item clear", on: { "click": _vm.onClickClear } }, [_c(__unplugin_components_5, [_vm._v("mdi-trash-can-outline")])], 1), _c("button", { staticClass: "item refresh", on: { "click": _vm.onClickRefresh } }, [_c(__unplugin_components_5, [_vm._v("mdi-refresh")])], 1), _c("input", { directives: [{ name: "model", rawName: "v-model", value: _vm.searchKey, expression: "searchKey" }], staticClass: "item search", class: { "is-sift": _vm.searchKey && _vm.searchKey.search("sift:") === 0 }, attrs: { "placeholder": _vm._f("translate")("TL_SEARCH") }, domProps: { "value": _vm.searchKey }, on: { "input": [function($event) {
    if ($event.target.composing)
      return;
    _vm.searchKey = $event.target.value;
  }, _vm.onInputSearch] } }), _vm.searchKey && _vm.searchKey.length > 0 ? _c("button", { staticClass: "item clear-search", on: { "click": _vm.onClickClearSearch } }, [_c(__unplugin_components_5, [_vm._v("mdi-close")])], 1) : _vm._e(), _vm.filterOutLines > 0 ? _c("div", { staticClass: "item filter-out" }, [_c(__unplugin_components_5, [_vm._v("mdi-target")]), _vm._v(_vm._s(_vm.filterOutLines) + " lines are filter out")], 1) : _vm._e(), _c("div", { staticClass: "item logs-raised-flags" }, [_vm.warningQty >= 0 ? _c("span", { staticClass: "flag-item flag-warning", on: { "click": function($event) {
    return _vm.filterLevel(1);
  } } }, [_c(__unplugin_components_5, [_vm._v("mdi-flag-outline")]), _vm._v(" " + _vm._s(_vm.warningQty))], 1) : _vm._e(), _vm.errorQty >= 0 ? _c("span", { staticClass: "flag-item flag-error", on: { "click": function($event) {
    return _vm.filterLevel(2);
  } } }, [_c(__unplugin_components_5, [_vm._v("mdi-alert-box-outline")]), _vm._v(" " + _vm._s(_vm.errorQty))], 1) : _vm._e()])]), _vm.error ? _c("div", { staticClass: "error" }, [_vm._v(" " + _vm._s(_vm._f("translate")("TL_ERROR_RETRIEVE_SYSLOG")) + " ")]) : _vm._e(), _c("div", { ref: "log-viewer", staticClass: "log-viewer-wrapper" }, [_c("DynamicScroller", { ref: "scroller", staticClass: "scroller", attrs: { "items": _vm.sysLog, "min-item-size": 14 }, scopedSlots: _vm._u([{ key: "default", fn: function({ item, index, active }) {
    return [_c("DynamicScrollerItem", { attrs: { "item": item, "active": active, "size-dependencies": [
      _vm.calculateLineNumberSpacing(item.id),
      item.line
    ], "data-index": index } }, [_c("div", { staticClass: "line-wrapper", attrs: { "data-line-id": item.id, "data-is-active": active } }, [_c("div", { staticClass: "line-number", class: { stickId: _vm.stickyId === item.id, search: _vm.searchKey }, on: { "click": function($event) {
      return _vm.jumpTo(item.id);
    } } }, [_vm._v(_vm._s(item.id))]), _c("div", { staticClass: "line-content", domProps: { "innerHTML": _vm._s(item.html) } })])])];
  } }]) })], 1)]);
};
var _sfc_staticRenderFns$n = [];
var __component__$n = /* @__PURE__ */ normalizeComponent(
  _sfc_main$n,
  _sfc_render$n,
  _sfc_staticRenderFns$n,
  false,
  null,
  "e330bd3e",
  null,
  null
);
const Syslog = __component__$n.exports;
const CmsImport_vue_vue_type_style_index_0_scoped_84588550_lang = "";
const _sfc_main$m = {
  data() {
    return {
      config: null,
      status: null,
      error: null,
      type: 0,
      loading: false,
      uploadedXlsx: null
    };
  },
  async mounted() {
    const response = await axios("./config");
    this.config = response.data.import;
  },
  methods: {
    async onChangeXlsxFile(event2) {
      this.uploadedXlsx = null;
      const file = _.first(event2.target.files);
      if (!file) {
        return;
      }
      this.uploadedXlsx = file;
    },
    openFile() {
      window.open(`https://docs.google.com/spreadsheets/d/${this.config.gsheetId}/edit`, "_blank").focus();
    },
    async checkStatus() {
      this.loading = true;
      this.status = null;
      this.error = null;
      this.$loading.start("cms-import");
      this.type = 0;
      this.$nextTick(async () => {
        try {
          const response = await axios("../import/status");
          this.status = response.data;
        } catch (e) {
          this.status = null;
          this.error = _.get(e, "message", e);
        }
        this.$loading.stop("cms-import");
        this.loading = false;
      });
    },
    async execute() {
      this.loading = true;
      this.status = null;
      this.error = null;
      this.type = 1;
      this.$loading.start("cms-import");
      this.$nextTick(async () => {
        try {
          const response = await axios("../import/execute");
          this.status = response.data;
        } catch (e) {
          this.status = null;
          this.error = _.get(e, "message", e);
        }
        this.$loading.stop("cms-import");
        this.loading = false;
      });
    },
    async checkXlsxStatus() {
      this.loading = true;
      this.status = null;
      this.error = null;
      this.$loading.start("xlsx-import");
      this.type = 0;
      this.$nextTick(async () => {
        try {
          const formData = new FormData();
          formData.append("xlsx", this.uploadedXlsx);
          const response = await axios.post("../import/statusXlsx", formData);
          this.status = response.data;
        } catch (e) {
          this.status = null;
          this.error = _.get(e, "message", e);
        }
        this.$loading.stop("xlsx-import");
        this.loading = false;
      });
    },
    async executeXlsx() {
      this.loading = true;
      this.status = null;
      this.error = null;
      this.type = 1;
      this.$loading.start("xlsx-import");
      this.$nextTick(async () => {
        try {
          const formData = new FormData();
          formData.append("xlsx", this.uploadedXlsx);
          const response = await axios.post("../import/executeXlsx", formData);
          this.status = response.data;
        } catch (e) {
          this.status = null;
          this.error = _.get(e, "message", e);
        }
        this.$loading.stop("xlsx-import");
        this.loading = false;
      });
    }
  }
};
var _sfc_render$m = function render16() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "cms-import" }, [_c("h3", [_vm._v("Cms Import")]), _c("div", { staticClass: "main-container" }, [_c("div", { staticClass: "config-resources" }, [_c("h4", [_vm._v("Resources")]), _vm.config && _vm.config.resources ? _c(__unplugin_components_0$6, { attrs: { "column": "" } }, _vm._l(_vm.config.resources, function(item, index) {
    return _c(__unplugin_components_3$2, { key: index, attrs: { "ripple": false } }, [_vm._v(" " + _vm._s(item) + " ")]);
  }), 1) : _vm._e()], 1), _c("hr"), _c("h4", [_vm._v("Actions")]), _c("div", [_c(__unplugin_components_1, { attrs: { "dense": "" }, on: { "click": function($event) {
    return _vm.openFile();
  } } }, [_vm._v("Edit Google Sheet")]), _c("div", { staticClass: "other-actions" }, [_c(__unplugin_components_1, { attrs: { "dense": "", "disabled": _vm.loading }, on: { "click": function($event) {
    return _vm.checkStatus();
  } } }, [_vm._v("Check Difference")]), _c(__unplugin_components_1, { attrs: { "dense": "", "disabled": _vm.loading }, on: { "click": function($event) {
    return _vm.execute();
  } } }, [_vm._v("Import from Remote")])], 1)], 1), _c("hr"), _c("h4", [_vm._v("Upload Xlsx")]), _c(__unplugin_components_1$2, { ref: "xlsxFile", attrs: { "dense": "", "hide-details": "", "outlined": "", "type": "file" }, on: { "change": _vm.onChangeXlsxFile } }), _c("div", { staticClass: "other-actions" }, [_c(__unplugin_components_1, { attrs: { "dense": "", "disabled": _vm.loading || !_vm.uploadedXlsx }, on: { "click": function($event) {
    return _vm.checkXlsxStatus();
  } } }, [_vm._v("Check Difference")]), _c(__unplugin_components_1, { attrs: { "dense": "", "disabled": _vm.loading || !_vm.uploadedXlsx }, on: { "click": function($event) {
    return _vm.executeXlsx();
  } } }, [_vm._v("Import from Remote")])], 1), _vm.status || _vm.error ? _c("div", [_vm.type == 0 ? _c("h4", [_vm._v("Difference:")]) : _c("h4", [_vm._v("Status:")]), _c("pre", { domProps: { "innerHTML": _vm._s(_vm.status) } }), _vm._v(" "), _c("pre", { domProps: { "innerHTML": _vm._s(_vm.error) } })]) : _vm._e()], 1)]);
};
var _sfc_staticRenderFns$m = [];
var __component__$m = /* @__PURE__ */ normalizeComponent(
  _sfc_main$m,
  _sfc_render$m,
  _sfc_staticRenderFns$m,
  false,
  null,
  "84588550",
  null,
  null
);
const CmsImport = __component__$m.exports;
const SyncResource_vue_vue_type_style_index_0_scoped_90250774_lang = "";
const _sfc_main$l = {
  data() {
    return {
      statusInterval: null,
      error: null,
      config: null,
      selectedResource: null,
      recordData: {},
      reportData: {},
      syncStatus: {},
      uniqueKeyMap: {},
      environments: ["local", "remote"],
      syncingEnvironment: null,
      isEmpty: _.isEmpty,
      get: _.get,
      includes: _.includes
    };
  },
  destroyed() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  },
  async mounted() {
    let response;
    response = await axios.get(`${window.location.pathname}resources`);
    _.each(response.data, (resource) => {
      let uniqueKeyField = _.find(resource.schema, { unique: true });
      if (uniqueKeyField) {
        this.uniqueKeyMap[resource.title] = uniqueKeyField.field;
      }
    });
    response = await axios.get(`${window.location.pathname}/config`);
    this.config = response.data;
    if (this.selectedResource) {
      this.update();
    }
    this.statusInterval = setInterval(async () => {
      if (this.selectedResource) {
        try {
          await pAll(_.map(["local", "remote"], (env) => {
            return async () => {
              try {
                const response2 = await axios.get(`${window.location.pathname}/sync/${env}/${this.selectedResource}/status`);
                this.syncStatus[env] = response2.data;
                this.syncStatus = _.clone(this.syncStatus);
              } catch (error) {
                console.error(error);
              }
            };
          }));
        } catch (error) {
        }
        const result = _.find(this.syncStatus, { status: "syncing" });
        if (!result && this.syncingEnvironment) {
          this.$loading.stop("deploy-resource");
          if (result && result.status === "error") {
            this.error = result.error;
          }
          this.syncingEnvironment = false;
          this.update();
        }
      }
    }, 5 * 1e3);
  },
  methods: {
    onChangeResource() {
      this.update();
    },
    async update() {
      this.$loading.start("loading-resource");
      try {
        const uniqueKey = this.uniqueKeyMap[this.selectedResource];
        this.recordData = {};
        this.reportData = {};
        await pAll(_.map(this.environments, (env) => {
          return async () => {
            try {
              let response;
              response = await axios.get(`${window.location.pathname}sync/${env}/${this.selectedResource}`);
              _.set(this.recordData, env, response.data);
              response = await axios.get(`${window.location.pathname}sync/${env}/${this.selectedResource}/status`);
              _.set(this.syncStatus, env, response.data);
              this.syncStatus = _.clone(this.syncStatus);
            } catch (error) {
              console.error(error);
            }
          };
        }), { concurrency: 1 });
        this.recordData = _.clone(this.recordData);
        const fromData = this.recordData.local;
        const toData = this.recordData.remote;
        const fromKeys = _.map(fromData, (item) => item[uniqueKey]);
        const toKeys = _.map(toData, (item) => item[uniqueKey]);
        let updateKeys = _.intersection(fromKeys, toKeys);
        updateKeys = _.filter(updateKeys, (key) => {
          let fromItem = _.find(fromData, (item) => item[uniqueKey] === key);
          let toItem = _.find(toData, (item) => item[uniqueKey] === key);
          fromItem._attachments = _.map(fromItem._attachments, (item) => _.omit(item, ["url"]));
          toItem._attachments = _.map(toItem._attachments, (item) => _.omit(item, ["url"]));
          return !_.isEqual(fromItem, toItem);
        });
        if (!_.isEmpty(updateKeys)) {
          _.each(updateKeys, (key) => {
            console.log(key, "local", _.find(fromData, { [uniqueKey]: key }), "remote", _.find(toData, { [uniqueKey]: key }));
          });
        }
        this.reportData = {
          create: _.difference(fromKeys, toKeys).length,
          remove: _.difference(toKeys, fromKeys).length,
          update: updateKeys.length
        };
      } catch (error) {
        console.error(error);
      }
      this.$loading.stop("loading-resource");
    },
    async onClickDeploy(from, to) {
      this.error = null;
      this.$loading.start("deploy-resource");
      this.syncingEnvironment = true;
      try {
        await axios.post(`../sync/${this.selectedResource}/from/${from}/to/${to}`);
        _.set(this.syncStatus, `${to}.status`, "syncing");
        this.syncStatus = _.clone(this.syncStatus);
      } catch (error) {
        console.error(error);
        this.syncingEnvironment = false;
        this.$loading.stop("deploy-resource");
      }
    }
  }
};
var _sfc_render$l = function render17() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "sync-resources main" }, [_c("h1", [_vm._v("Sync Resources")]), _vm.config ? _c("div", [_c("select", { directives: [{ name: "model", rawName: "v-model", value: _vm.selectedResource, expression: "selectedResource" }], on: { "change": [function($event) {
    var $$selectedVal = Array.prototype.filter.call($event.target.options, function(o) {
      return o.selected;
    }).map(function(o) {
      var val = "_value" in o ? o._value : o.value;
      return val;
    });
    _vm.selectedResource = $event.target.multiple ? $$selectedVal : $$selectedVal[0];
  }, _vm.onChangeResource] } }, _vm._l(_vm.config.sync.resources, function(item) {
    return _c("option", { key: item, domProps: { "value": item } }, [_vm._v(_vm._s(item))]);
  }), 0), !_vm.isEmpty(_vm.recordData) ? _c("div", { staticClass: "num-records" }, [_c("span", [_vm._v("number of records")]), _c("div", { staticClass: "num-records-wrapper" }, _vm._l(_vm.environments, function(env) {
    return _c("div", { key: env, staticClass: "num-record", attrs: { "num": _vm.environments.length } }, [_c("span", [_vm._v(_vm._s(env))]), _c("span", [_vm._v(_vm._s(_vm.get(_vm.recordData, `${env}.length`, "N/A")))])]);
  }), 0)]) : _vm._e(), !_vm.isEmpty(_vm.reportData) ? _c("div", { staticClass: "num-records" }, [_c("span", [_vm._v("records difference")]), _c("div", { staticClass: "num-records-wrapper" }, [_c("div", { staticClass: "num-record", attrs: { "num": "1", "set": _vm.enabled = _vm.get(_vm.recordData, `local.length`) !== void 0 && _vm.get(_vm.recordData, `remote.length`) !== void 0 } }, [_vm.enabled ? [_vm.get(_vm.syncStatus, "local.status") !== "syncing" && _vm.get(_vm.syncStatus, "remote.status") !== "syncing" ? [_c("span", [_vm._v("local / remote")]), _c("span", [_vm._v("create: " + _vm._s(_vm.reportData.create))]), _c("span", [_vm._v("update: " + _vm._s(_vm.reportData.update))]), _c("span", [_vm._v("remove: " + _vm._s(_vm.reportData.remove))]), _vm.includes(_vm.get(_vm.syncStatus, "remote.allows"), "write") ? _c("span", [_c("button", { on: { "click": function($event) {
    return _vm.onClickDeploy("local", "remote");
  } } }, [_vm._v("push to remote")])]) : _vm._e(), _vm.includes(_vm.get(_vm.syncStatus, "local.allows"), "write") ? _c("span", [_c("button", { on: { "click": function($event) {
    return _vm.onClickDeploy("remote", "local");
  } } }, [_vm._v("pull from remote")])]) : _vm._e()] : _vm._e(), _vm.get(_vm.syncStatus, "local.status") === "syncing" ? [_c("span", [_vm._v("resource: " + _vm._s(_vm.get(_vm.syncStatus, `local.resource`)))]), _c("span", [_vm._v("created: " + _vm._s(_vm.get(_vm.syncStatus, `local.created`)) + " / " + _vm._s(_vm.get(_vm.syncStatus, `local.createTotal`)))]), _c("span", [_vm._v("updated: " + _vm._s(_vm.get(_vm.syncStatus, `local.updated`)) + " / " + _vm._s(_vm.get(_vm.syncStatus, `local.updateTotal`)))]), _c("span", [_vm._v("removed: " + _vm._s(_vm.get(_vm.syncStatus, `local.removed`)) + " / " + _vm._s(_vm.get(_vm.syncStatus, `local.removeTotal`)))])] : _vm._e(), _vm.get(_vm.syncStatus, "remote.status") === "syncing" ? [_c("span", [_vm._v("resource: " + _vm._s(_vm.get(_vm.syncStatus, `remote.resource`)))]), _c("span", [_vm._v("created: " + _vm._s(_vm.get(_vm.syncStatus, `remote.created`)) + " / " + _vm._s(_vm.get(_vm.syncStatus, `remote.createTotal`)))]), _c("span", [_vm._v("updated: " + _vm._s(_vm.get(_vm.syncStatus, `remote.updated`)) + " / " + _vm._s(_vm.get(_vm.syncStatus, `remote.updateTotal`)))]), _c("span", [_vm._v("removed: " + _vm._s(_vm.get(_vm.syncStatus, `remote.removed`)) + " / " + _vm._s(_vm.get(_vm.syncStatus, `remote.removeTotal`)))])] : _vm._e()] : _vm._e(), !_vm.enabled ? _c("span", { staticClass: "na-field" }, [_vm._v(" N/A ")]) : _vm._e()], 2)])]) : _vm._e()]) : _vm._e(), _vm.error ? _c("div", { staticClass: "error" }, [_vm._v(" Error: " + _vm._s(_vm.error) + " ")]) : _vm._e()]);
};
var _sfc_staticRenderFns$l = [];
var __component__$l = /* @__PURE__ */ normalizeComponent(
  _sfc_main$l,
  _sfc_render$l,
  _sfc_staticRenderFns$l,
  false,
  null,
  "90250774",
  null,
  null
);
const SyncResource = __component__$l.exports;
let resources = {
  fieldIsRequired: "This field is required!",
  invalidFormat: "Invalid format!",
  numberTooSmall: "The number is too small! Minimum: {0}",
  numberTooBig: "The number is too big! Maximum: {0}",
  invalidNumber: "Invalid number",
  invalidInteger: "The value is not an integer",
  textTooSmall: "The length of text is too small! Current: {0}, Minimum: {1}",
  textTooBig: "The length of text is too big! Current: {0}, Maximum: {1}",
  thisNotText: "This is not a text!",
  thisNotArray: "This is not an array!",
  selectMinItems: "Select minimum {0} items!",
  selectMaxItems: "Select maximum {0} items!",
  invalidDate: "Invalid date!",
  dateIsEarly: "The date is too early! Current: {0}, Minimum: {1}",
  dateIsLate: "The date is too late! Current: {0}, Maximum: {1}",
  invalidEmail: "Invalid e-mail address!",
  invalidURL: "Invalid URL!",
  invalidCard: "Invalid card format!",
  invalidCardNumber: "Invalid card number!",
  invalidTextContainNumber: "Invalid text! Cannot contains numbers or special characters",
  invalidTextContainSpec: "Invalid text! Cannot contains special characters"
};
function checkEmpty(value, required, messages2 = resources) {
  if (!lodashExports.isNil(value) && value !== "") {
    return null;
  }
  return required ? [msg(messages2.fieldIsRequired)] : [];
}
function msg(text) {
  if (text != null && arguments.length > 1) {
    for (let i = 1; i < arguments.length; i++) {
      text = text.replace("{" + (i - 1) + "}", arguments[i]);
    }
  }
  return text;
}
const validators = {
  resources,
  required(value, field, model, messages2 = resources) {
    return checkEmpty(value, field.required, messages2);
  },
  number(value, field, model, messages2 = resources) {
    let res = checkEmpty(value, field.required, messages2);
    if (res != null) {
      return res;
    }
    let err = [];
    if (lodashExports.isFinite(value)) {
      if (!lodashExports.isNil(field.min) && value < field.min) {
        err.push(msg(messages2.numberTooSmall, field.min));
      }
      if (!lodashExports.isNil(field.max) && value > field.max) {
        err.push(msg(messages2.numberTooBig, field.max));
      }
    } else {
      err.push(msg(messages2.invalidNumber));
    }
    return err;
  },
  integer(value, field, model, messages2 = resources) {
    let res = checkEmpty(value, field.required, messages2);
    if (res != null) {
      return res;
    }
    let errs = validators.number(value, field, model, messages2);
    if (!lodashExports.isInteger(value)) {
      errs.push(msg(messages2.invalidInteger));
    }
    return errs;
  },
  double(value, field, model, messages2 = resources) {
    let res = checkEmpty(value, field.required, messages2);
    if (res != null) {
      return res;
    }
    if (!lodashExports.isNumber(value) || isNaN(value)) {
      return [msg(messages2.invalidNumber)];
    }
  },
  string(value, field, model, messages2 = resources) {
    let res = checkEmpty(value, field.required, messages2);
    if (res != null) {
      return res;
    }
    let err = [];
    if (lodashExports.isString(value)) {
      if (!lodashExports.isNil(field.min) && value.length < field.min) {
        err.push(msg(messages2.textTooSmall, value.length, field.min));
      }
      if (!lodashExports.isNil(field.max) && value.length > field.max) {
        err.push(msg(messages2.textTooBig, value.length, field.max));
      }
    } else {
      err.push(msg(messages2.thisNotText));
    }
    return err;
  },
  array(value, field, model, messages2 = resources) {
    if (field.required) {
      if (!lodashExports.isArray(value)) {
        return [msg(messages2.thisNotArray)];
      }
      if (value.length === 0) {
        return [msg(messages2.fieldIsRequired)];
      }
    }
    if (!lodashExports.isNil(value)) {
      if (!lodashExports.isNil(field.min) && value.length < field.min) {
        return [msg(messages2.selectMinItems, field.min)];
      }
      if (!lodashExports.isNil(field.max) && value.length > field.max) {
        return [msg(messages2.selectMaxItems, field.max)];
      }
    }
  },
  date(value, field, model, messages2 = resources) {
    let res = checkEmpty(value, field.required, messages2);
    if (res != null)
      return res;
    let m = new Date(value);
    if (isNaN(m.getDate())) {
      return [msg(messages2.invalidDate)];
    }
    let err = [];
    if (!lodashExports.isNil(field.min)) {
      let min = new Date(field.min);
      if (m.valueOf() < min.valueOf()) {
        err.push(msg(messages2.dateIsEarly, dayjs.format(m), dayjs.format(min)));
      }
    }
    if (!lodashExports.isNil(field.max)) {
      let max = new Date(field.max);
      if (m.valueOf() > max.valueOf()) {
        err.push(msg(messages2.dateIsLate, dayjs.format(m), dayjs.format(max)));
      }
    }
    return err;
  },
  regexp(value, field, model, messages2 = resources) {
    let res = checkEmpty(value, field.required, messages2);
    if (res != null) {
      return res;
    }
    if (!lodashExports.isNil(field.pattern)) {
      let re = new RegExp(field.pattern);
      if (!re.test(value)) {
        return [msg(messages2.invalidFormat)];
      }
    }
  },
  email(value, field, model, messages2 = resources) {
    let res = checkEmpty(value, field.required, messages2);
    if (res != null) {
      return res;
    }
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(value)) {
      return [msg(messages2.invalidEmail)];
    }
  },
  url(value, field, model, messages2 = resources) {
    let res = checkEmpty(value, field.required, messages2);
    if (res != null) {
      return res;
    }
    let re = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
    if (!re.test(value)) {
      return [msg(messages2.invalidURL)];
    }
  },
  creditCard(value, field, model, messages2 = resources) {
    let res = checkEmpty(value, field.required, messages2);
    if (res != null) {
      return res;
    }
    const creditCard = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/;
    const sanitized = value.replace(/[^0-9]+/g, "");
    if (!creditCard.test(sanitized)) {
      return [msg(messages2.invalidCard)];
    }
    let sum = 0;
    let digit;
    let tmpNum;
    let shouldDouble;
    for (let i = sanitized.length - 1; i >= 0; i--) {
      digit = sanitized.substring(i, i + 1);
      tmpNum = parseInt(digit, 10);
      if (shouldDouble) {
        tmpNum *= 2;
        if (tmpNum >= 10) {
          sum += tmpNum % 10 + 1;
        } else {
          sum += tmpNum;
        }
      } else {
        sum += tmpNum;
      }
      shouldDouble = !shouldDouble;
    }
    if (!(sum % 10 === 0 ? sanitized : false)) {
      return [msg(messages2.invalidCardNumber)];
    }
  },
  alpha(value, field, model, messages2 = resources) {
    let res = checkEmpty(value, field.required, messages2);
    if (res != null)
      return res;
    let re = /^[a-zA-Z]*$/;
    if (!re.test(value)) {
      return [msg(messages2.invalidTextContainNumber)];
    }
  },
  alphaNumeric(value, field, model, messages2 = resources) {
    let res = checkEmpty(value, field.required, messages2);
    if (res != null)
      return res;
    let re = /^[a-zA-Z0-9]*$/;
    if (!re.test(value)) {
      return [msg(messages2.invalidTextContainSpec)];
    }
  }
};
Object.keys(validators).forEach((name) => {
  const fn = validators[name];
  if (lodashExports.isFunction(fn)) {
    fn.locale = (customMessages) => (value, field, model) => fn(value, field, model, lodashExports.defaults(customMessages, resources));
  }
});
const slugifyFormID = (schema, prefix = "") => {
  if (typeof schema.id !== "undefined") {
    return prefix + schema.id;
  }
  return prefix + (schema.inputName || schema.label || schema.model || "").toString().trim().toLowerCase().replace(/ |_/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "").replace(/([^a-zA-Z0-9-]+)/g, "");
};
function convertValidator(validator) {
  if (lodashExports.isString(validator)) {
    if (validators[validator] != null)
      return validators[validator];
    else {
      console.warn(`'${validator}' is not a validator function!`);
      return null;
    }
  }
  return validator;
}
function attributesDirective(el, binding, vnode) {
  let attrs = lodashExports.get(vnode.context, "schema.attributes", {});
  let container = binding.value || "input";
  if (lodashExports.isString(container)) {
    attrs = lodashExports.get(attrs, container) || attrs;
  }
  lodashExports.forEach(attrs, (val, key) => {
    el.setAttribute(key, val);
  });
}
const AbstractField = {
  props: ["model", "schema", "formOptions", "disabled"],
  data() {
    return {
      errors: [],
      debouncedValidateFunc: null,
      debouncedFormatFunc: null
    };
  },
  directives: {
    attributes: {
      bind: attributesDirective,
      updated: attributesDirective,
      componentUpdated: attributesDirective
    }
  },
  computed: {
    value: {
      cache: false,
      get() {
        if (lodashExports.isFunction(lodashExports.get(this.schema, "get"))) {
          return this.schema.get(this.model);
        }
        return lodashExports.get(this.model, this.schema.model);
      },
      set(newValue) {
        let oldValue = this.value;
        if (lodashExports.isFunction(newValue)) {
          newValue(newValue, oldValue);
        } else {
          this.updateModelValue(newValue, oldValue);
        }
      }
    }
  },
  methods: {
    getOpt(opt, defaultVal) {
      return lodashExports.get(this.schema, `options.${opt}`, defaultVal);
    },
    validate(calledParent) {
      this.clearValidationErrors();
      let validateAsync = lodashExports.get(this.formOptions, "validateAsync", false);
      let results = [];
      if (this.schema.validator && this.schema.readonly !== true && this.disabled !== true) {
        let validators2 = [];
        if (!lodashExports.isArray(this.schema.validator)) {
          validators2.push(convertValidator(this.schema.validator).bind(this));
        } else {
          lodashExports.forEach(this.schema.validator, (validator) => {
            validators2.push(convertValidator(validator).bind(this));
          });
        }
        lodashExports.forEach(validators2, (validator) => {
          if (validateAsync) {
            results.push(validator(this.value, this.schema, this.model));
          } else {
            let result = validator(this.value, this.schema, this.model);
            if (result && lodashExports.isFunction(result.then)) {
              result.then((err) => {
                if (err) {
                  this.errors = this.errors.concat(err);
                }
                let isValid = this.errors.length === 0;
                this.$emit("validated", isValid, this.errors, this);
              });
            } else if (result) {
              results = results.concat(result);
            }
          }
        });
      }
      let handleErrors = (errors) => {
        let fieldErrors = [];
        lodashExports.forEach(lodashExports.uniq(errors), (err) => {
          if (lodashExports.isArray(err) && err.length > 0) {
            fieldErrors = fieldErrors.concat(err);
          } else if (lodashExports.isString(err)) {
            fieldErrors.push(err);
          }
        });
        if (lodashExports.isFunction(this.schema.onValidated)) {
          this.schema.onValidated.call(this, this.model, fieldErrors, this.schema);
        }
        let isValid = fieldErrors.length === 0;
        if (!calledParent) {
          this.$emit("validated", isValid, fieldErrors, this);
        }
        this.errors = fieldErrors;
        return fieldErrors;
      };
      if (!validateAsync) {
        return handleErrors(results);
      }
      return Promise.all(results).then(handleErrors);
    },
    debouncedValidate() {
      if (!lodashExports.isFunction(this.debouncedValidateFunc)) {
        this.debouncedValidateFunc = lodashExports.debounce(
          this.validate.bind(this),
          lodashExports.get(this.schema, "validateDebounceTime", lodashExports.get(this.formOptions, "validateDebounceTime", 500))
        );
      }
      this.debouncedValidateFunc();
    },
    updateModelValue(newValue, oldValue) {
      let changed = false;
      if (lodashExports.isFunction(this.schema.set)) {
        this.schema.set(this.model, newValue);
        changed = true;
      } else if (this.schema.model) {
        this.setModelValueByPath(this.schema.model, newValue);
        changed = true;
      }
      if (changed) {
        if (lodashExports.isFunction(this.schema.onChanged)) {
          this.schema.onChanged.call(this, this.model, newValue, oldValue, this.schema);
        }
        if (lodashExports.get(this.formOptions, "validateAfterChanged", false) === true) {
          if (lodashExports.get(this.schema, "validateDebounceTime", lodashExports.get(this.formOptions, "validateDebounceTime", 0)) > 0) {
            this.debouncedValidate();
          } else {
            this.validate();
          }
        }
        this.$emit("input", newValue, this.schema.model);
      }
    },
    clearValidationErrors() {
      this.errors.splice(0);
    },
    setModelValueByPath(path, value) {
      let s = path.replace(/\[(\w+)\]/g, ".$1");
      s = s.replace(/^\./, "");
      let o = this.model;
      const a = s.split(".");
      let i = 0;
      const n = a.length;
      while (i < n) {
        let k = a[i];
        if (i < n - 1) {
          if (o[k] !== void 0) {
            o = o[k];
          } else {
            this.$root.$set(o, k, {});
            o = o[k];
          }
        } else {
          this.$root.$set(o, k, value);
          return;
        }
        ++i;
      }
    },
    getKeyLocale() {
      const options = {};
      const list = this.schema.model.split(".");
      if (this.schema.localised) {
        options.locale = list.shift();
      }
      options.key = list.join(".");
      return options;
    },
    getFieldID(schema, unique = false) {
      const idPrefix = lodashExports.get(this.formOptions, "fieldIdPrefix", "");
      return slugifyFormID(schema, idPrefix) + (unique ? "-" + lodashExports.uniqueId() : "");
    },
    getFieldClasses() {
      return lodashExports.get(this.schema, "fieldClasses", []);
    }
  }
};
const _sfc_main$k = {
  mixins: [AbstractField],
  data() {
    return {
      options: {
        maxDepth: 0,
        modifiable: !this.disabled,
        rootObjectKey: this.schema.model
      }
    };
  },
  watch: {
    "schema.model": function() {
      this.options.rootObjectKey = this.schema.model;
    }
  },
  methods: {
    onChangeData(data) {
      console.warn("onChangeData - ", data);
      _.set(this.model, _.get(this.schema, "model", false), data);
    },
    get: _.get
  }
};
var _sfc_render$k = function render18() {
  var _vm = this, _c = _vm._self._c;
  return _vm.schema ? _c("tree-view", { key: _vm.schema.model, attrs: { "data": _vm.get(_vm.model, _vm.schema.model), "options": _vm.options }, on: { "change-data": _vm.onChangeData } }) : _vm._e();
};
var _sfc_staticRenderFns$k = [];
var __component__$k = /* @__PURE__ */ normalizeComponent(
  _sfc_main$k,
  _sfc_render$k,
  _sfc_staticRenderFns$k,
  false,
  null,
  null,
  null,
  null
);
const CustomTreeView = __component__$k.exports;
const CustomCode_vue_vue_type_style_index_0_lang = "";
const _sfc_main$j = {
  components: { codemirror: vueCodemirrorExports.codemirror },
  mixins: [AbstractField],
  data() {
    return {
      isReady: false,
      cmOption: {
        height: "auto",
        viewportMargin: Infinity,
        tabSize: this.getOpt("tabSize", 2),
        styleActiveLine: this.getOpt("styleActiveLine", true),
        lineNumbers: this.getOpt("lineNumbers", true),
        line: this.getOpt("line", true),
        foldGutter: this.getOpt("foldGutter", true),
        styleSelectedText: this.getOpt("styleSelectedText", true),
        mode: this.getOpt("mode", "javascript"),
        keyMap: "sublime",
        matchBrackets: this.getOpt("matchBrackets", true),
        showCursorWhenSelecting: this.getOpt("showCursorWhenSelecting", true),
        theme: "dracula",
        extraKeys: { "Ctrl": "autocomplete" },
        hintOptions: {
          completeSingle: false
        }
      }
    };
  },
  watch: {},
  mounted() {
    if (_.isObject(this.value)) {
      this.value = "";
    }
    if (_.get(this.cmOption, "mode", false) === "json") {
      this.cmOption.mode = "javascript";
    }
    this.isReady = true;
  },
  methods: {
    getStyle() {
      return _.merge({
        height: _.get(this.schema, "options.height", "auto"),
        width: _.get(this.schema, "options.width", "auto")
      }, _.get(this.schema, "options.css", {}));
    },
    onChangeData(data) {
      _.set(this.model, _.get(this.schema, "model", false), data);
    }
  }
};
var _sfc_render$j = function render19() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "code-wrapper" }, [_c("div", { staticClass: "label" }, [_vm._v(_vm._s(_vm.schema.label))]), _vm.isReady ? _c("codemirror", { style: _vm.getStyle(), attrs: { "options": _vm.cmOption }, on: { "input": _vm.onChangeData }, model: { value: _vm.value, callback: function($$v) {
    _vm.value = $$v;
  }, expression: "value" } }) : _vm._e()], 1);
};
var _sfc_staticRenderFns$j = [];
var __component__$j = /* @__PURE__ */ normalizeComponent(
  _sfc_main$j,
  _sfc_render$j,
  _sfc_staticRenderFns$j,
  false,
  null,
  null,
  null,
  null
);
const CustomCode = __component__$j.exports;
const _sfc_main$i = {
  mixins: [AbstractField],
  props: ["locale"],
  data() {
    return {
      acceptedModes: ["hexa", "rgba", "hsla", "hex", "rgb"],
      color: "",
      options: { outputModel: "hexa", hideInputs: false, hideCanvas: false, hideSliders: false, hideModeSwitch: false }
    };
  },
  watch: {
    color() {
      _.set(this.model, this.schema.model, this.color);
    },
    "schema.model": function() {
      this.color = this.getColor();
    }
  },
  created() {
    const options = _.extend(this.options, this.schema);
    if (_.indexOf(this.acceptedModes, options.outputModel) === -1) {
      console.warn(`Invalid color mode detected: '${options.outputModel}', will default to hexa`);
      options.outputModel = "hexa";
    }
    this.options = options;
  },
  mounted() {
    this.color = this.getColor();
  },
  methods: {
    getColor() {
      return _.get(this.model, this.schema.model);
    }
  }
};
var _sfc_render$i = function render20() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "wrapper-color" }, [_vm.options.model ? _c(__unplugin_components_0$7, { key: _vm.schema.model + "custom", class: { disabled: _vm.disabled }, attrs: { "dot-size": _vm.options.dotSize, "hide-canvas": _vm.options.hideCanvas, "hide-sliders": _vm.options.hideSliders, "hide-inputs": _vm.options.hideInputs, "hide-mode-switch": _vm.options.hideModeSwitch, "model": _vm.options.outputModel }, model: { value: _vm.color, callback: function($$v) {
    _vm.color = $$v;
  }, expression: "color" } }) : _vm._e()], 1);
};
var _sfc_staticRenderFns$i = [];
var __component__$i = /* @__PURE__ */ normalizeComponent(
  _sfc_main$i,
  _sfc_render$i,
  _sfc_staticRenderFns$i,
  false,
  null,
  null,
  null,
  null
);
const ColorPicker = __component__$i.exports;
const _sfc_main$h = {
  mixins: [AbstractField],
  data() {
    return {
      editor: null,
      originalValue: null
    };
  },
  watch: {
    "schema.model": function() {
      const value = _.extend(this.originalValue, _.get(this.model, this.schema.model));
      this.editor.setValue(value);
      _.set(this.model, this.schema.model, value);
    }
  },
  mounted() {
    const element = _.get(this.$refs, "json-editor", false);
    this.schema.jsonEditorOptions.title = " ";
    const options = {
      schema: this.schema.jsonEditorOptions,
      theme: "cms",
      iconlib: "foundation3"
    };
    if (this.disabled) {
      options.disable_array_delete = true;
    }
    jsoneditorExports.JSONEditor.defaults.themes.cms = class cms extends jsoneditorExports.JSONEditor.AbstractTheme {
      getRangeInput(min, max, step) {
        return super.getRangeInput(min, max, step);
      }
      getGridContainer() {
        const el = document.createElement("div");
        el.className = "json-editor-grid-container";
        return el;
      }
      getGridRow() {
        const el = document.createElement("div");
        el.className = "json-editor-grid-row";
        return el;
      }
      getFormInputLabel(text) {
        const el = super.getFormInputLabel(text);
        el.style.display = "inline-block";
        el.style.fontWeight = "bold";
        el.className = "json-editor-input-label";
        return el;
      }
      setGridColumnSize(el, size) {
        el.className = `span${size}`;
      }
      getSelectInput(options2) {
        const input = super.getSelectInput(options2);
        return input;
      }
      getFormInputField(type) {
        const el = super.getFormInputField(type);
        return el;
      }
      afterInputReady(input) {
        if (input.controlgroup) {
          return;
        }
        input.controlgroup = this.closest(input, ".control-group");
        input.controls = this.closest(input, ".controls");
        if (this.closest(input, ".compact")) {
          input.controlgroup.className = input.controlgroup.className.replace(/control-group/g, "").replace(/[ ]{2,}/g, " ");
          input.controls.className = input.controlgroup.className.replace(/controls/g, "").replace(/[ ]{2,}/g, " ");
          input.style.marginBottom = 0;
        }
        if (this.queuedInputErrorText) {
          const text = this.queuedInputErrorText;
          delete this.queuedInputErrorText;
          this.addInputError(input, text);
        }
      }
      getIndentedPanel() {
        const el = document.createElement("div");
        return el;
      }
      getModal() {
        const el = document.createElement("div");
        el.style.backgroundColor = "white";
        el.style.border = "1px solid black";
        el.style.boxShadow = "3px 3px black";
        el.style.position = "absolute";
        el.style.zIndex = "10";
        el.style.display = "none";
        el.style.width = "auto";
        return el;
      }
      getInfoButton(text) {
        const icon = document.createElement("span");
        icon.className = "icon-info-sign pull-right";
        icon.style.padding = ".25rem";
        icon.style.position = "relative";
        icon.style.display = "inline-block";
        const tooltip = document.createElement("span");
        tooltip.style["font-family"] = "sans-serif";
        tooltip.style.visibility = "hidden";
        tooltip.style["background-color"] = "rgba(50, 50, 50, .75)";
        tooltip.style.margin = "0 .25rem";
        tooltip.style.color = "#FAFAFA";
        tooltip.style.padding = ".5rem 1rem";
        tooltip.style["border-radius"] = ".25rem";
        tooltip.style.width = "25rem";
        tooltip.style.transform = "translateX(-27rem) translateY(-.5rem)";
        tooltip.style.position = "absolute";
        tooltip.innerText = text;
        icon.onmouseover = function() {
          tooltip.style.visibility = "visible";
        };
        icon.onmouseleave = function() {
          tooltip.style.visibility = "hidden";
        };
        icon.appendChild(tooltip);
        return icon;
      }
      getFormInputDescription(text) {
        const el = document.createElement("p");
        el.className = "help-inline";
        el.textContent = text;
        return el;
      }
      getFormControl(label, input, description, infoText) {
        const ret = document.createElement("div");
        ret.className = "control-group";
        const controls = document.createElement("div");
        controls.className = "controls";
        if (label && input.getAttribute("type") === "checkbox") {
          ret.appendChild(controls);
          label.className += " checkbox";
          label.appendChild(input);
          controls.appendChild(label);
          if (infoText) {
            controls.appendChild(infoText);
          }
          controls.style.height = "30px";
        } else {
          if (label) {
            label.className += " control-label";
            ret.appendChild(label);
          }
          if (infoText) {
            controls.appendChild(infoText);
          }
          controls.appendChild(input);
          ret.appendChild(controls);
        }
        if (description) {
          controls.appendChild(description);
        }
        return ret;
      }
      getHeaderButtonHolder() {
        const el = this.getButtonHolder();
        el.className += " btn-groups";
        return el;
      }
      getButtonHolder() {
        const el = document.createElement("div");
        el.className = "btn-group";
        return el;
      }
      getButton(text, icon, title) {
        const el = super.getButton(text, icon, title);
        el.className += " btn btn-default";
        return el;
      }
      getTable() {
        const el = document.createElement("table");
        el.className = "table table-bordered";
        return el;
      }
      getTableCell() {
        const el = document.createElement("td");
        return el;
      }
      addInputError(input, text) {
        if (!input.controlgroup) {
          this.queuedInputErrorText = text;
          return;
        }
        if (!input.controlgroup || !input.controls) {
          return;
        }
        input.controlgroup.className += " error";
        if (!input.errmsg) {
          input.errmsg = document.createElement("p");
          input.errmsg.className = "help-block errormsg";
          input.controls.appendChild(input.errmsg);
        } else {
          input.errmsg.style.display = "";
        }
        input.errmsg.textContent = text;
      }
      removeInputError(input) {
        if (!input.controlgroup) {
          delete this.queuedInputErrorText;
        }
        if (!input.errmsg) {
          return;
        }
        input.errmsg.style.display = "none";
        input.controlgroup.className = input.controlgroup.className.replace(/\s?error/g, "");
      }
      getTabHolder(propertyName) {
        const pName = typeof propertyName === "undefined" ? "" : propertyName;
        const el = document.createElement("div");
        el.className = "tabbable tabs-left";
        el.innerHTML = `<ul class='nav nav-tabs'  id='${pName}'></ul><div class='tab-content well well-small' id='${pName}'></div>`;
        return el;
      }
      getTopTabHolder(propertyName) {
        const pName = typeof propertyName === "undefined" ? "" : propertyName;
        const el = document.createElement("div");
        el.className = "tabbable tabs-over";
        el.innerHTML = `<ul class='nav nav-tabs' id='${pName}'></ul><div class='tab-content well well-small'  id='${pName}'></div>`;
        return el;
      }
      getTab(text, tabId) {
        const el = document.createElement("li");
        el.className = "nav-item";
        const a = document.createElement("a");
        a.setAttribute("href", `#${tabId}`);
        a.appendChild(text);
        el.appendChild(a);
        return el;
      }
      getTopTab(text, tabId) {
        const el = document.createElement("li");
        el.className = "nav-item";
        const a = document.createElement("a");
        a.setAttribute("href", `#${tabId}`);
        a.appendChild(text);
        el.appendChild(a);
        return el;
      }
      getTabContentHolder(tabHolder) {
        return tabHolder.children[1];
      }
      getTopTabContentHolder(tabHolder) {
        return tabHolder.children[1];
      }
      getTabContent() {
        const el = document.createElement("div");
        el.className = "tab-pane";
        return el;
      }
      getTopTabContent() {
        const el = document.createElement("div");
        el.className = "tab-pane";
        return el;
      }
      markTabActive(row) {
        row.tab.className = row.tab.className.replace(/\s?active/g, "");
        row.tab.className += " active";
        row.container.className = row.container.className.replace(/\s?active/g, "");
        row.container.className += " active";
      }
      markTabInactive(row) {
        row.tab.className = row.tab.className.replace(/\s?active/g, "");
        row.container.className = row.container.className.replace(/\s?active/g, "");
      }
      addTab(holder, tab) {
        holder.children[0].appendChild(tab);
      }
      addTopTab(holder, tab) {
        holder.children[0].appendChild(tab);
      }
      getProgressBar() {
        const container = document.createElement("div");
        container.className = "progress";
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.width = "0%";
        container.appendChild(bar);
        return container;
      }
      updateProgressBar(progressBar, progress) {
        if (!progressBar) {
          return;
        }
        progressBar.firstChild.style.width = `${progress}%`;
      }
      updateProgressBarUnknown(progressBar) {
        if (!progressBar) {
          return;
        }
        progressBar.className = "progress progress-striped active";
        progressBar.firstChild.style.width = "100%";
      }
    };
    this.editor = new jsoneditorExports.JSONEditor(element, options);
    if (this.disabled) {
      this.editor.disable();
    }
    this.editor.on("ready", () => {
      this.originalValue = this.editor.getValue();
      const value = _.extend(this.originalValue, _.get(this.model, this.schema.model));
      this.editor.setValue(value);
      _.set(this.model, this.schema.model, value);
    });
    this.editor.on("change", () => {
      const value = this.editor.getValue();
      _.set(this.model, this.schema.model, value);
    });
  },
  methods: {}
};
var _sfc_render$h = function render21() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { ref: "json-editor", staticClass: "json-editor", attrs: { "disabled": _vm.disabled } });
};
var _sfc_staticRenderFns$h = [];
var __component__$h = /* @__PURE__ */ normalizeComponent(
  _sfc_main$h,
  _sfc_render$h,
  _sfc_staticRenderFns$h,
  false,
  null,
  null,
  null,
  null
);
const JsonEditor = __component__$h.exports;
const Wysiwyg_vue_vue_type_style_index_0_scoped_2730a736_lang = "";
const _sfc_main$g = {
  components: { TiptapVuetify: Ci },
  mixins: [AbstractField],
  data() {
    return {
      localObj: this.model,
      loaded: false,
      key: null,
      extensions: [
        qi,
        ji,
        Ki,
        Pi,
        Ii,
        Li,
        Vi,
        zi,
        $i,
        [Ni, {
          options: {
            levels: [1, 2, 3]
          }
        }],
        Ri,
        Di,
        Fi,
        Bi,
        Hi
      ]
    };
  },
  watch: {
    model() {
      this.updateObj();
    }
  },
  mounted() {
    this.updateObj();
  },
  created() {
  },
  methods: {
    getColorForToolbar() {
      return this.$vuetify.theme.dark ? "black" : "white";
    },
    onInit() {
      setTimeout(() => {
        const elems = _.get(this.$refs.wysiwygWrapper, "children[1].children[0].children[0].children[0].children[0].children[0].children", []);
        _.each(elems, (elem) => {
          elem.tabIndex = -1;
          _.each(elem.children, (children) => {
            children.tabIndex = -1;
            _.each(children.children, (c) => {
              c.tabIndex = -1;
            });
          });
        });
      }, 10);
    },
    updateObj() {
      if (!_.get(this.schema, "model", false)) {
        return false;
      }
      const list = this.schema.model.split(".");
      this.key = list.pop();
      this.localObj = _.reduce(list, (memo, item) => {
        return memo[item];
      }, this.model);
      this.localObj[this.key] = this.localObj[this.key] || "";
      this.loaded = true;
    }
  }
};
var _sfc_render$g = function render22() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { ref: "wysiwygWrapper", staticClass: "wysiwyg-wrapper" }, [_c("div", { staticClass: "field-label" }, [_vm._v(_vm._s(_vm.schema.label))]), _c("div", { staticClass: "border-wrapper" }, [_c("tiptap-vuetify", { attrs: { "card-props": { flat: true }, "extensions": _vm.extensions, "toolbar-attributes": { color: _vm.getColorForToolbar(), dense: true, outlined: true, elevation: 1 }, "disabled": _vm.disabled, "placeholder": "Write something …" }, on: { "init": _vm.onInit, "blur": _vm.onInit, "focus": _vm.onInit }, model: { value: _vm.localObj[_vm.key], callback: function($$v) {
    _vm.$set(_vm.localObj, _vm.key, $$v);
  }, expression: "localObj[key]" } })], 1)]);
};
var _sfc_staticRenderFns$g = [];
var __component__$g = /* @__PURE__ */ normalizeComponent(
  _sfc_main$g,
  _sfc_render$g,
  _sfc_staticRenderFns$g,
  false,
  null,
  "2730a736",
  null,
  null
);
const WysiwygField = __component__$g.exports;
const DragList = {
  data() {
    return {
      dragging: false,
      dragOptions: {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost"
      }
    };
  },
  methods: {
    onStartDrag() {
      this.dragging = true;
    },
    viewFile(attachment = false) {
      var a = attachment || this.attachment();
      const filenameComponents = _.get(a, "_filename", "").split(".");
      const suffix = filenameComponents.length > 1 ? `.${_.last(filenameComponents)}` : "";
      const win = window.open(window.origin + a.url + suffix, "_blank");
      win.focus();
      console.log(a);
    }
  }
};
const ParagraphView_vue_vue_type_style_index_0_scoped_c464b631_lang = "";
const ParagraphView_vue_vue_type_style_index_1_lang = "";
const defaultTypes = [
  "string",
  "text",
  "password",
  "email",
  "url",
  "number",
  "double",
  "integer",
  "checkbox",
  "date",
  "time",
  "datetime",
  "pillbox",
  "json",
  "code",
  "wysiwyg",
  "object",
  "color",
  "image",
  "file"
];
const _sfc_main$f = {
  mixins: [DragList],
  props: ["schema", "vfg", "model", "disabled"],
  data() {
    return {
      items: _.cloneDeep(_.get(this.model, this.schema.model, [])),
      types: [],
      selectedType: false,
      localModel: {},
      key: v4()
    };
  },
  watch: {
    "schema.model": function() {
      this.items = _.cloneDeep(_.get(this.model, this.schema.model, []));
    }
  },
  created() {
    this.updateLocalData();
  },
  mounted() {
    const types = _.get(this, "schema.types", defaultTypes);
    this.types = _.map(types, (type) => {
      if (_.isString(type)) {
        type = {
          input: type,
          parentKey: this.schema.model
        };
      }
      if (!type.label) {
        type.label = _.includes(["select", "multiselect"], type.input) ? `${type.input}(${type.source})` : type.input;
      }
      return type;
    });
    this.selectedType = _.first(this.types);
  },
  methods: {
    onError(error) {
      console.error("ParagraphView - error", error);
    },
    updateLocalData() {
      this.localModel = _.cloneDeep(this.model);
    },
    validate() {
      _.each(this.$refs.vfg, (vfg) => {
        if (!vfg.validate()) {
          this.errors = vfg.errors;
          throw new Error("group validation error");
        }
      });
      return true;
    },
    debouncedValidate() {
      _.each(this.$refs.vfg, (vfg) => {
        vfg.debouncedValidate();
      });
    },
    clearValidationErrors() {
      _.each(this.$refs.vfg, (vfg) => {
        vfg.clearValidationErrors();
      });
    },
    getSchema(item) {
      let schemaItems = [];
      const { resource, locale, userLocale, disabled } = this.schema;
      if (item.input === "group") {
        schemaItems = _.map(item.schema, (schemaItems2) => {
          return _.extend({}, schemaItems2, {
            field: `value.${schemaItems2.field}`,
            localised: this.schema.localised,
            label: schemaItems2.label || schemaItems2.field
          });
        });
      } else {
        const schemaItem = _.extend({}, item, {
          field: "value",
          localised: this.schema.localised
        });
        schemaItems.push(schemaItem);
      }
      _.each(schemaItems, (item2) => {
        if (_.includes(["image", "file"], item2.input)) {
          item2.input = _.camelCase(`paragraph ${item2.input}`);
        }
      });
      let extraSources = {};
      if (_.isString(item.source)) {
        extraSources = _.get(ResourceService$1.getSchema(item.source), "extraSources", {});
      }
      const fields = SchemaService$1.getSchemaFields(schemaItems, resource, locale, userLocale, disabled, extraSources, this.schema.rootView || this);
      const groups = SchemaService$1.getNestedGroups(resource, fields, 0, null, "value.");
      return { fields: groups };
    },
    getAttachment(fileItemId, field) {
      const attach = _.find(this.model._attachments, { _fields: { fileItemId } });
      if (field) {
        return _.get(attach, field);
      }
      return attach;
    },
    onChangeType(type) {
      const foundType = _.find(this.types, { label: type });
      if (_.isUndefined(foundType)) {
        return console.warn(`No type found for ${type} in types:`, this.types);
      }
      this.selectedType = foundType;
    },
    onClickAddNewItem() {
      if (this.selectedType) {
        const newItem = _.cloneDeep(this.selectedType);
        this.items.push(newItem);
        _.set(this.localModel, this.schema.model, this.items);
        this.$emit("input", this.localModel, this.schema.model);
      }
    },
    onClickRemoveItem(item) {
      console.warn("onClickRemoveItem -", item);
      let attachments = _.get(this.model, "_attachments", []);
      if (_.includes(["image", "file", "group"], item.input)) {
        const findIds = (obj) => {
          const ids2 = [];
          _.each(obj, (value, key) => {
            if (key === "id") {
              return ids2.push(value);
            }
            if (_.isPlainObject(value) || _.isArray(value)) {
              ids2.push(...findIds(value));
            }
          });
          return ids2;
        };
        const ids = findIds(item);
        console.warn("IDS = ", ids);
        _.each(ids, (fileItemId) => {
          attachments = _.reject(attachments, { _fields: { fileItemId } });
        });
      }
      this.items = _.difference(this.items, [item]);
      _.set(this.localModel, this.schema.model, this.items);
      _.set(this.model, "_attachments", attachments);
      this.items = _.clone(this.items);
      this.key = v4();
      this.$emit("input", this.items, this.schema.model);
    },
    onChange() {
      _.set(this.localModel, this.schema.model, this.items);
      this.$emit("input", this.items, this.schema.model);
    },
    onEndDrag() {
      this.dragging = false;
      _.set(this.localModel, this.schema.model, this.items);
      this.key = v4();
      this.$emit("input", this.items, this.schema.model);
    },
    onModelUpdated(value, model) {
      _.set(this.localModel, this.schema.model, this.items);
      this.$emit("input", this.items, this.schema.model);
    }
  }
};
var _sfc_render$f = function render23() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "paragraph-view" }, [_vm.schema ? _c("draggable", _vm._b({ key: `${_vm.schema.model}-${_vm.key}`, class: { disabled: _vm.disabled }, attrs: { "list": _vm.items, "draggable": ".item", "handle": ".handle", "group": `${_vm.schema.model}-${_vm.key}`, "ghost-class": "ghost" }, on: { "end": _vm.onEndDrag, "start": function($event) {
    _vm.dragging = true;
  } } }, "draggable", _vm.dragOptions, false), [_vm._l(_vm.items, function(item, idx) {
    return _c(__unplugin_components_2$3, { key: `paragraph-item-${idx}`, staticClass: "item" }, [_c("span", { staticClass: "handle" }), _c("div", { staticClass: "item-main-wrapper" }, [_c("div", { staticClass: "item-main" }, [_c("custom-form", { attrs: { "schema": _vm.getSchema(item), "model": item }, on: { "error": _vm.onError, "input": _vm.onModelUpdated } })], 1), _c(__unplugin_components_1, { staticClass: "add-new-item", attrs: { "fab": "", "small": "" }, on: { "click": function($event) {
      return _vm.onClickRemoveItem(item);
    } } }, [_c(__unplugin_components_5, [_vm._v("mdi-minus")])], 1)], 1)]);
  }), _c("div", { attrs: { "slot": "header" }, slot: "header" }, [_c(__unplugin_components_3$3, { attrs: { "label": _vm.schema.label, "value": _vm.selectedType, "menu-props": { bottom: true, offsetY: true }, "items": _vm.types, "item-text": "label", "item-value": "label", "hide-details": "", "outlined": "", "dense": "", "persistent-placeholder": "" }, on: { "change": _vm.onChangeType } }), _c(__unplugin_components_1, { staticClass: "add-new-item", attrs: { "fab": "", "small": "" }, on: { "click": _vm.onClickAddNewItem } }, [_c(__unplugin_components_5, [_vm._v("mdi-plus")])], 1)], 1)], 2) : _vm._e()], 1);
};
var _sfc_staticRenderFns$f = [];
var __component__$f = /* @__PURE__ */ normalizeComponent(
  _sfc_main$f,
  _sfc_render$f,
  _sfc_staticRenderFns$f,
  false,
  null,
  "c464b631",
  null,
  null
);
const ParagraphView = __component__$f.exports;
const FileInputField = {
  data() {
    return {
      dragover: false,
      attachments: [],
      localModel: false
    };
  },
  mounted() {
    this.localModel = _.cloneDeep(this.model);
    this.attachments = this.getAttachments();
  },
  methods: {
    onEndDrag({ newIndex, oldIndex }) {
      this.dragging = false;
      const items = _.map(this.getAttachments(), (item, i) => {
        if (item.order !== i + 1) {
          item.order = i + 1;
          item.orderUpdated = true;
        }
        return item;
      });
      let orderedAttachments = _.map(this.localModel._attachments, (attachment) => {
        if (!this.isSameAttachment(attachment)) {
          return attachment;
        }
        const foundOrder = _.get(_.find(items, { orderUpdated: true, _filename: attachment._filename, _size: attachment._size, url: attachment.url }), "order", 0);
        if (foundOrder !== 0 && foundOrder !== _.get(attachment, "order", -1)) {
          attachment.order = foundOrder;
          attachment.orderUpdated = true;
        }
        return attachment;
      });
      orderedAttachments = _.orderBy(orderedAttachments, ["order"], ["asc"]);
      this.attachments = _.filter(orderedAttachments, (attachment) => this.isSameAttachment(attachment));
      this.$emit("input", orderedAttachments, this.schema.model);
    },
    getImageSrc(attachment = false) {
      const a = attachment || this.attachment();
      return a.data ? a.data : this.getPreviewUrl(a);
    },
    isImage(attachment = false) {
      const a = attachment || this.attachment();
      return a && /image/g.test(a._contentType || a.file && a.file.type);
    },
    getPreviewUrl(attachment = false) {
      const a = attachment || this.attachment();
      return `${a.url}?resize=autox100`;
    },
    isSameAttachment(attachment) {
      const { key, locale } = this.getKeyLocale();
      return attachment._name === key && (attachment._fields && attachment._fields.locale) === locale;
    },
    attachment() {
      return _.find(this.localModel._attachments, (attachment) => this.isSameAttachment(attachment));
    },
    getAttachments() {
      if (_.get(this.attachments, "length", 0) !== 0) {
        return this.attachments;
      }
      return _.filter(this.localModel._attachments, (attachment) => this.isSameAttachment(attachment));
    },
    imageSize(attachment = false) {
      const a = attachment || this.attachment();
      return this.bytesToSize(_.get(a, "_size", _.get(a, "file.size", false)));
    },
    bytesToSize(bytes) {
      if (bytes === 0) {
        return "0 Byte";
      }
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
      const result = Math.round(bytes / Math.pow(1024, i), 2);
      return _.isNaN(result) ? "Unknown" : `${result} ${sizes[i]}`;
    },
    isForMultipleImages() {
      if (this.schema.width && this.schema.height) {
        return false;
      }
      const maxCount = this.getMaxCount();
      return maxCount === -1 ? true : maxCount > 1;
    },
    isFieldDisabled() {
      const maxCount = this.getMaxCount();
      if (maxCount === -1) {
        return false;
      }
      return this.getAttachments().length >= maxCount;
    },
    getFieldType() {
      return _.toUpper(_.get(this.schema, "type", "ImageView") === "ImageView" ? "image" : "file");
    },
    isFieldValid() {
      return _.get(_.compact(this.getRules()), "length", 0) === 0;
    },
    getRules() {
      const rules = [];
      if (this.schema.required) {
        rules.push((v) => !!v || _.get(this.getAttachments(), "length", 0) !== 0 || TranslateService$4.get(`TL_${this.getFieldType()}_IS_MANDATORY`));
      }
      if (this.isForMultipleImages()) {
        rules.push((files) => {
          const maxCount = this.getMaxCount();
          if (maxCount === -1 || _.get(this.getAttachments(), "length", 0) + _.get(files, "length", 0) <= maxCount) {
            return true;
          }
          return TranslateService$4.get(`TL_TOO_MANY_${this.getFieldType()}S`);
        });
        if (_.get(this.schema, "options.limit", false)) {
          rules.push((files) => !files || !files.some((file) => file.size > this.schema.limit) || TranslateService$4.get(`TL_${this.getFieldType()}_IS_TOO_BIG`));
        }
      } else {
        if (_.get(this.schema, "options.limit", false)) {
          rules.push((file) => !file || file.size <= this.schema.limit || TranslateService$4.get(`TL_${this.getFieldType()}_IS_TOO_BIG`));
        }
      }
      return rules;
    },
    getPlaceholder() {
      return `TL_CLICK_OR_DRAG_AND_DROP_TO_ADD_${this.getFieldType()}${this.isForMultipleImages() ? "S" : ""}`;
    },
    getMaxCount() {
      return _.get(this.schema, "options.maxCount", -1);
    },
    getFileSizeLimit(limit) {
      const kbLimit = limit / 1024;
      return kbLimit > 1e3 ? `${kbLimit / 1e3} MB` : `${kbLimit} KB`;
    },
    removeImage(attachment) {
      this.$refs.fileInput.internalValue = null;
      this.$refs.fileInput.$refs.input.value = null;
      this.localModel._attachments = _.filter(this.localModel._attachments, (item) => item !== attachment);
      this.attachments = _.filter(this.localModel._attachments, (attachment2) => this.isSameAttachment(attachment2));
      this.$forceUpdate();
      this.$emit("input", this.localModel._attachments, this.schema.model);
      const dummy = this.schema.label;
      this.schema.label = null;
      this.schema.label = dummy;
    },
    onDrop(event2) {
      this.dragover = false;
      const maxCount = this.getMaxCount();
      if (maxCount !== -1 && maxCount <= 1 && event2.dataTransfer.files.length > 1) {
        return console.error("Only one file can be uploaded at a time..");
      }
      this.onUploadChanged(event2.dataTransfer.files);
    },
    async onUploadChanged(files) {
      this.$refs.fileInput.validate();
      if (!this.$refs.fileInput.valid) {
        return;
      }
      files = _.isNull(files) ? [] : files;
      if (!_.isArray(files)) {
        files = [files];
      }
      if (!files.length) {
        return;
      }
      const maxCount = this.getMaxCount();
      const totalNbFiles = this.getAttachments().length + files.length;
      if (maxCount > 1 && totalNbFiles > maxCount) {
        console.warn("reached max", totalNbFiles, maxCount);
        files = _.take(files, files.length - (totalNbFiles - maxCount));
      } else if (maxCount === 1 && totalNbFiles > 1) {
        this.localModel._attachments = _.filter(this.localModel._attachments, (attachment) => !this.isSameAttachment(attachment));
      }
      this.attachments = _.filter(await this.readAllFiles(files), (attachment) => this.isSameAttachment(attachment));
      this.$forceUpdate();
      this.$emit("input", this.localModel._attachments, this.schema.model);
    },
    async readAllFiles(files) {
      let nbFilesToRead = _.get(files, "length", 1);
      return new Promise((resolve, reject) => {
        _.each(files, (file, i) => {
          const reader = new FileReader();
          const vm = this;
          reader.onload = (element) => {
            const { key, locale } = vm.getKeyLocale();
            const newAttachment = {
              _filename: file.name,
              _name: key,
              _fields: {
                locale
              },
              field: this.schema.model,
              localised: this.schema.localised,
              file,
              data: element.target.result
            };
            vm.localModel._attachments.push(newAttachment);
            vm.$forceUpdate();
            nbFilesToRead--;
            if (nbFilesToRead === 0) {
              if (this.isForMultipleImages()) {
                _.each(vm.localModel._attachments, (a, i2) => {
                  a.order = i2 + 1;
                  a.orderUpdated = true;
                });
              }
              resolve(vm.localModel._attachments);
            }
          };
          try {
            reader.readAsDataURL(file);
          } catch (error) {
          }
        });
      });
    }
    // onFileSizeExceed () {
    //   this.notify(TranslateService.get('TL_FILE_SIZE_EXCEED', null, { size: this.schema.limit / 1024 }), 'error')
    // },
    // onFileTypeMismatch () {
    //   this.notify(TranslateService.get('TL_FILE_TYPE_MISMATCH'), 'error')
    // }
  }
};
const _sfc_main$e = {
  components: {
    Cropper: ne
  },
  mixins: [Notification, AbstractField, FileInputField, DragList],
  data() {
    return {
      firstCropUpdate: true,
      stencilProps: {
        class: "cropper-stencil",
        previewClass: "cropper-stencil__preview",
        draggingClass: "cropper-stencil--dragging",
        handlersClasses: {
          default: "cropper-handler",
          eastNorth: "cropper-handler--east-north",
          westNorth: "cropper-handler--west-north",
          eastSouth: "cropper-handler--east-south",
          westSouth: "cropper-handler--west-south"
        }
      }
    };
  },
  methods: {
    getDefaultCropPosition({ imageSize, visibleArea, coordinates }) {
      const attachment = this.attachment();
      if (_.get(attachment, "cropOptions", false)) {
        return {
          left: attachment.cropOptions.left,
          top: attachment.cropOptions.top
        };
      } else {
        console.warn("no crop options");
      }
      const area = visibleArea || imageSize;
      return {
        left: (visibleArea ? visibleArea.left : 0) + area.width / 2 - coordinates.width / 2,
        top: (visibleArea ? visibleArea.top : 0) + area.height / 2 - coordinates.height / 2
      };
    },
    getDefaultCropSize() {
      return {
        width: _.get(this.schema, "options.width", 500),
        height: _.get(this.schema, "options.height", 500)
      };
    },
    onCropperChange(data) {
      const attachment = this.attachment();
      _.each(this.localModel._attachments, (localAttachment) => {
        if (localAttachment._id === attachment._id) {
          localAttachment.cropOptions = data.coordinates;
          if (this.firstCropUpdate) {
            this.firstCropUpdate = false;
          } else {
            localAttachment.cropOptions.updated = true;
          }
        }
      });
      this.$emit("input", this.localModel._attachments, this.schema.model);
    },
    imageUrl() {
      const attachment = this.attachment();
      return attachment && (attachment.url || attachment.data);
    }
  }
};
var _sfc_render$e = function render24() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "image-view", class: { "full-width": !(_vm.schema.width && _vm.schema.height) } }, [!_vm.disabled ? _c("form", { attrs: { "enctype": "multipart/form-data" } }, [_c(__unplugin_components_2$3, { staticClass: "file-input-card", class: { "drag-and-drop": _vm.dragover }, attrs: { "elevation": "0" }, on: { "drop": function($event) {
    $event.preventDefault();
    return _vm.onDrop($event);
  }, "dragover": function($event) {
    $event.preventDefault();
    _vm.dragover = true;
  }, "dragenter": function($event) {
    $event.preventDefault();
    _vm.dragover = true;
  }, "dragleave": function($event) {
    $event.preventDefault();
    _vm.dragover = false;
  } } }, [_c(__unplugin_components_1$2, { ref: "fileInput", attrs: { "rules": _vm.getRules(), "hide-details": _vm.isFieldValid(), "label": _vm.schema.label, "placeholder": _vm._f("translate")(_vm.getPlaceholder()), "clearable": false, "dense": "", "outlined": "", "persistent-placeholder": "", "persistent-hint": "", "multiple": _vm.isForMultipleImages(), "accept": _vm.schema.accept, "disabled": _vm.isForMultipleImages() && _vm.isFieldDisabled() }, on: { "change": _vm.onUploadChanged }, scopedSlots: _vm._u([{ key: "selection", fn: function({ index }) {
    return [index === 0 ? _c("div", { staticClass: "v-file-input__text v-file-input__text--placeholder" }, [_vm._v(" " + _vm._s(_vm._f("translate")(_vm.getPlaceholder())) + " ")]) : _vm._e()];
  } }], null, false, 3100899402) })], 1)], 1) : _vm._e(), _vm.isForMultipleImages() ? _c("div", { staticClass: "preview-multiple" }, [_vm.schema ? _c("draggable", _vm._b({ key: `${_vm.schema.model}`, class: { disabled: _vm.disabled }, attrs: { "list": _vm.getAttachments(), "draggable": ".preview-attachment", "handle": ".row-handle", "ghost-class": "ghost" }, on: { "end": _vm.onEndDrag, "start": _vm.onStartDrag } }, "draggable", _vm.dragOptions, false), _vm._l(_vm.getAttachments(), function(a, i) {
    return _c(__unplugin_components_2$3, { key: `${a._filename}-${i}`, staticClass: "preview-attachment", class: { odd: i % 2 !== 0 } }, [_c(__unplugin_components_3$2, { staticClass: "filename", attrs: { "close": "" }, on: { "click:close": function($event) {
      return _vm.removeImage(a);
    } } }, [_vm._v("#" + _vm._s(i + 1) + " - " + _vm._s(_vm._f("truncate")(a._filename, 10)) + " (" + _vm._s(_vm.imageSize(a)) + ")")]), _c("div", { staticClass: "row-handle" }, [_c("img", { attrs: { "src": _vm.getImageSrc(a) } }), _c(__unplugin_components_5, [_vm._v("mdi-drag")])], 1)], 1);
  }), 1) : _vm._e()], 1) : _vm.attachment() && _vm.isImage() ? [!(_vm.schema.width && _vm.schema.height) ? _c("div", { staticClass: "preview-single-attachment" }, [_c(__unplugin_components_3$2, { staticClass: "filename", attrs: { "close": "" }, on: { "click:close": function($event) {
    _vm.removeImage(_vm.attachment());
  } } }, [_vm._v(_vm._s(_vm._f("truncate")(_vm.attachment()._filename, 10)) + " (" + _vm._s(_vm.imageSize(_vm.attachment())) + ")")]), _c("img", { staticClass: "preview", attrs: { "src": _vm.getImageSrc() } })], 1) : [_c("cropper", { ref: "cropper", staticClass: "cropper", attrs: { "src": _vm.imageUrl(), "transitions": true, "image-restriction": "fill-area", "image-class": "cropper__image", "default-boundaries": "fill", "default-size": _vm.schema.options.width && _vm.schema.options.height ? _vm.getDefaultCropSize() : false, "default-position": _vm.getDefaultCropPosition, "min-width": _vm.schema.options.width, "max-width": _vm.schema.options.width, "min-height": _vm.schema.options.height, "max-height": _vm.schema.options.height, "move-image": _vm.schema.options.moveImage ? true : false, "resize-image": _vm.schema.options.resizeImage ? true : false, "stencil-props": _vm.stencilProps }, on: { "change": _vm.onCropperChange } })]] : _vm._e(), _vm.isForMultipleImages() ? [_c("div", { staticClass: "help-block" }, [_c(__unplugin_components_5, { attrs: { "small": "" } }, [_vm._v("mdi-information")]), _vm.getMaxCount() !== -1 ? _c("span", [_vm._v(_vm._s(_vm._f("translate")("TL_MAX_NUMBER_OF_IMAGES", null, { num: _vm.getMaxCount() })))]) : _c("span", [_vm._v(_vm._s(_vm._f("translate")("TL_UNLIMITED_NUMBER_OF_IMAGES")))])], 1)] : _vm._e(), _vm.schema.width && _vm.schema.height ? _c("div", { staticClass: "help-block" }, [_c(__unplugin_components_5, { attrs: { "small": "" } }, [_vm._v("mdi-information")]), _c("span", [_vm._v(_vm._s(_vm._f("translate")("TL_THIS_FIELD_REQUIRES_THE_FOLLOWING_SIZE")) + ":" + _vm._s(_vm.schema.width) + "x" + _vm._s(_vm.schema.height))])], 1) : _vm._e(), _vm.schema.limit ? _c("div", { staticClass: "help-block" }, [_c(__unplugin_components_5, { attrs: { "small": "" } }, [_vm._v("mdi-information")]), _c("span", [_vm._v(_vm._s(_vm._f("translate")("TL_THIS_FIELD_REQUIRES_A_FILE_SIZE")) + ": " + _vm._s(_vm.getFileSizeLimit(_vm.schema.limit)))])], 1) : _vm._e(), _vm.schema.accept ? _c("div", { staticClass: "help-block" }, [_c(__unplugin_components_5, { attrs: { "small": "" } }, [_vm._v("mdi-information")]), _c("span", [_vm._v(_vm._s(_vm._f("translate")("TL_THIS_FIELD_REQUIRES")) + ": " + _vm._s(_vm.schema.accept))])], 1) : _vm._e()], 2);
};
var _sfc_staticRenderFns$e = [];
var __component__$e = /* @__PURE__ */ normalizeComponent(
  _sfc_main$e,
  _sfc_render$e,
  _sfc_staticRenderFns$e,
  false,
  null,
  null,
  null,
  null
);
const ImageView = __component__$e.exports;
const _sfc_main$d = {
  mixins: [AbstractField, FileInputField, DragList]
};
var _sfc_render$d = function render25() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "attachment-view" }, [!_vm.disabled ? _c("form", { attrs: { "enctype": "multipart/form-data" } }, [_c(__unplugin_components_2$3, { staticClass: "file-input-card", class: { "drag-and-drop": _vm.dragover }, attrs: { "elevation": "0" }, on: { "drop": function($event) {
    $event.preventDefault();
    return _vm.onDrop($event);
  }, "dragover": function($event) {
    $event.preventDefault();
    _vm.dragover = true;
  }, "dragenter": function($event) {
    $event.preventDefault();
    _vm.dragover = true;
  }, "dragleave": function($event) {
    $event.preventDefault();
    _vm.dragover = false;
  } } }, [_c(__unplugin_components_1$2, { ref: "fileInput", attrs: { "rules": _vm.getRules(), "label": _vm.schema.label, "placeholder": _vm._f("translate")(_vm.getPlaceholder()), "clearable": false, "dense": "", "outlined": "", "persistent-placeholder": "", "persistent-hint": "", "multiple": _vm.isForMultipleImages(), "accept": _vm.schema.accept, "disabled": _vm.isForMultipleImages() && _vm.isFieldDisabled() }, on: { "change": _vm.onUploadChanged }, scopedSlots: _vm._u([{ key: "selection", fn: function({ index }) {
    return [index === 0 ? _c("div", { staticClass: "v-file-input__text v-file-input__text--placeholder" }, [_vm._v(" " + _vm._s(_vm._f("translate")(_vm.getPlaceholder())) + " ")]) : _vm._e()];
  } }], null, false, 3100899402) })], 1)], 1) : _vm._e(), _vm.isForMultipleImages() ? _c("div", { staticClass: "preview-multiple" }, [_vm.schema ? _c("draggable", _vm._b({ key: `${_vm.schema.model}`, class: { disabled: _vm.disabled }, attrs: { "list": _vm.getAttachments(), "draggable": ".preview-attachment", "handle": ".row-handle", "ghost-class": "ghost" }, on: { "end": _vm.onEndDrag, "start": _vm.onStartDrag } }, "draggable", _vm.dragOptions, false), _vm._l(_vm.getAttachments(), function(a, i) {
    return _c(__unplugin_components_2$3, { key: `${a._filename}-${i}`, staticClass: "preview-attachment", class: { odd: i % 2 !== 0 } }, [_c(__unplugin_components_3$2, { staticClass: "filename", attrs: { "close": "" }, on: { "click:close": function($event) {
      return _vm.removeImage(a);
    } } }, [_vm._v("#" + _vm._s(i + 1) + " - " + _vm._s(_vm._f("truncate")(a._filename, 10)) + " (" + _vm._s(_vm.imageSize(a)) + ")")]), _c("div", { staticClass: "row-handle" }, [_vm.isImage() ? _c("img", { attrs: { "src": _vm.getImageSrc(a) } }) : _c(__unplugin_components_1, { attrs: { "small": "" }, on: { "click": function($event) {
      return _vm.viewFile(a);
    } } }, [_vm._v(_vm._s(_vm._f("translate")("TL_VIEW")))]), _c(__unplugin_components_5, [_vm._v("mdi-drag")])], 1)], 1);
  }), 1) : _vm._e()], 1) : _vm.attachment() ? _c("div", { staticClass: "preview-single-attachment" }, [_c(__unplugin_components_3$2, { staticClass: "filename", attrs: { "close": "" }, on: { "click:close": function($event) {
    _vm.removeImage(_vm.attachment());
  } } }, [_vm._v(_vm._s(_vm._f("truncate")(_vm.attachment()._filename, 10)) + " (" + _vm._s(_vm.imageSize(_vm.attachment())) + ")")]), _vm.isImage() ? _c("img", { attrs: { "src": _vm.getImageSrc() } }) : _c(__unplugin_components_1, { attrs: { "small": "" }, on: { "click": function($event) {
    return _vm.viewFile();
  } } }, [_vm._v(_vm._s(_vm._f("translate")("TL_VIEW")))])], 1) : _vm._e(), _vm.isForMultipleImages() ? [_c("div", { staticClass: "help-block" }, [_c(__unplugin_components_5, { attrs: { "small": "" } }, [_vm._v("mdi-information")]), _vm.getMaxCount() !== -1 ? _c("span", [_vm._v(_vm._s(_vm._f("translate")("TL_MAX_NUMBER_OF_FILES", null, { num: _vm.getMaxCount() })))]) : _c("span", [_vm._v(_vm._s(_vm._f("translate")("TL_UNLIMITED_NUMBER_OF_FILES")))])], 1)] : _vm._e(), _vm.schema.width && _vm.schema.height ? _c("div", { staticClass: "help-block" }, [_c(__unplugin_components_5, { attrs: { "small": "" } }, [_vm._v("mdi-information")]), _c("span", [_vm._v(_vm._s(_vm._f("translate")("TL_THIS_FIELD_REQUIRES_THE_FOLLOWING_SIZE")) + ":" + _vm._s(_vm.schema.width) + "x" + _vm._s(_vm.schema.height))])], 1) : _vm._e(), _vm.schema.limit ? _c("div", { staticClass: "help-block" }, [_c(__unplugin_components_5, { attrs: { "small": "" } }, [_vm._v("mdi-information")]), _c("span", [_vm._v(_vm._s(_vm._f("translate")("TL_THIS_FIELD_REQUIRES_A_FILE_SIZE")) + ": " + _vm._s(_vm.getFileSizeLimit(_vm.schema.limit)))])], 1) : _vm._e(), _vm.schema.accept ? _c("div", { staticClass: "help-block" }, [_c(__unplugin_components_5, { attrs: { "small": "" } }, [_vm._v("mdi-information")]), _c("span", [_vm._v(_vm._s(_vm._f("translate")("TL_THIS_FIELD_REQUIRES")) + ": " + _vm._s(_vm.schema.accept))])], 1) : _vm._e()], 2);
};
var _sfc_staticRenderFns$d = [];
var __component__$d = /* @__PURE__ */ normalizeComponent(
  _sfc_main$d,
  _sfc_render$d,
  _sfc_staticRenderFns$d,
  false,
  null,
  null,
  null,
  null
);
const AttachmentView = __component__$d.exports;
const ParagraphAttachmentView_vue_vue_type_style_index_0_scoped_1db722f8_lang = "";
const _sfc_main$c = {
  mixins: [AbstractField, FileInputField, DragList],
  data() {
    return {
      dragover: false,
      items: _.get(this.model, this.schema.model, []),
      key: v4(),
      attachments: []
    };
  },
  watch: {
    "schema.model": function() {
      this.items = _.get(this.model, this.schema.model, []);
      this.attachments = this.formatItems();
    }
  },
  mounted() {
    this.attachments = this.formatItems();
  },
  methods: {
    formatItems() {
      return _.map(this.items, (i) => this.getAttachment(i));
    },
    onChange() {
      _.set(this.model, this.schema.model, this.items);
      this.$emit("input", this.model, this.schema.model);
    },
    onEndDrag() {
      _.set(this.model, this.schema.model, this.items);
      this.$emit("input", this.model, this.schema.model);
    },
    onDrop(event2) {
      this.dragover = false;
      if (this.schema.maxCount <= 1 && event2.dataTransfer.files.length > 1) {
        return console.error("Only one file can be uploaded at a time..");
      }
      event2.dataTransfer.files.forEach((element) => {
        this.onChangeFile(element);
      });
    },
    onChangeFile(files) {
      this.$refs.fileInput.validate();
      if (!this.$refs.fileInput.valid) {
        return;
      }
      if (!_.isArray(files)) {
        files = [files];
      }
      const { key, locale } = this.getKeyLocale();
      _.each(files, (file, i) => {
        const fileItemId = v4();
        const newItem = {
          id: fileItemId
        };
        this.items.push(newItem);
        this.items = _.clone(this.items);
        _.set(this.model, this.schema.model, this.items);
        this.$emit("input", this.model, this.schema.model);
        const attachments = this.schema.rootView.model._attachments = this.schema.rootView.model._attachments || [];
        const attachmentObj = {
          _filename: file.name,
          order: i + 1,
          orderUpdated: true,
          _name: key,
          _fields: {
            locale,
            fileItemId
          },
          file
        };
        if (this.schema.fileType === "image") {
          try {
            attachmentObj.url = URL.createObjectURL(file);
          } catch (error) {
            console.error(error);
          }
        }
        attachments.push(attachmentObj);
        console.warn("added attachment = ", attachmentObj);
        event.target.value = null;
      });
      _.set(this.model, this.schema.model, this.items);
      this.$emit("input", this.model, this.schema.model);
    },
    getAttachment(fileItemId, field) {
      const attach = _.find(this.schema.rootView.model._attachments, { _fields: { fileItemId: fileItemId.id } });
      return field ? _.get(attach, field) : attach;
    },
    onClickRemoveFileItem(fileItem) {
      let attachments = this.schema.rootView.model._attachments = this.schema.rootView.model._attachments || [];
      attachments = _.reject(attachments, { _fields: { fileItemId: fileItem.id } });
      this.items = _.difference(this.items, [fileItem]);
      _.set(this.schema.rootView.model, "_attachments", attachments);
      _.set(this.model, this.schema.model, this.items);
      this.$emit("input", this.model, this.schema.model);
    }
  }
};
var _sfc_render$c = function render26() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "paragraph-attachment-view" }, [_c(__unplugin_components_2$3, { class: { "drag-and-drop": _vm.dragover }, attrs: { "elevation": "0" }, on: { "drop": function($event) {
    $event.preventDefault();
    return _vm.onDrop($event);
  }, "dragover": function($event) {
    $event.preventDefault();
    _vm.dragover = true;
  }, "dragenter": function($event) {
    $event.preventDefault();
    _vm.dragover = true;
  }, "dragleave": function($event) {
    $event.preventDefault();
    _vm.dragover = false;
  } } }, [_c(__unplugin_components_1$2, { ref: "fileInput", attrs: { "rules": _vm.getRules(), "accept": _vm.model.input === "image" ? "image/*" : "*", "clearable": false, "placeholder": _vm._f("translate")(_vm.getPlaceholder()), "dense": "", "outlined": "", "persistent-placeholder": "", "persistent-hint": "", "multiple": _vm.isForMultipleImages(), "disabled": _vm.isForMultipleImages() && _vm.isFieldDisabled() }, on: { "change": _vm.onChangeFile }, scopedSlots: _vm._u([{ key: "selection", fn: function({ index }) {
    return [index === 0 ? _c("div", { staticClass: "v-file-input__text v-file-input__text--placeholder" }, [_vm._v(" " + _vm._s(_vm._f("translate")(_vm.getPlaceholder())) + " ")]) : _vm._e()];
  } }]) })], 1), _vm.schema ? _c("draggable", _vm._b({ key: `${_vm.schema.model}-${_vm.key}`, staticClass: "preview-multiple", class: { disabled: _vm.disabled }, attrs: { "group": `${_vm.schema.model}-${_vm.key}`, "draggable": ".preview-attachment", "handle": ".row-handle", "ghost-class": "ghost" }, on: { "end": _vm.onEndDrag, "start": _vm.onStartDrag }, model: { value: _vm.items, callback: function($$v) {
    _vm.items = $$v;
  }, expression: "items" } }, "draggable", _vm.dragOptions, false), _vm._l(_vm.items, function(i, index) {
    return _c(__unplugin_components_2$3, { key: `${i._filename}-${index}`, staticClass: "preview-attachment", class: { odd: index % 2 !== 0 } }, [_c(__unplugin_components_3$2, { staticClass: "filename", attrs: { "close": "" }, on: { "click:close": function($event) {
      return _vm.onClickRemoveFileItem(i);
    } } }, [_vm._v("#" + _vm._s(index + 1) + " - " + _vm._s(_vm._f("truncate")(_vm.getAttachment(i, "_filename"), 10)) + " (" + _vm._s(_vm.imageSize(_vm.getAttachment(i))) + ")")]), _c("div", { staticClass: "row-handle" }, [_vm.isImage() ? _c("img", { attrs: { "src": _vm.getImageSrc(i) } }) : _vm.getAttachment(i, "url") ? _c(__unplugin_components_1, { attrs: { "small": "" }, on: { "click": function($event) {
      _vm.viewFile(_vm.getAttachment(i));
    } } }, [_vm._v(_vm._s(_vm._f("translate")("TL_VIEW")))]) : _vm._e(), _c(__unplugin_components_5, [_vm._v("mdi-drag")])], 1)], 1);
  }), 1) : _vm._e()], 1);
};
var _sfc_staticRenderFns$c = [];
var __component__$c = /* @__PURE__ */ normalizeComponent(
  _sfc_main$c,
  _sfc_render$c,
  _sfc_staticRenderFns$c,
  false,
  null,
  "1db722f8",
  null,
  null
);
const ParagraphAttachmentView = __component__$c.exports;
const DatetimePicker_vue_vue_type_style_index_0_scoped_f9925e5d_lang = "";
const _sfc_main$b = {
  props: [
    "format",
    "name",
    "width",
    "value"
  ],
  data() {
    return {
      hideCal: true,
      activePort: null,
      timeStamp: null,
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      days: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
      monthIndex: 0,
      hourIndex: 0,
      minuteIndex: 0,
      year: 2017,
      portsHolder: [],
      minute: 0,
      hour: 1,
      day: 1,
      minuteSelectorVisible: false,
      hourSelectorVisible: false,
      period: "AM"
    };
  },
  computed: {
    ports: {
      get() {
        let p = [];
        if (this.portsHolder.length === 0) {
          for (let i = 0; i < 42; i++) {
            p.push("");
          }
        } else {
          p = this.portsHolder;
        }
        return p;
      },
      set(newValue) {
        this.portsHolder = newValue;
      }
    },
    month() {
      return this.months[this.monthIndex];
    },
    dateTime() {
      return `${this.timeStamp.getFullYear()}-${this.timeStamp.getMonth() + 1}-${this.timeStamp.getUTCDay()}`;
    },
    minutes() {
      const arr = [];
      for (let i = 0; i < 60; i++) {
        i < 10 ? arr.push(`0${i}`) : arr.push(`${i}`);
      }
      return arr;
    },
    hours() {
      const arr = [];
      for (let i = 1; i <= 12; i++) {
        i < 10 ? arr.push(`0${i}`) : arr.push(`${i}`);
      }
      return arr;
    },
    dateFormat() {
      return this.format || "YYYY-MM-DD hh:mm:ss a";
    },
    hideTime() {
      return this.dateFormat.indexOf("hh:mm:ss") === -1;
    },
    hideDate() {
      return this.dateFormat === "hh:mm:ss a";
    }
  },
  created() {
    let timestamp = /* @__PURE__ */ new Date();
    if (this.value) {
      timestamp = new Date(this.value);
      this.timeStamp = timestamp;
    }
    this.year = timestamp.getFullYear();
    this.monthIndex = timestamp.getMonth();
    this.day = timestamp.getDate();
    this.period = timestamp.getHours() >= 12 ? "PM" : "AM";
    this.hour = timestamp.getHours();
    if (this.hour === 0) {
      this.hour += 12;
    } else if (this.hour > 12) {
      this.hour -= 12;
    }
    this.minute = timestamp.getMinutes() || 0;
    this.updateCalendar();
    document.addEventListener("keydown", this.keyIsDown);
    document.addEventListener("click", this.documentClicked);
    this.setDate();
  },
  destroyed() {
    document.removeEventListener("keydown", this.keyIsDown);
    document.removeEventListener("click", this.documentClicked);
  },
  methods: {
    padZero(number) {
      return _.padStart(number, 2, "0");
    },
    display() {
      return this.timeStamp ? dayjs(this.timeStamp).format(this.dateFormat) : "";
    },
    leftMonth() {
      const index = this.months.indexOf(this.month);
      if (index === 0) {
        this.monthIndex = 11;
      } else {
        this.monthIndex = index - 1;
      }
      this.updateCalendar();
    },
    rightMonth() {
      const index = this.months.indexOf(this.month);
      if (index === 11) {
        this.monthIndex = 0;
      } else {
        this.monthIndex = index + 1;
      }
      this.updateCalendar();
    },
    rightYear() {
      this.year++;
      this.updateCalendar();
    },
    leftYear() {
      this.year--;
      this.updateCalendar();
    },
    updateCalendar() {
      const me = this;
      const date = new Date(me.year, me.monthIndex, 1, 0, 0, 0);
      const day = date.getDay();
      const daysInMonth = new Date(me.year, me.monthIndex + 1, 0).getDate();
      const ports = [];
      let portsLenght = 35;
      if (day === 6 || day === 5 && daysInMonth === 31) {
        portsLenght = 42;
      }
      let activeFound = false;
      for (let i = 0; i < portsLenght; i++) {
        const j = i - day;
        const curr = j < 0 || j >= daysInMonth ? "" : j + 1;
        ports.push(curr);
        if (this.timeStamp && curr === me.day && this.timeStamp.getMonth() === me.monthIndex && this.timeStamp.getFullYear() === me.year) {
          me.activePort = i;
          activeFound = true;
        }
      }
      if (!activeFound) {
        me.activePort = -1;
      }
      this.ports = ports;
    },
    setDay(index, port) {
      if (port !== "") {
        this.activePort = index;
        this.day = port;
        this.timeStamp = new Date(this.year, this.monthIndex, this.day);
        this.setDate(true);
      }
    },
    setMinute(index, closeAfterSet) {
      this.minuteIndex = index;
      this.minute = index;
      if (closeAfterSet) {
        this.minuteSelectorVisible = false;
      }
    },
    setHour(index, closeAfterSet) {
      this.hourIndex = index;
      this.hour = index + 1;
      if (closeAfterSet) {
        this.hourSelectorVisible = false;
      }
    },
    showHourSelector() {
      this.hourSelectorVisible = true;
      this.minuteSelectorVisible = false;
    },
    showMinuteSelector() {
      this.minuteSelectorVisible = true;
      this.hourSelectorVisible = false;
    },
    keyIsDown(event2) {
      const key = event2.which || event2.keycode;
      if (key === 38) {
        if (this.minuteSelectorVisible && this.minuteIndex > 0) {
          this.setMinute(this.minuteIndex - 1, false);
          this.scrollTopMinute();
        } else if (this.hourSelectorVisible && this.hourIndex > 0) {
          this.setHour(this.hourIndex - 1, false);
          this.scrollTopHour();
        }
      } else if (key === 40) {
        if (this.minuteSelectorVisible && this.minuteIndex < this.minutes.length - 1) {
          this.setMinute(this.minuteIndex + 1, false);
          this.scrollTopMinute();
        } else if (this.hourSelectorVisible && this.hourIndex < this.hours.length - 1) {
          this.setHour(this.hourIndex + 1, false);
          this.scrollTopHour();
        }
      } else if (key === 13) {
        this.minuteSelectorVisible = false;
        this.hourSelectorVisible = false;
      }
      if (this.minuteSelectorVisible || this.hourSelectorVisible) {
        event2.preventDefault();
        this.minuteSelectorVisible = false;
        this.hourSelectorVisible = false;
      }
    },
    scrollTopMinute() {
      const mHeight = this.$refs.minuteScroller.scrollHeight;
      const wHeight = this.$refs.minuteScrollerWrapper.clientHeight;
      const top = mHeight * (this.minuteIndex / (this.minutes.length - 1)) - wHeight / 2;
      this.$refs.minuteScroller.scrollTop = top;
    },
    scrollTopHour() {
      const mHeight = this.$refs.hourScroller.scrollHeight;
      const wHeight = this.$refs.hourScrollerWrapper.clientHeight;
      const top = mHeight * (this.hourIndex / (this.hours.length - 1)) - wHeight / 2;
      this.$refs.hourScroller.scrollTop = top;
    },
    changePeriod() {
      this.period = this.period === "AM" ? "PM" : "AM";
    },
    calendarClicked(event2) {
      if (event2.target.id !== "j-hour" && event2.target.id !== "j-minute") {
        this.minuteSelectorVisible = false;
        this.hourSelectorVisible = false;
      }
      event2.cancelBubble = true;
      if (event2.stopPropagation) {
        event2.stopPropagation();
      }
    },
    documentClicked(event2) {
      if (event2.target.id !== "tj-datetime-input") {
        this.hideCal = true;
      }
    },
    toggleCal() {
      this.hideCal = !this.hideCal;
    },
    clearDate() {
      this.timeStamp = "";
      this.$emit("input", "");
      this.hideCal = true;
    },
    setDate(forceUpdate) {
      let h2 = this.hour;
      if (this.hour === 12 && this.period === "AM") {
        h2 = h2 - 12;
      }
      if (this.hour !== 12 && this.period === "PM") {
        h2 = h2 + 12;
      }
      const d = new Date(this.year || 1970, this.monthIndex || 0, this.day || 1, h2, this.minute, 0);
      if (forceUpdate) {
        this.timeStamp = d;
        this.$emit("input", d.getTime());
        this.hideCal = true;
      }
    }
  }
};
var _sfc_render$b = function render27() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "datetime-picker", style: { width: _vm.width }, on: { "click": function($event) {
    return _vm.calendarClicked($event);
  } } }, [_c("div", [_c("input", { attrs: { "id": "tj-datetime-input", "readonly": "", "type": "text", "name": _vm.name, "autocomplete": "off" }, domProps: { "value": _vm.display() }, on: { "click": _vm.toggleCal } }), _c("div", { staticClass: "calender-div", class: { noDisplay: _vm.hideCal } }, [_c("div", { class: { noDisplay: _vm.hideDate } }, [_c("div", { staticClass: "year-month-wrapper" }, [_c("div", { staticClass: "month-setter" }, [_c("span", { staticClass: "nav-l", attrs: { "type": "button" }, on: { "click": _vm.leftYear } }, [_vm._v("<")]), _c("span", { staticClass: "year" }, [_vm._v(_vm._s(_vm.year))]), _c("span", { staticClass: "nav-r", attrs: { "type": "button" }, on: { "click": _vm.rightYear } }, [_vm._v(">")])]), _c("div", { staticClass: "month-setter" }, [_c("span", { staticClass: "nav-l", attrs: { "type": "button" }, on: { "click": _vm.leftMonth } }, [_vm._v("<")]), _c("span", { staticClass: "month" }, [_vm._v(_vm._s(_vm._f("translate")("TL_" + _vm.month.toUpperCase())))]), _c("span", { staticClass: "nav-r", attrs: { "type": "button" }, on: { "click": _vm.rightMonth, "mousedown": function($event) {
    $event.stopPropagation();
    $event.preventDefault();
  } } }, [_vm._v(">")])])]), _c("div", { staticClass: "headers" }, [_vm._l(_vm.days, function(d, index) {
    return [_c("span", { key: index, staticClass: "days" }, [_vm._v(_vm._s(_vm._f("translate")("TL_" + d.toUpperCase())))])];
  })], 2), _c("div", [_vm._l(_vm.ports, function(port, index) {
    return [_c("span", { key: index, staticClass: "port", class: { activePort: index === _vm.activePort }, on: { "click": function($event) {
      return _vm.setDay(index, port);
    } } }, [_vm._v(_vm._s(port))])];
  })], 2)]), _c("div", { staticClass: "time-picker", class: { noDisplay: _vm.hideTime } }, [_c("div", { staticClass: "hour-selector" }, [_c("div", { attrs: { "id": "j-hour" }, on: { "click": _vm.showHourSelector } }, [_vm._v(_vm._s(_vm.padZero(_vm.hour)))]), _c("div", { ref: "hourScrollerWrapper", staticClass: "scroll-hider", class: { showSelector: _vm.hourSelectorVisible } }, [_c("ul", { ref: "hourScroller" }, [_vm._l(_vm.hours, function(h2, index) {
    return [_c("li", { key: index, class: { active: index == _vm.hourIndex }, on: { "click": function($event) {
      return _vm.setHour(index, true);
    } } }, [_vm._v(_vm._s(h2))])];
  })], 2)])]), _vm._m(0), _c("div", { staticClass: "minute-selector" }, [_c("div", { attrs: { "id": "j-minute" }, on: { "click": _vm.showMinuteSelector } }, [_vm._v(_vm._s(_vm.padZero(_vm.minute)))]), _c("div", { ref: "minuteScrollerWrapper", staticClass: "scroll-hider", class: { showSelector: _vm.minuteSelectorVisible } }, [_c("ul", { ref: "minuteScroller" }, [_vm._l(_vm.minutes, function(m, index) {
    return [_c("li", { key: index, class: { active: index == _vm.minuteIndex }, on: { "click": function($event) {
      return _vm.setMinute(index, true);
    } } }, [_vm._v(_vm._s(m))])];
  })], 2)])]), _vm._m(1), _c("div", { staticClass: "minute-selector" }, [_c("div", { on: { "click": _vm.changePeriod } }, [_vm._v(_vm._s(_vm._f("translate")("TL_" + _vm.period.toUpperCase())))])])]), _c("span", { staticClass: "okButton", attrs: { "type": "button" }, on: { "click": function($event) {
    return _vm.setDate(true);
  } } }, [_vm._v(_vm._s(_vm._f("translate")("TL_OK")))]), _c("span", { staticClass: "okButton", attrs: { "type": "button" }, on: { "click": function($event) {
    return _vm.clearDate();
  } } }, [_vm._v(_vm._s(_vm._f("translate")("TL_CLEAR")))])])])]);
};
var _sfc_staticRenderFns$b = [function() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "time-separator" }, [_c("span", [_vm._v(":")])]);
}, function() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "time-separator" }, [_c("span", [_vm._v(":")])]);
}];
var __component__$b = /* @__PURE__ */ normalizeComponent(
  _sfc_main$b,
  _sfc_render$b,
  _sfc_staticRenderFns$b,
  false,
  null,
  "f9925e5d",
  null,
  null
);
const datetime = __component__$b.exports;
const _sfc_main$a = {
  components: {
    datetime
  },
  mixins: [AbstractField],
  props: [
    "options",
    "customDatetimePickerOptions"
  ],
  data() {
    return {};
  },
  created() {
    this.schema.format = this.schema.format || "DD/MM/YYYY h:i:s";
  },
  methods: {
    onChangeData(data) {
      _.set(this.model, this.schema.model, data);
      this.$emit("model-updated", data, this.schema.model);
      const dummy = this.schema.label;
      this.schema.label = null;
      this.schema.label = dummy;
    },
    get: _.get
  }
};
var _sfc_render$a = function render28() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", [_c("datetime", { attrs: { "format": _vm.schema.format, "value": _vm.get(_vm.model, _vm.schema.model) }, on: { "input": _vm.onChangeData } })], 1);
};
var _sfc_staticRenderFns$a = [];
var __component__$a = /* @__PURE__ */ normalizeComponent(
  _sfc_main$a,
  _sfc_render$a,
  _sfc_staticRenderFns$a,
  false,
  null,
  null,
  null,
  null
);
const CustomDatetimePicker = __component__$a.exports;
const _sfc_main$9 = {
  mixins: [AbstractField],
  data() {
    return {
      objectValue: this.value
    };
  },
  computed: {
    selectOptions() {
      return this.schema.selectOptions || {};
    },
    options() {
      let values = this.schema.values;
      if (typeof values === "function") {
        return values.apply(this, [this.model, this.schema]);
      }
      return values;
    },
    formattedOptions() {
      const formattedOptions = this.selectOptions.label || this.options;
      if (_.isString(_.first(formattedOptions))) {
        return formattedOptions;
      }
      const customLabel = this.customLabel;
      if (!_.isFunction(this.customLabel)) {
        return formattedOptions;
      }
      return _.map(formattedOptions, (option) => {
        const optionLabel = customLabel(option);
        if (_.isString(optionLabel)) {
          option.text = optionLabel;
        }
        if (_.isUndefined(_.get(option, "value", void 0))) {
          option.value = _.get(option, "_id", void 0);
        }
        return option;
      });
    },
    hasCustomLabel() {
      const selectOptions = _.get(this.schema, "selectOptions");
      return typeof selectOptions !== "undefined" && typeof selectOptions.customLabel !== "undefined" && typeof selectOptions.customLabel === "function";
    },
    customLabel() {
      if (_.isString(_.first(this.options))) {
        return this.options;
      }
      if (!this.hasCustomLabel) {
        return "text";
      }
      return this.schema.selectOptions.customLabel;
    }
  },
  methods: {
    getLabel() {
      if (this.disabled) {
        return "";
      }
      if (!_.isString(this.selectOptions.label)) {
        return this.schema.label;
      }
      return this.selectOptions.label;
    },
    updateSelected(value) {
      this.objectValue = value;
      const key = _.get(this.schema, "selectOptions.key");
      if (key) {
        this.value = _.get(this.objectValue, key);
      } else {
        this.value = this.objectValue;
      }
      this.$emit("input", value, this.schema.model);
    },
    addTag(newTag, id) {
      const onNewTag = this.selectOptions.onNewTag;
      if (typeof onNewTag === "function") {
        onNewTag(newTag, id, this.options, this.objectValue);
      }
    },
    onSearchChange(searchQuery, id) {
      const onSearch = this.selectOptions.onSearch;
      if (typeof onSearch === "function") {
        onSearch(searchQuery, id, this.options);
      }
    }
  }
};
var _sfc_render$9 = function render29() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "multiselect-wrapper" }, [_c(__unplugin_components_0$8, { attrs: { "id": _vm.selectOptions.id, "label": _vm.getLabel(), "chips": _vm.selectOptions.multiple, "value": _vm.objectValue, "items": _vm.formattedOptions, "deletable-chips": _vm.selectOptions.multiple, "hide-selected": _vm.selectOptions.hideSelected, "disabled": _vm.disabled, "placeholder": _vm.schema.placeholder, "multiple": _vm.selectOptions.multiple, "clearable": "", "persistent-placeholder": "", "outlined": "", "dense": "", "hide-details": "" }, on: { "change": _vm.updateSelected, "search-change": _vm.onSearchChange, "tag": _vm.addTag } })], 1);
};
var _sfc_staticRenderFns$9 = [];
var __component__$9 = /* @__PURE__ */ normalizeComponent(
  _sfc_main$9,
  _sfc_render$9,
  _sfc_staticRenderFns$9,
  false,
  null,
  null,
  null,
  null
);
const CustomMultiSelect = __component__$9.exports;
const CustomChecklist_vue_vue_type_style_index_0_lang = "";
function slugify(name = "") {
  return name.toString().trim().replace(/ /g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "").replace(/([^a-zA-Z0-9-_/./:]+)/g, "");
}
const _sfc_main$8 = {
  mixins: [AbstractField],
  data() {
    return {
      comboExpanded: false
    };
  },
  computed: {
    items() {
      const values = this.schema.values;
      if (typeof values === "function") {
        return values.apply(this, [
          this.model,
          this.schema
        ]);
      }
      return values;
    },
    selectedCount() {
      return lodashExports.get(this, "value.length", 0);
    },
    selectAllLabel() {
      return TranslateService$4.get(this.allSelected ? "TL_DESELECT_ALL" : "TL_SELECT_ALL");
    },
    allSelected() {
      return lodashExports.get(this.value, "length", 0) === lodashExports.get(this.items, "length", 0);
    }
  },
  methods: {
    onChangeSelectAll(checked) {
      this.value = !checked ? [] : lodashExports.map(this.items, (item) => this.getItem(item, "value"));
      this.$forceUpdate();
    },
    getInputName(item) {
      let toSlugify = this.getItem(item, "value");
      if (this.schema && this.schema.inputName && this.schema.inputName.length > 0) {
        toSlugify = `${this.schema.inputName}_${toSlugify}`;
      }
      return slugify(toSlugify);
    },
    getItem(item, key) {
      if (!lodashExports.isObject(item)) {
        return item;
      }
      if (typeof this.schema.customChecklistOptions !== "undefined" && typeof this.schema.customChecklistOptions.value !== "undefined") {
        return item[lodashExports.get(this.schema.customChecklistOptions, key, false)];
      }
      const val = lodashExports.get(item, key, "undefined");
      if (typeof val !== "undefined") {
        return val;
      }
      this.newError(key);
    },
    isItemChecked(item) {
      return this.value && this.value.indexOf(this.getItem(item, "value")) !== -1;
    },
    onChanged(checked, item) {
      if (lodashExports.isNil(this.value) || !Array.isArray(this.value)) {
        this.value = [];
      }
      const arr = lodashExports.clone(this.value);
      if (checked) {
        arr.push(this.getItem(item, "value"));
      } else {
        arr.splice(this.value.indexOf(this.getItem(item, "value")), 1);
      }
      this.value = arr;
    },
    onExpandCombo() {
      this.comboExpanded = !this.comboExpanded;
    }
  }
};
var _sfc_render$8 = function render30() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "wrapper custom-checklist" }, [_c("div", { staticClass: "field-label" }, [_vm._v(_vm._s(_vm.schema.label))]), _c("div", { staticClass: "border-wrapper" }, [_vm.schema.listBox ? _c("div", { staticClass: "listbox form-control", attrs: { "disabled": _vm.disabled } }, [_c("div", { staticClass: "select-all" }, [_c("label", [_c(__unplugin_components_2$4, { attrs: { "id": _vm.getFieldID(_vm.schema), "ripple": false, "dense": "", "hide-details": "", "input-value": _vm.allSelected, "label": _vm.selectAllLabel }, on: { "change": _vm.onChangeSelectAll } })], 1)]), _vm._l(_vm.items, function(item, i) {
    return _c("div", { key: i, staticClass: "list-row", class: { "is-checked": _vm.isItemChecked(item) } }, [_c("label", [_c(__unplugin_components_2$4, { attrs: { "id": _vm.getFieldID(_vm.schema), "ripple": false, "dense": "", "hide-details": "", "input-value": _vm.isItemChecked(item), "disabled": _vm.disabled, "label": _vm.getInputName(item), "name": _vm.getInputName(item) }, on: { "change": function($event) {
      return _vm.onChanged($event, item);
    } } })], 1)]);
  })], 2) : _c("div", { staticClass: "combobox form-control", attrs: { "disabled": _vm.disabled } }, [_c("div", { staticClass: "mainRow", class: { expanded: _vm.comboExpanded }, on: { "click": _vm.onExpandCombo } }, [_c("div", { staticClass: "node-cms-info" }, [_vm._v(_vm._s(_vm.selectedCount) + " " + _vm._s(_vm._f("translate")("TL_SELECTED")))]), _c("div", { staticClass: "arrow" })]), _vm.comboExpanded ? _c("div", { staticClass: "dropList" }, _vm._l(_vm.items, function(item, y) {
    return _c("div", { key: y, staticClass: "list-row", class: { "is-checked": _vm.isItemChecked(item) } }, [_c("label", [_c(__unplugin_components_2$4, { attrs: { "id": _vm.getFieldID(_vm.schema) + y, "ripple": false, "dense": "", "hide-details": "", "label": _vm.getInputName(item), "input-value": _vm.isItemChecked(item), "disabled": _vm.disabled, "name": _vm.getInputName(item) }, on: { "change": function($event) {
      return _vm.onChanged($event, item);
    } } })], 1)]);
  }), 0) : _vm._e()])])]);
};
var _sfc_staticRenderFns$8 = [];
var __component__$8 = /* @__PURE__ */ normalizeComponent(
  _sfc_main$8,
  _sfc_render$8,
  _sfc_staticRenderFns$8,
  false,
  null,
  null,
  null,
  null
);
const CustomChecklist = __component__$8.exports;
const CustomInput_vue_vue_type_style_index_0_lang = "";
const _sfc_main$7 = {
  mixins: [AbstractField],
  data() {
    return {};
  },
  methods: {
    onChangeData(data) {
      this.value = data;
    },
    get(key) {
      return _.get(this.schema, key, false);
    },
    getAutocomplete() {
      return _.get(this.schema, "inputFieldType", "text") === "password" ? "current-password" : "null";
    },
    getType() {
      return _.get(this.schema, "inputFieldType", "text");
    },
    validateField(val) {
      if (this.schema.required && (_.isNull(val) || _.isUndefined(val) || val === "")) {
        return false;
      }
      if (this.schema.validator && _.isFunction(this.schema.validator)) {
        return !!this.schema.validator(val, this.schema.model, this.model);
      }
      return true;
    }
  }
};
var _sfc_render$7 = function render31() {
  var _vm = this, _c = _vm._self._c;
  return _c(__unplugin_components_0$3, { class: [_vm.schema.labelClasses], attrs: { "type": _vm.getType(), "label": _vm.schema.label, "value": _vm.value, "input-value": _vm.value, "max-length": _vm.schema.max, "autocomplete": _vm.getAutocomplete(), "min-length": _vm.schema.min, "rules": [_vm.validateField], "dense": _vm.get("dense"), "compact": _vm.get("compact"), "disabled": _vm.get("disabled"), "readonly": _vm.get("readonly"), "filled": _vm.get("filled"), "outlined": _vm.get("outlined"), "solo": _vm.get("solo"), "persistent-placeholder": "", "hide-details": "" }, on: { "input": _vm.onChangeData }, scopedSlots: _vm._u([_vm.schema.required ? { key: "label", fn: function() {
    return [_c("span", { staticClass: "red--text" }, [_c("strong", [_vm._v("* ")])]), _vm._v(_vm._s(_vm.schema.label) + " ")];
  }, proxy: true } : null], null, true) });
};
var _sfc_staticRenderFns$7 = [];
var __component__$7 = /* @__PURE__ */ normalizeComponent(
  _sfc_main$7,
  _sfc_render$7,
  _sfc_staticRenderFns$7,
  false,
  null,
  null,
  null,
  null
);
const CustomInput = __component__$7.exports;
const CustomTextarea_vue_vue_type_style_index_0_lang = "";
const _sfc_main$6 = {
  mixins: [AbstractField],
  data() {
    return {};
  },
  methods: {
    onChangeData(data) {
      this.value = data;
    },
    getType() {
      return _.get(this.schema, "inputFieldType", "text");
    }
  }
};
var _sfc_render$6 = function render32() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "custom-textarea" }, [_c(__unplugin_components_0$9, { class: [_vm.schema.labelClasses], attrs: { "type": _vm.getType(), "value": _vm.value, "label": _vm.schema.label, "max-length": _vm.schema.max, "min-length": _vm.schema.min, "dense": _vm.schema.dense ? true : false, "compact": _vm.schema.compact ? true : false, "disabled": _vm.schema.disabled ? true : false, "readonly": _vm.schema.readonly ? true : false, "filled": _vm.schema.filled ? true : false, "hide-details": "", "outlined": _vm.schema.outlined ? true : false, "solo": _vm.schema.solo ? true : false }, on: { "input": _vm.onChangeData } })], 1);
};
var _sfc_staticRenderFns$6 = [];
var __component__$6 = /* @__PURE__ */ normalizeComponent(
  _sfc_main$6,
  _sfc_render$6,
  _sfc_staticRenderFns$6,
  false,
  null,
  null,
  null,
  null
);
const CustomTextarea = __component__$6.exports;
const CustomSwitch_vue_vue_type_style_index_0_lang = "";
const _sfc_main$5 = {
  mixins: [AbstractField],
  data() {
    return {};
  },
  computed: {},
  created() {
  },
  methods: {
    getValue() {
      const value = _.get(this.model, this.schema.model, false);
      return _.isNull(value) ? false : value;
    },
    onChange(event2) {
      this.$emit("input", event2, this.schema.model);
    }
  }
};
var _sfc_render$5 = function render33() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "custom-switch" }, [_c("div", { staticClass: "field-label" }, [_vm._v(_vm._s(_vm.schema.label))]), _c("div", { staticClass: "border-wrapper" }, [_c(__unplugin_components_0$1, { staticClass: "switch", attrs: { "input-value": _vm.getValue(), "compact": _vm.schema.compact ? true : false, "disabled": _vm.schema.disabled ? true : false, "readonly": _vm.schema.readonly ? true : false, "filled": _vm.schema.filled ? true : false, "dense": "", "hide-details": "", "solo": "", "outlined": _vm.schema.outlined ? true : false }, on: { "change": _vm.onChange } })], 1)]);
};
var _sfc_staticRenderFns$5 = [];
var __component__$5 = /* @__PURE__ */ normalizeComponent(
  _sfc_main$5,
  _sfc_render$5,
  _sfc_staticRenderFns$5,
  false,
  null,
  null,
  null,
  null
);
const CustomSwitch = __component__$5.exports;
const _sfc_main$4 = {
  mixins: [AbstractField],
  props: ["locale"],
  data() {
    return {
      tags: [],
      options: {
        allowDuplicates: this.getOpt("allowDuplicates", true),
        readOnly: this.getOpt("disabled", false),
        placeholder: this.getOpt("placeholder", ""),
        dense: this.getOpt("dense", false),
        multiple: this.getOpt("multiple", false),
        outlined: this.getOpt("outlined", false),
        deletableChips: this.getOpt("deletableChips", false),
        smallChips: this.getOpt("smallChips", false),
        limit: this.getOpt("limit", -1)
      }
    };
  },
  watch: {
    tags() {
      _.set(this.model, this.schema.model, this.tags);
    },
    "schema.model": function() {
      this.tags = _.get(this.model, this.schema.model);
    }
  },
  created() {
    this.options = _.extend(this.options, this.schema.selectOptions);
  },
  mounted() {
    this.tags = _.get(this.model, this.schema.model);
  },
  methods: {
    onChangeData(value) {
      if (_.get(this.options, "limit", -1) !== -1) {
        this.value = _.take(value, this.options.limit);
      } else {
        this.value = value;
      }
    }
  }
};
var _sfc_render$4 = function render34() {
  var _vm = this, _c = _vm._self._c;
  return _c(__unplugin_components_0$a, { attrs: { "clearable": "", "hide-details": "", "outlined": "", "deletable-chips": "", "small-chips": "", "dense": "", "hide-selected": !_vm.options["allowDuplicates"], "readonly": _vm.options["readOnly"], "placeholder": _vm.options["tagPlaceholder"], "multiple": _vm.options["multiple"] }, on: { "change": _vm.onChangeData }, model: { value: _vm.tags, callback: function($$v) {
    _vm.tags = $$v;
  }, expression: "tags" } });
};
var _sfc_staticRenderFns$4 = [];
var __component__$4 = /* @__PURE__ */ normalizeComponent(
  _sfc_main$4,
  _sfc_render$4,
  _sfc_staticRenderFns$4,
  false,
  null,
  null,
  null,
  null
);
const CustomInputTag = __component__$4.exports;
const Group_vue_vue_type_style_index_0_scoped_ff942ce0_lang = "";
const _sfc_main$3 = {
  mixins: [AbstractField],
  props: ["groupOptions"],
  data() {
    return {
      errors: null
    };
  },
  methods: {
    onError(error) {
      console.log(999, "error", error);
    },
    validate() {
      const isValid = this.$refs.vfg.validate();
      if (!isValid) {
        this.errors = this.$refs.vfg.errors;
        throw new Error("group validation error");
      }
      return isValid;
    },
    debouncedValidate() {
      return this.$refs.vfg.debouncedValidate();
    },
    clearValidationErrors() {
      return this.$refs.vfg.clearValidationErrors();
    },
    onModelUpdated(value, model) {
      this.$emit("model-updated", value, model);
    }
  }
};
var _sfc_render$3 = function render35() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", [_c("div", { staticClass: "field-label" }, [_vm._v(_vm._s(_vm.schema.label))]), _c("div", { staticClass: "group" }, [_c("custom-form", { ref: "vfg", attrs: { "schema": _vm.schema.groupOptions, "model": _vm.model }, on: { "update:model": function($event) {
    _vm.model = $event;
  }, "error": _vm.onError, "input": _vm.onModelUpdated } })], 1)]);
};
var _sfc_staticRenderFns$3 = [];
var __component__$3 = /* @__PURE__ */ normalizeComponent(
  _sfc_main$3,
  _sfc_render$3,
  _sfc_staticRenderFns$3,
  false,
  null,
  "ff942ce0",
  null,
  null
);
const Group = __component__$3.exports;
const TableImageView_vue_vue_type_style_index_0_scoped_e3374301_lang = "";
const _sfc_main$2 = {
  props: [
    "row",
    "column",
    "rowIndex",
    "field"
  ],
  methods: {
    getSrc() {
      const url = _.get(this.findAttachmentForField(this.row, this.field), "url", false);
      return url ? url + "?resize=autox50" : false;
    },
    findAttachmentForField(item, field) {
      return _.find(_.get(item, "_attachments", []), (attachment) => {
        if (field.localised) {
          return _.get(attachment, "_fields.locale", false) === field.locale && attachment._name === field.originalModel;
        }
        return attachment._name === field.originalModel;
      });
    }
  }
};
var _sfc_render$2 = function render36() {
  var _vm = this, _c = _vm._self._c;
  return _vm.getSrc() ? _c("img", { staticClass: "vue-table-generator-field image", attrs: { "src": _vm.getSrc() } }) : _c("span", [_vm._v(_vm._s(_vm._f("translate")("TL_NO_IMAGE")))]);
};
var _sfc_staticRenderFns$2 = [];
var __component__$2 = /* @__PURE__ */ normalizeComponent(
  _sfc_main$2,
  _sfc_render$2,
  _sfc_staticRenderFns$2,
  false,
  null,
  "e3374301",
  null,
  null
);
const TableImageView = __component__$2.exports;
const _sfc_main$1 = {
  props: ["row", "column", "rowIndex", "field"],
  methods: {
    getValue() {
      return _.get(this.row, this.column.field, false);
    }
  }
};
const TableCustomSwitch_vue_vue_type_style_index_0_scoped_37c72f05_lang = "";
var _sfc_render$1 = function render37() {
  var _vm = this, _c = _vm._self._c;
  return _c(__unplugin_components_0$b, { staticClass: "vue-table-generator-field custom-switch", attrs: { "ripple": false, "value": _vm.getValue() } });
};
var _sfc_staticRenderFns$1 = [];
var __component__$1 = /* @__PURE__ */ normalizeComponent(
  _sfc_main$1,
  _sfc_render$1,
  _sfc_staticRenderFns$1,
  false,
  null,
  "37c72f05",
  null,
  null
);
const TableCustomSwitch = __component__$1.exports;
const TableRowActions_vue_vue_type_style_index_0_scoped_b4a6d030_lang = "";
const _sfc_main = {
  props: ["row", "column", "rowIndex", "edit", "remove"]
};
var _sfc_render = function render38() {
  var _vm = this, _c = _vm._self._c;
  return _c("div", { staticClass: "vue-table-generator-field table-column-actions" }, [_c(__unplugin_components_1, { attrs: { "small": "" }, on: { "click": function($event) {
    return _vm.edit(_vm.row);
  } } }, [_vm._v(_vm._s(_vm._f("translate")("TL_EDIT")))]), _c(__unplugin_components_1, { staticClass: "delete-btn", attrs: { "small": "", "color": "node-cms-red" }, on: { "click": function($event) {
    return _vm.remove(_vm.row);
  } } }, [_vm._v(_vm._s(_vm._f("translate")("TL_DELETE")))])], 1);
};
var _sfc_staticRenderFns = [];
var __component__ = /* @__PURE__ */ normalizeComponent(
  _sfc_main,
  _sfc_render,
  _sfc_staticRenderFns,
  false,
  null,
  "b4a6d030",
  null,
  null
);
const TableRowActions = __component__.exports;
const Loading = {
  install(Vue2, params = {}) {
    if (this.installed) {
      return;
    }
    this.installed = true;
    this.params = params;
    Vue2.prototype.$loading = LoadingService$1;
  }
};
function TranslateFilter(value, locale, params) {
  return TranslateService$4.get(value, locale, params);
}
function TruncateFilter(value, params) {
  if (_.isString(params)) {
    if (_.includes(params, "n")) {
      console.warn("Truncate - should truncate the text by number of items");
    }
    return _.truncate(value, { length: _.toNumber(params) });
  }
  return _.truncate(value, { length: params });
}
window.Vue = Vue$1;
Vue$1.component("CustomForm", CustomForm);
Vue$1.component("AttachmentView", AttachmentView);
Vue$1.component("ImageView", ImageView);
Vue$1.component("CustomInput", CustomInput);
Vue$1.component("CustomTextarea", CustomTextarea);
Vue$1.component("CustomSwitch", CustomSwitch);
Vue$1.component("ParagraphAttachmentView", ParagraphAttachmentView);
Vue$1.component("ParagraphView", ParagraphView);
Vue$1.component("CustomTreeView", CustomTreeView);
Vue$1.component("CustomCode", CustomCode);
Vue$1.component("ColorPicker", ColorPicker);
Vue$1.component("JsonEditor", JsonEditor);
Vue$1.component("WysiwygField", WysiwygField);
Vue$1.component("CustomDatetimePicker", CustomDatetimePicker);
Vue$1.component("CustomChecklist", CustomChecklist);
Vue$1.component("Group", Group);
Vue$1.component("CustomInputTag", CustomInputTag);
Vue$1.component("CustomMultiSelect", CustomMultiSelect);
Vue$1.component("PluginPage", PluginPage);
Vue$1.component("MultiselectPage", MultiselectPage);
Vue$1.component("Syslog", Syslog);
Vue$1.component("CmsImport", CmsImport);
Vue$1.component("SyncResource", SyncResource);
Vue$1.component("Draggable", draggable);
Vue$1.component("TableImageView", TableImageView);
Vue$1.component("TableCustomSwitch", TableCustomSwitch);
Vue$1.component("TableRowActions", TableRowActions);
Vue$1.mixin({
  filters: {
    translate: TranslateFilter,
    truncate: TruncateFilter
  }
});
Vue$1.use(Loading);
Vue$1.use(VueEasytable);
Vue$1.use(TreeView);
Vue$1.use(plugin);
Vue$1.use(VueRouter$1);
Vue$1.use(VueShortkey);
Vue$1.use(VueTimeago, {
  name: "timeago",
  locale: "enUS",
  locales: { enUS, zhCN }
});
function addPlugin(title, displayName, group = "System", allowed = ["admins", "imagination"]) {
  window.plugins = window.plugins || [];
  window.plugins.push({
    title,
    displayname: displayName,
    component: title,
    group,
    allowed,
    type: "plugin"
  });
}
window.addEventListener("load", async function() {
  window.TranslateService = TranslateService$4;
  const response = await axios.get(`${window.location.pathname}config`);
  const config = response.data;
  addPlugin("Syslog", "Syslog");
  if (config.import) {
    addPlugin("CmsImport", "Cms Import");
  }
  if (config.sync && !config.sync.disablePlugin) {
    addPlugin("SyncResource", "Sync Resource");
  }
  window.disableJwtLogin = _.get(config, "disableJwtLogin", false);
  window.noLogin = window.disableJwtLogin && _.get(config, "disableAuthentication", false);
  const router = new VueRouter$1({});
  new Vue$1({
    el: "#app",
    vuetify,
    router,
    render: function(createElement) {
      return createElement(this.$el.getAttribute("type") === "login" ? LoginApp : App);
    }
  });
});
