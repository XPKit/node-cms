import { c as createVuetify, a as components, d as directives, _, E as Emitter, b as axios, e as axios$1, f as _export_sfc, o as openBlock, g as createElementBlock, h as createBaseVNode, F as Fragment, r as renderList, n as normalizeClass, t as toDisplayString, i as createCommentVNode, j as autoBind, k as dayjs, l as relativeTime, m as createBlock, w as withCtx, p as createVNode, V as VBtn, q as mergeProps, s as VIcon, u as createTextVNode, v as VDivider, x as VMenu, y as VProgressLinear, z as pushScopeId, A as popScopeId, B as fuzzysort, C as resolveDirective, D as withDirectives, G as VCardTitle, H as VTextField, I as VList, J as VListItem, K as VListItemTitle, L as VCard, M as vShow, N as resolveComponent, O as VToolbarTitle, P as VSpacer, Q as VToolbar, R as mustache, S as sift, T as qs, U as lib, W as withModifiers, X as VTooltip, Y as normalizeProps, Z as guardReactiveProps, $ as VForm, a0 as pAll, a1 as VApp, a2 as VScrollYTransition, a3 as VSnackbar, a4 as VThemeProvider, a5 as vModelText, a6 as VAvatar, a7 as VChip, a8 as resolveDynamicComponent, a9 as VChipGroup, aa as VFileInput, ab as vModelSelect, ac as lodashExports, ad as normalizeStyle, ae as createRouter, af as createWebHashHistory, ag as createApp, ah as plugin, ai as VueShortkey, aj as install, ak as h } from "./vendor-ce81a00b.js";
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
const vuetify = createVuetify({
  components,
  directives,
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
  }
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
  sendOmnibarDisplayStatus(status) {
    this.events.emit("omnibar-display-status", status);
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
      await axios.get(`${window.location.pathname}changeTheme/${newTheme}`);
      console.warn("Successfully changed the theme for user");
      _.set(this.user, "theme", newTheme);
      return newTheme;
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
const _sfc_main$i = {
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
    },
    sendOmnibarDisplayStatus(status) {
      NotificationsService$1.sendOmnibarDisplayStatus(status);
    }
  }
};
const _sfc_main$h = {};
const _hoisted_1$h = { class: "showbox active" };
const _hoisted_2$e = /* @__PURE__ */ createBaseVNode("div", { class: "loader" }, [
  /* @__PURE__ */ createBaseVNode("svg", {
    class: "circular",
    viewBox: "25 25 50 50"
  }, [
    /* @__PURE__ */ createBaseVNode("circle", {
      class: "path",
      cx: "50",
      cy: "50",
      r: "20",
      fill: "none",
      "stroke-width": "2",
      "stroke-miterlimit": "10"
    })
  ])
], -1);
const _hoisted_3$b = [
  _hoisted_2$e
];
function _sfc_render$h(_ctx, _cache) {
  return openBlock(), createElementBlock("div", _hoisted_1$h, _hoisted_3$b);
}
const Loading$1 = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["render", _sfc_render$h]]);
const _sfc_main$g = {
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
const _hoisted_1$g = {
  key: 0,
  class: "locale-list"
};
const _hoisted_2$d = ["onClick"];
function _sfc_render$g(_ctx, _cache, $props, $setup, $data, $options) {
  return $props.localeList && $props.localeList.length > 1 ? (openBlock(), createElementBlock("div", _hoisted_1$g, [
    (openBlock(true), createElementBlock(Fragment, null, renderList($props.localeList, (locale, index) => {
      return openBlock(), createElementBlock("div", {
        key: index,
        class: normalizeClass(["locale", { active: $data.TranslateService.locale == locale }]),
        onClick: ($event) => $options.select(locale)
      }, toDisplayString("TL_" + locale.toUpperCase() | _ctx.translate), 11, _hoisted_2$d);
    }), 128))
  ])) : createCommentVNode("", true);
}
const LocaleList = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["render", _sfc_render$g]]);
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
  onClose(event) {
    console.info("Websocket - onClose", event);
    this.isConnecting = false;
    this.isConnected = false;
    this.events.emit("connected", false);
    clearTimeout(this.heatbeat);
    clearTimeout(this.connecting);
    this.connecting = setTimeout(async () => {
      await this.connect();
    }, 500);
  }
  onOpen(event) {
    this.onHeartbeat();
    this.isConnecting = false;
    this.isConnected = true;
    this.events.emit("connected", true);
  }
  onMessage(event) {
    const msg2 = JSON.parse(event.data);
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
const SystemInfo_vue_vue_type_style_index_0_scoped_62771463_lang = "";
const SystemInfo_vue_vue_type_style_index_1_lang = "";
dayjs.extend(relativeTime);
const _sfc_main$f = {
  props: {
    config: {
      type: [Object, Boolean],
      default: false
    },
    settingsData: {
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
  unmounted() {
    this.destroyed = true;
    clearTimeout(this.timer);
  },
  methods: {
    isActiveLink(url) {
      const urlA = new URL(window.location);
      const urlB = new URL(url);
      return urlA.host === urlB.host;
    },
    getTheme() {
      return _.get(LoginService$1, "user.theme", "light") === "dark";
    },
    async onChangeTheme() {
      const value = _.get(LoginService$1, "user.theme", "light") === "light" ? "dark" : "light";
      this.$vuetify.theme.dark = await LoginService$1.changeTheme(value) === "dark";
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
const _withScopeId$3 = (n) => (pushScopeId("data-v-62771463"), n = n(), popScopeId(), n);
const _hoisted_1$f = { class: "system-info" };
const _hoisted_2$c = { class: "links-wrapper" };
const _hoisted_3$a = { class: "node-cms-title" };
const _hoisted_4$7 = ["href"];
const _hoisted_5$6 = { class: "system-info-wrapper" };
const _hoisted_6$6 = { class: "node-cms-title flex" };
const _hoisted_7$5 = { class: "stats cpu" };
const _hoisted_8$5 = /* @__PURE__ */ _withScopeId$3(() => /* @__PURE__ */ createBaseVNode("div", { class: "node-cms-title" }, [
  /* @__PURE__ */ createBaseVNode("small", null, [
    /* @__PURE__ */ createBaseVNode("b", null, "CPU Usage")
  ])
], -1));
const _hoisted_9$5 = { class: "text" };
const _hoisted_10$5 = { class: "stats ram" };
const _hoisted_11$4 = /* @__PURE__ */ _withScopeId$3(() => /* @__PURE__ */ createBaseVNode("div", { class: "node-cms-title" }, [
  /* @__PURE__ */ createBaseVNode("small", null, [
    /* @__PURE__ */ createBaseVNode("b", null, "Memory Usage")
  ])
], -1));
const _hoisted_12$4 = { class: "text" };
const _hoisted_13$4 = {
  key: 0,
  class: "stats drive"
};
const _hoisted_14$3 = /* @__PURE__ */ _withScopeId$3(() => /* @__PURE__ */ createBaseVNode("div", { class: "node-cms-title" }, [
  /* @__PURE__ */ createBaseVNode("small", null, [
    /* @__PURE__ */ createBaseVNode("b", null, "Disk Usage")
  ])
], -1));
const _hoisted_15$3 = { class: "text" };
const _hoisted_16$3 = { class: "stats two-by-two" };
const _hoisted_17$3 = {
  key: 0,
  class: "stats network"
};
const _hoisted_18 = /* @__PURE__ */ _withScopeId$3(() => /* @__PURE__ */ createBaseVNode("div", { class: "node-cms-title" }, [
  /* @__PURE__ */ createBaseVNode("small", null, [
    /* @__PURE__ */ createBaseVNode("b", null, "Network Usage")
  ])
], -1));
const _hoisted_19 = { class: "text" };
const _hoisted_20 = { class: "stats uptime" };
const _hoisted_21 = { class: "node-cms-title" };
const _hoisted_22 = /* @__PURE__ */ _withScopeId$3(() => /* @__PURE__ */ createBaseVNode("small", null, [
  /* @__PURE__ */ createBaseVNode("b", null, "Uptime:")
], -1));
const _hoisted_23 = { class: "text" };
function _sfc_render$f(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", _hoisted_1$f, [
    $props.settingsData && $props.settingsData.linksGroups && $props.settingsData.linksGroups.length > 0 ? (openBlock(), createBlock(VMenu, {
      key: 0,
      "content-class": "links-menu",
      "offset-y": "",
      "close-on-content-click": false,
      "nudge-bottom": "5px",
      transition: "slide-y-transition"
    }, {
      activator: withCtx(({ props }) => [
        createVNode(VBtn, mergeProps({ icon: "" }, props), {
          default: withCtx(() => [
            createVNode(VIcon, null, {
              default: withCtx(() => [
                createTextVNode("mdi-dots-vertical")
              ]),
              _: 1
            })
          ]),
          _: 2
        }, 1040)
      ]),
      default: withCtx(() => [
        createBaseVNode("div", _hoisted_2$c, [
          (openBlock(true), createElementBlock(Fragment, null, renderList($props.settingsData.linksGroups, (group, i) => {
            return openBlock(), createElementBlock("div", {
              key: i,
              class: "group"
            }, [
              createBaseVNode("div", _hoisted_3$a, toDisplayString(group.value.title), 1),
              (openBlock(true), createElementBlock(Fragment, null, renderList(group.value.links, (link, y) => {
                return openBlock(), createElementBlock("a", {
                  key: y,
                  class: normalizeClass(["link", { active: $options.isActiveLink(link.value.url) }]),
                  href: link.value.url
                }, toDisplayString(link.value.name), 11, _hoisted_4$7);
              }), 128)),
              i < $props.settingsData.linksGroups.length - 1 ? (openBlock(), createBlock(VDivider, { key: 0 })) : createCommentVNode("", true)
            ]);
          }), 128))
        ])
      ]),
      _: 1
    })) : createCommentVNode("", true),
    createVNode(VMenu, {
      "content-class": "system-info-menu",
      "offset-y": "",
      "close-on-content-click": false,
      "nudge-bottom": "5px",
      transition: "slide-y-transition"
    }, {
      activator: withCtx(({ props }) => [
        createVNode(VBtn, mergeProps({ icon: "" }, props), {
          default: withCtx(() => [
            createVNode(VIcon, null, {
              default: withCtx(() => [
                createTextVNode("mdi-cog-outline")
              ]),
              _: 1
            })
          ]),
          _: 2
        }, 1040)
      ]),
      default: withCtx(() => [
        createBaseVNode("div", _hoisted_5$6, [
          createBaseVNode("div", _hoisted_6$6, [
            createBaseVNode("span", null, toDisplayString(_ctx.$filters.translate("TL_SYSTEM")), 1),
            createBaseVNode("div", {
              class: "theme-switch",
              onClick: _cache[0] || (_cache[0] = ($event) => $options.onChangeTheme())
            }, [
              createVNode(VIcon, {
                class: normalizeClass({ selected: !$options.getTheme() })
              }, {
                default: withCtx(() => [
                  createTextVNode("mdi-weather-sunny")
                ]),
                _: 1
              }, 8, ["class"]),
              createVNode(VIcon, {
                class: normalizeClass({ selected: $options.getTheme() })
              }, {
                default: withCtx(() => [
                  createTextVNode("mdi-weather-night")
                ]),
                _: 1
              }, 8, ["class"])
            ])
          ]),
          createBaseVNode("div", _hoisted_7$5, [
            _hoisted_8$5,
            createVNode(VProgressLinear, {
              rounded: "",
              "model-value": $data.system.cpu.usage
            }, null, 8, ["model-value"]),
            createBaseVNode("small", _hoisted_9$5, toDisplayString($data.system.cpu.count) + " cores (" + toDisplayString($data.system.cpu.model) + ")", 1)
          ]),
          createBaseVNode("div", _hoisted_10$5, [
            _hoisted_11$4,
            createVNode(VProgressLinear, {
              rounded: "",
              "model-value": 100 - $data.system.memory.freeMemPercentage
            }, null, 8, ["model-value"]),
            createBaseVNode("small", _hoisted_12$4, toDisplayString($options.convertBytes($data.system.memory.usedMemMb)) + " / " + toDisplayString($options.convertBytes($data.system.memory.totalMemMb)), 1)
          ]),
          $data.system.drive != "not supported" ? (openBlock(), createElementBlock("div", _hoisted_13$4, [
            _hoisted_14$3,
            createVNode(VProgressLinear, {
              rounded: "",
              "model-value": 100 - $data.system.drive.usedPercentage
            }, null, 8, ["model-value"]),
            createBaseVNode("small", _hoisted_15$3, toDisplayString($options.convertBytes($data.system.drive.usedGb * 1024)) + " / " + toDisplayString($options.convertBytes($data.system.drive.totalGb * 1024)), 1)
          ])) : createCommentVNode("", true),
          createBaseVNode("div", _hoisted_16$3, [
            $data.system.network != "not supported" ? (openBlock(), createElementBlock("div", _hoisted_17$3, [
              _hoisted_18,
              createBaseVNode("small", _hoisted_19, [
                createTextVNode(toDisplayString($options.convertBytes($data.system.network.total.outputMb)) + " ", 1),
                createVNode(VIcon, null, {
                  default: withCtx(() => [
                    createTextVNode("mdi-arrow-up")
                  ]),
                  _: 1
                }),
                createTextVNode(" / " + toDisplayString($options.convertBytes($data.system.network.total.inputMb)) + " ", 1),
                createVNode(VIcon, null, {
                  default: withCtx(() => [
                    createTextVNode("mdi-arrow-down")
                  ]),
                  _: 1
                })
              ])
            ])) : createCommentVNode("", true),
            createBaseVNode("div", _hoisted_20, [
              createBaseVNode("div", _hoisted_21, [
                _hoisted_22,
                createTextVNode(),
                createBaseVNode("small", _hoisted_23, toDisplayString($options.timeAgo($data.system.uptime)), 1)
              ])
            ])
          ])
        ])
      ]),
      _: 1
    }),
    $options.showLogoutButton ? (openBlock(), createBlock(VBtn, {
      key: 1,
      icon: "",
      onClick: _cache[1] || (_cache[1] = ($event) => $options.logout())
    }, {
      default: withCtx(() => [
        createVNode(VIcon, null, {
          default: withCtx(() => [
            createTextVNode("mdi-logout")
          ]),
          _: 1
        })
      ]),
      _: 1
    })) : createCommentVNode("", true)
  ]);
}
const SystemInfo = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["render", _sfc_render$f], ["__scopeId", "data-v-62771463"]]);
class FieldSelectorService {
  constructor() {
    this.events = new Emitter();
  }
  select(field) {
    this.events.emit("select", field);
  }
}
const FieldSelectorService$1 = new FieldSelectorService();
const Omnibar_vue_vue_type_style_index_0_lang = "";
const _sfc_main$e = {
  mixins: [_sfc_main$i],
  props: {
    selectResourceCallback: {
      type: Function,
      default: () => {
      }
    },
    groupedList: {
      type: Array,
      default: () => []
    },
    selectedItem: {
      type: Object,
      default: () => {
      }
    }
  },
  data() {
    return {
      showOmnibar: false,
      search: null,
      scrolledToBottom: false,
      resourcesList: [],
      results: [],
      highlightedItem: 0,
      searchModes: ["all", "resource", "field"],
      searchMode: "all",
      shortcutsWhenClosed: {
        "open": ["ctrl", "p"]
      },
      shortcuts: {
        "esc": ["esc"],
        "open": ["ctrl", "p"],
        "arrow-up": ["arrowup"],
        "arrow-down": ["arrowdown"],
        "enter": ["enter"],
        "all": ["shift", "a"],
        "resource": ["shift", "r"],
        "field": ["shift", "f"]
      },
      searchOptions: {
        keys: ["displayname"],
        scoreFn: (a) => {
          if (!a[0]) {
            return -1e7;
          }
          return a[0].score + (this.isResultInCurrentResource(a) ? 1e7 : 0);
        }
      }
    };
  },
  watch: {
    search() {
      this.highlightedItem = 0;
      this.results = [];
      const results = fuzzysort.go(this.search, this.getDataForSearch(), this.searchOptions);
      this.results = _.compact(_.map(results, (result, i) => {
        if (_.isNull(_.get(result, "[0]", null))) {
          return false;
        }
        result.obj.html = fuzzysort.highlight(result[0]);
        result.obj.score = result.score;
        return result.obj;
      }));
    }
  },
  mounted() {
    this.resourcesList = _.map(_.flatten(_.map(this.groupedList, "list")), (resource) => {
      resource.type = "resource";
      resource.displayname = _.get(resource, "displayname.enUS", _.get(resource, "displayname", resource.title));
      return resource;
    });
    this.fieldsList = _.flatten(_.map(this.resourcesList, (resource) => {
      return _.map(resource.schema, (field) => {
        field.resource = resource;
        field.displayname = `${resource.displayname}.${_.get(field, "label.enUS", _.get(field, "label", field.field))}`;
        field.type = "field";
        return field;
      });
    }));
  },
  methods: {
    onScroll({ target: { scrollTop, clientHeight, scrollHeight } }) {
      this.scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50;
    },
    isResultInCurrentResource(result) {
      return _.startsWith(_.get(result[0], "target", ""), _.get(this.selectedItem, "displayname", ""));
    },
    getDataForSearch() {
      if (this.searchMode === "all") {
        return _.concat(this.resourcesList, this.fieldsList);
      }
      return this.searchMode === "resource" ? this.resourcesList : this.fieldsList;
    },
    getIconForResult(result) {
      return this.getIcon(this.searchMode === "all" ? result.type : this.searchMode);
    },
    getIcon(type) {
      return `mdi-${type === "resource" ? "package" : "cursor-text"}`;
    },
    isCharHighlighted(result, i) {
      return _.includes(_.values(result._indexes), i);
    },
    showHideOmnibar(display) {
      this.showOmnibar = display;
      this.setSearchMode("all");
      if (display) {
        this.$nextTick(() => {
          const elem = _.get(this.$refs, "['search']", false);
          elem.focus();
        });
      }
      this.sendOmnibarDisplayStatus(display);
    },
    selectResult(i = -1) {
      const result = _.get(this.results, `[${i === -1 ? this.highlightedItem : i}]`, false);
      if (!result) {
        return;
      }
      const resultResource = _.includes(["resource", "plugin"], result.type) ? result : result.resource;
      if (resultResource !== this.selectedItem) {
        console.info(`Switching to resource ${resultResource.title}`);
        this.selectResourceCallback(resultResource);
      } else if (result.type === "field") {
        FieldSelectorService$1.events.emit("select", _.omit(result, "resource"));
      }
      this.showHideOmnibar(false);
    },
    setSearchMode(mode) {
      this.searchMode = mode;
      this.search = "";
    },
    // elementIsVisibleInViewport (el) {
    //   const clientHeight = this.$refs.scrollWrapper.clientHeight
    //   const scrollTop = this.$refs.scrollWrapper.scrollTop
    //   const rect = el.getBoundingClientRect()
    //   return (
    //     rect.top >= 0 && rect.top < scrollTop
    //   )
    // },
    scrollToResult(result) {
      const elem = document.getElementById(`result-${this.highlightedItem}`);
      if (elem) {
        elem.scrollIntoView();
      }
    },
    async interactiveSearch(event) {
      const action = _.get(event, "srcKey", false);
      if (!action) {
        return;
      }
      if (!this.showOmnibar) {
        if (action === "open") {
          this.showHideOmnibar(true);
        }
        return;
      }
      if (action === "esc" || action === "open") {
        this.showHideOmnibar(false);
      } else if (action === "arrow-up") {
        if (this.highlightedItem - 1 >= 0) {
          this.highlightedItem -= 1;
        } else {
          this.highlightedItem = 0;
        }
        this.scrollToResult();
      } else if (action === "arrow-down") {
        if (this.highlightedItem + 1 <= this.results.length - 1) {
          this.highlightedItem += 1;
        } else {
          this.highlightedItem = this.results.length - 1;
        }
        this.scrollToResult();
      } else if (action === "enter") {
        this.selectResult();
      } else if (_.includes(this.searchModes, action)) {
        this.setSearchMode(action);
      }
    }
  }
};
const _hoisted_1$e = ["innerHTML"];
function _sfc_render$e(_ctx, _cache, $props, $setup, $data, $options) {
  const _directive_shortkey = resolveDirective("shortkey");
  return withDirectives((openBlock(), createElementBlock("div", {
    id: "omnibar",
    onShortkey: _cache[3] || (_cache[3] = (...args) => $options.interactiveSearch && $options.interactiveSearch(...args))
  }, [
    createBaseVNode("div", {
      id: "omnibar-backdrop",
      class: normalizeClass({ displayed: $data.showOmnibar }),
      onClick: _cache[0] || (_cache[0] = ($event) => $options.showHideOmnibar(false))
    }, null, 2),
    withDirectives(createVNode(VCard, { elevation: "24" }, {
      default: withCtx(() => [
        createVNode(VCardTitle, { class: "search" }, {
          default: withCtx(() => [
            createVNode(VTextField, {
              ref: "search",
              modelValue: $data.search,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.search = $event),
              class: "search-bar",
              flat: "",
              variant: "filled",
              rounded: "",
              "hide-details": "",
              "prepend-inner-icon": "mdi-magnify",
              density: "compact",
              placeholder: _ctx.$filters.translate("TL_INSERT_KEYWORDS"),
              type: "text",
              autocomplete: "off",
              name: "search",
              prefix: $data.searchMode === "all" ? "" : `${$data.searchMode}:`
            }, null, 8, ["modelValue", "placeholder", "prefix"])
          ]),
          _: 1
        }),
        $data.results && $data.results.length > 0 ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
          createVNode(VDivider),
          createBaseVNode("div", {
            ref: "scrollWrapper",
            class: normalizeClass(["scroll-wrapper", { "scrolled-to-bottom": $data.scrolledToBottom || $data.results.length < 20 }]),
            onScroll: _cache[2] || (_cache[2] = (...args) => $options.onScroll && $options.onScroll(...args))
          }, [
            createVNode(VList, { density: "compact" }, {
              default: withCtx(() => [
                (openBlock(true), createElementBlock(Fragment, null, renderList($data.results, (item, i) => {
                  return openBlock(), createBlock(VListItem, {
                    id: "result-" + i,
                    key: i,
                    class: normalizeClass(["list", { highlighted: $data.highlightedItem === i }]),
                    ripple: false,
                    onClick: ($event) => $options.selectResult(i)
                  }, {
                    default: withCtx(() => [
                      createVNode(VListItemTitle, null, {
                        default: withCtx(() => [
                          createVNode(VIcon, { size: "small" }, {
                            default: withCtx(() => [
                              createTextVNode(toDisplayString($options.getIconForResult(item)), 1)
                            ]),
                            _: 2
                          }, 1024),
                          createBaseVNode("span", {
                            innerHTML: item.html
                          }, null, 8, _hoisted_1$e)
                        ]),
                        _: 2
                      }, 1024)
                    ]),
                    _: 2
                  }, 1032, ["id", "class", "onClick"]);
                }), 128))
              ]),
              _: 1
            })
          ], 34)
        ], 64)) : createCommentVNode("", true)
      ]),
      _: 1
    }, 512), [
      [vShow, $data.showOmnibar]
    ])
  ], 32)), [
    [_directive_shortkey, $data.showOmnibar ? $data.shortcuts : $data.shortcutsWhenClosed]
  ]);
}
const Omnibar = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["render", _sfc_render$e]]);
const ResourceList_vue_vue_type_style_index_0_scoped_07f57689_lang = "";
const _sfc_main$d = {
  components: { Omnibar },
  props: {
    selectResourceCallback: {
      type: Function,
      default: () => {
      }
    },
    groupedList: {
      type: Array,
      default: () => []
    },
    selectedItem: {
      type: Object,
      default: () => {
      }
    }
  },
  async mounted() {
    await this.$nextTick();
    if (_.isEmpty(this.selectedItem)) {
      this.selectResourceCallback(_.first(_.get(_.first(this.groupedList), "list", [])));
    }
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
const _hoisted_1$d = {
  key: 0,
  class: "resources-content"
};
const _hoisted_2$b = { class: "resource-list" };
function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_omnibar = resolveComponent("omnibar");
  return $props.groupedList ? (openBlock(), createElementBlock("div", _hoisted_1$d, [
    createVNode(_component_omnibar, {
      "select-resource-callback": $props.selectResourceCallback,
      "grouped-list": $props.groupedList,
      "selected-item": $props.selectedItem
    }, null, 8, ["select-resource-callback", "grouped-list", "selected-item"]),
    createBaseVNode("div", _hoisted_2$b, [
      (openBlock(true), createElementBlock(Fragment, null, renderList($props.groupedList, (resourceGroup, index) => {
        return openBlock(), createElementBlock("div", {
          key: `resource-group-${index}`,
          class: "resource"
        }, [
          createVNode(VMenu, {
            auto: "",
            "open-on-hover": "",
            "offset-y": "",
            "close-on-content-click": false,
            "content-class": "resources-menu"
          }, {
            activator: withCtx(({ props }) => [
              createBaseVNode("div", mergeProps({ class: "menu-btn-wrapper" }, props), [
                createVNode(VBtn, {
                  variant: $options.groupSelected(resourceGroup) ? "text" : "outlined",
                  rounded: "",
                  size: "small",
                  class: normalizeClass({ selected: $options.groupSelected(resourceGroup) })
                }, {
                  default: withCtx(() => [
                    createTextVNode(toDisplayString(_ctx.$filters.translate(resourceGroup.name)), 1)
                  ]),
                  _: 2
                }, 1032, ["variant", "class"])
              ], 16)
            ]),
            default: withCtx(() => [
              createVNode(VList, { rounded: "" }, {
                default: withCtx(() => [
                  (openBlock(true), createElementBlock(Fragment, null, renderList(resourceGroup.list, (resource) => {
                    return openBlock(), createBlock(VListItem, {
                      key: resource.name,
                      density: "compact",
                      class: normalizeClass({ selected: $props.selectedItem === resource }),
                      onClick: ($event) => $props.selectResourceCallback(resource)
                    }, {
                      default: withCtx(() => [
                        createVNode(VListItemTitle, null, {
                          default: withCtx(() => [
                            createTextVNode(toDisplayString($options.getResourceTitle(resource)), 1)
                          ]),
                          _: 2
                        }, 1024)
                      ]),
                      _: 2
                    }, 1032, ["class", "onClick"]);
                  }), 128))
                ]),
                _: 2
              }, 1024)
            ]),
            _: 2
          }, 1024)
        ]);
      }), 128))
    ])
  ])) : createCommentVNode("", true);
}
const ResourceList = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$d], ["__scopeId", "data-v-07f57689"]]);
const defaultLogo = "" + new URL("logo-3832edb8.svg", import.meta.url).href;
const NavBar_vue_vue_type_style_index_0_lang = "";
const _sfc_main$c = {
  components: { SystemInfo, ResourceList },
  props: {
    toolbarTitle: {
      type: [String, Boolean],
      default: false
    },
    groupedList: {
      type: Array,
      default: () => []
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
    selectedItem: {
      type: Object,
      default: () => {
      }
    }
  },
  data() {
    return {
      settingsData: false
    };
  },
  mounted() {
    this.getSettingsData();
  },
  methods: {
    getDefaultLogo() {
      return defaultLogo;
    },
    getLogo() {
      const foundLogo = _.find(_.get(this.settingsData, "_attachments", []), { _name: "logo" });
      return _.isUndefined(foundLogo) ? false : _.get(foundLogo, "url", "");
    },
    hasLogoOrTitle() {
      return this.getLogo() || _.get(this.settingsData, "title", false);
    },
    async getSettingsData() {
      try {
        this.settingsData = _.first(await ResourceService$1.cache("_settings"));
      } catch (error) {
        console.error(error);
      }
    },
    getSelectedItemName() {
      if (_.get(this.selectedItem, "displayname", false)) {
        return TranslateService$4.get(this.selectedItem.displayname);
      }
      return _.get(this.selectedItem, "name", false);
    }
  }
};
const _hoisted_1$c = { class: "nav-bar-wrapper" };
const _hoisted_2$a = ["src"];
const _hoisted_3$9 = ["src"];
function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_resource_list = resolveComponent("resource-list");
  const _component_system_info = resolveComponent("system-info");
  return openBlock(), createElementBlock("div", _hoisted_1$c, [
    createVNode(VToolbar, {
      class: normalizeClass(["nav-bar", $props.localeClass]),
      height: "58"
    }, {
      default: withCtx(() => [
        createVNode(VToolbarTitle, null, {
          default: withCtx(() => [
            $data.settingsData && $options.hasLogoOrTitle() ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
              $options.getLogo() ? (openBlock(), createElementBlock("img", {
                key: 0,
                src: $options.getLogo(),
                class: "logo"
              }, null, 8, _hoisted_2$a)) : $data.settingsData.title && $data.settingsData.title.length > 0 ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
                createTextVNode(toDisplayString($data.settingsData.title), 1)
              ], 64)) : createCommentVNode("", true)
            ], 64)) : (openBlock(), createElementBlock("img", {
              key: 1,
              src: $options.getDefaultLogo(),
              class: "logo"
            }, null, 8, _hoisted_3$9))
          ]),
          _: 1
        }),
        createVNode(VSpacer),
        createVNode(_component_resource_list, {
          "select-resource-callback": $props.selectResourceCallback,
          "grouped-list": $props.groupedList,
          "selected-item": $props.selectedItem
        }, null, 8, ["select-resource-callback", "grouped-list", "selected-item"]),
        createVNode(VSpacer),
        $props.config ? (openBlock(), createBlock(_component_system_info, {
          key: 0,
          config: $props.config,
          "settings-data": $data.settingsData
        }, null, 8, ["config", "settings-data"])) : createCommentVNode("", true)
      ]),
      _: 1
    }, 8, ["class"])
  ]);
}
const NavBar = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$c]]);
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
const _sfc_main$b = {
  mixins: [_sfc_main$i, RecordNameHelper],
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
    groupedList: {
      type: [Array, Boolean],
      default: () => []
    },
    resourceGroup: {
      type: [Object, Boolean],
      default: () => {
      }
    },
    selectedItem: {
      type: Object,
      default: () => {
      }
    },
    selectResourceCallback: {
      type: Function,
      default: () => {
      }
    },
    updateRecordList: {
      type: Function,
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
      lastSelectedItem: false,
      menuOpened: false,
      search: null,
      TranslateService: TranslateService$4,
      omnibarDisplayed: false,
      sift: {
        isQuery: false,
        isValid: false
      },
      query: {},
      localMultiselectItems: []
    };
  },
  computed: {
    selectedResourceGroup() {
      return _.find(this.groupedList, (resourceGroup) => this.groupSelected(resourceGroup));
    },
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
    selectedResourceGroup() {
      this.search = "";
    },
    search() {
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
  mounted() {
    NotificationsService$1.events.on("omnibar-display-status", this.onGetOmnibarDisplayStatus);
  },
  methods: {
    onGetOmnibarDisplayStatus(status) {
      this.omnibarDisplayed = status;
    },
    getShortcuts() {
      if (this.omnibarDisplayed) {
        return {};
      }
      return { esc: ["esc"], open: ["ctrl", "/"] };
    },
    getSelectedRecordIds() {
      return _.map(this.localMultiselectItems, "_id");
    },
    allRecordsSelected() {
      const ids = this.getSelectedRecordIds();
      return _.get(_.filter(this.filteredList, (record) => !_.includes(ids, record._id)), "length", 0) === 0;
    },
    onClickSelectAll() {
      const ids = this.getSelectedRecordIds();
      _.each(this.filteredList, (record) => {
        if (!_.includes(ids, record._id)) {
          this.localMultiselectItems.push(record);
        }
      });
      this.$emit("changeMultiselectItems", this.localMultiselectItems);
    },
    onClickDeselectAll() {
      this.$emit("changeMultiselectItems", []);
    },
    toggleViewMode() {
      this.localMultiselectItems = [];
      this.$emit("changeMultiselectItems", this.localMultiselectItems);
      this.$emit("selectMultiselect", !this.multiselect);
    },
    isCreatingNewRecord() {
      return this.selectedItem && !_.get(this.selectedItem, "_id", false);
    },
    copyIdToClipboard(id) {
      navigator.clipboard.writeText(id);
    },
    hasEditableRecords() {
      return _.get(_.filter(this.filteredList, (item) => _.get(item, "_local", false)), "length", 0) !== 0;
    },
    isItemSelected(item) {
      if (this.multiselect) {
        return _.includes(_.map(this.localMultiselectItems, "_id"), item._id);
      }
      return item === this.selectedItem || _.includes(_.map(this.localMultiselectItems, "_id"), item._id);
    },
    getTypePrefix(type) {
      let typePrefix = "TL_ERROR_ON_RECORD_";
      if (type === "create") {
        typePrefix += "CREATION";
      } else if (type === "update") {
        typePrefix += "UPDATE";
      } else if (type === "delete") {
        typePrefix += "DELETE";
      }
      return typePrefix ? TranslateService$4.get(typePrefix) : "Error";
    },
    manageError(error, type, record) {
      let typePrefix = this.getTypePrefix(type);
      let errorMessage = typePrefix;
      if (_.get(error, "response.data.code", 500) === 400) {
        const serverError = _.get(error, "response.data");
        if (_.get(serverError, "message", false)) {
          errorMessage = `${typePrefix}: ${serverError.message}`;
        } else {
          errorMessage = `${typePrefix}: ${TranslateService$4.get("TL_UNKNOWN_ERROR")}`;
        }
      }
      console.error(errorMessage, record);
      this.notify(errorMessage, "error");
    },
    groupSelected(resourceGroup) {
      if (!this.resource) {
        return false;
      }
      const selectedItemGroup = _.get(this.resource, "group.enUS", _.get(this.resource, "group", false));
      const groupName = _.get(resourceGroup, "name.enUS", resourceGroup.name);
      if (groupName === "TL_OTHERS" && !selectedItemGroup) {
        return true;
      }
      return groupName === selectedItemGroup;
    },
    getResourceTitle(resource) {
      if (!resource) {
        return "";
      }
      return resource.displayname ? TranslateService$4.get(resource.displayname) : resource.title;
    },
    selectAll() {
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
    async interactiveSearch(event) {
      const action = _.get(event, "srcKey", false);
      const elem = _.get(this.$refs, "['search']", false);
      if (!action || !elem) {
        return;
      }
      return action === "esc" ? elem.blur() : elem.focus();
    },
    select(item, clickedCheckbox = false) {
      if (!item._local) {
        return this.$emit("selectItem", item);
      }
      this.lastSelectedItem = item._id;
      if (!clickedCheckbox) {
        this.localMultiselectItems = [item];
        this.$emit("selectItem", item);
      } else {
        if (this.selectedItem && this.selectedItem._id === item._id) {
          return;
        }
        if (this.isItemSelected(item)) {
          this.localMultiselectItems = _.filter(this.localMultiselectItems, (i) => i._id !== item._id);
        } else {
          this.localMultiselectItems.push(item);
        }
      }
      this.$emit("changeMultiselectItems", this.localMultiselectItems);
    },
    checkIndex(index) {
      if (index + 1 <= this.filteredList.length) {
        return index + 1;
      }
      return -1;
    },
    selectTo(item, ctrlPressed = false) {
      if (!this.multiselect) {
        return;
      }
      if (ctrlPressed || item._id === this.lastSelectedItem) {
        if (_.isUndefined(_.find(this.localMultiselectItems, { _id: item._id }))) {
          this.localMultiselectItems.push(item);
        } else {
          this.localMultiselectItems = _.filter(this.localMultiselectItems, (i) => i._id !== item._id);
        }
        return this.$emit("changeMultiselectItems", this.localMultiselectItems);
      }
      if (!this.lastSelectedItem) {
        this.lastSelectedItem = item._id;
      }
      const state = _.isUndefined(_.find(this.localMultiselectItems, { _id: item._id })) ? "check" : "uncheck";
      const start = _.findIndex(this.filteredList, (i) => i._id === item._id);
      const end = _.findIndex(this.filteredList, (i) => i._id === this.lastSelectedItem);
      const firstIndex = start <= end ? start : end;
      const lastIndex = this.checkIndex(start <= end ? end : start);
      const selectedItems = _.slice(this.filteredList, firstIndex, lastIndex);
      if (state === "check") {
        _.each(selectedItems, (i) => {
          if (_.isUndefined(_.find(this.localMultiselectItems, { _id: i._id }))) {
            this.localMultiselectItems.push(i);
          }
        });
      } else {
        const ids = _.map(selectedItems, "_id");
        this.localMultiselectItems = _.filter(this.localMultiselectItems, (i) => !_.includes(ids, i._id));
      }
      this.lastSelectedItem = item._id;
      this.$emit("changeMultiselectItems", this.localMultiselectItems);
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
      return _.find(values, (value) => !!new RegExp(this.search, "i").test(value));
    }
  }
};
const _hoisted_1$b = {
  key: 0,
  class: "record-list"
};
const _hoisted_2$9 = { class: "record-list-top-bar" };
const _hoisted_3$8 = { class: "resource-title" };
const _hoisted_4$6 = {
  key: 0,
  class: "records-top-bar"
};
const _hoisted_5$5 = {
  key: 0,
  class: "multiselect-buttons"
};
const _hoisted_6$5 = ["onClick"];
const _hoisted_7$4 = { class: "item-info" };
const _hoisted_8$4 = ["onClick"];
const _hoisted_9$4 = { class: "infos-wrapper" };
const _hoisted_10$4 = {
  key: 0,
  class: "main"
};
const _hoisted_11$3 = { class: "meta" };
const _hoisted_12$3 = { class: "ts" };
const _hoisted_13$3 = ["onClick"];
function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_timeago = resolveComponent("timeago");
  const _component_RecycleScroller = resolveComponent("RecycleScroller");
  const _directive_shortkey = resolveDirective("shortkey");
  return $options.maxCount != 1 ? (openBlock(), createElementBlock("div", _hoisted_1$b, [
    createBaseVNode("div", _hoisted_2$9, [
      $options.selectedResourceGroup && $props.groupedList ? (openBlock(), createBlock(VMenu, {
        key: 0,
        modelValue: $data.menuOpened,
        "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.menuOpened = $event),
        auto: "",
        "content-class": "resources-menu sidebar",
        "offset-y": "",
        "close-on-content-click": true
      }, {
        activator: withCtx(({ props }) => [
          createBaseVNode("div", mergeProps({
            class: ["resource-selector", { opened: $data.menuOpened }]
          }, props), [
            createBaseVNode("div", _hoisted_3$8, toDisplayString($options.getResourceTitle($props.resource)), 1),
            createVNode(VIcon, { size: "large" }, {
              default: withCtx(() => [
                createTextVNode("mdi-chevron-down")
              ]),
              _: 1
            })
          ], 16)
        ]),
        default: withCtx(() => [
          createVNode(VList, { rounded: "" }, {
            default: withCtx(() => [
              (openBlock(true), createElementBlock(Fragment, null, renderList($options.selectedResourceGroup.list, (r) => {
                return openBlock(), createBlock(VListItem, {
                  key: r.name,
                  density: "compact",
                  class: normalizeClass({ selected: r === $props.resource }),
                  onClick: ($event) => r !== $props.resource ? $props.selectResourceCallback(r) : ""
                }, {
                  default: withCtx(() => [
                    createVNode(VListItemTitle, null, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString($options.getResourceTitle(r)), 1)
                      ]),
                      _: 2
                    }, 1024)
                  ]),
                  _: 2
                }, 1032, ["class", "onClick"]);
              }), 128))
            ]),
            _: 1
          })
        ]),
        _: 1
      }, 8, ["modelValue"])) : createCommentVNode("", true),
      withDirectives((openBlock(), createElementBlock("div", {
        class: normalizeClass(["search", { "is-query": $data.sift.isQuery, "is-valid": $data.sift.isQuery && $data.sift.isValid == true, "is-invalid": $data.sift.isQuery && $data.sift.isValid == false }]),
        onShortkey: _cache[2] || (_cache[2] = (...args) => $options.interactiveSearch && $options.interactiveSearch(...args))
      }, [
        createVNode(VTextField, {
          ref: "search",
          modelValue: $data.search,
          "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.search = $event),
          "prepend-inner-icon": "mdi-magnify",
          class: "search-bar",
          flat: "",
          variant: "filled",
          rounded: "",
          "hide-details": "",
          density: "compact",
          placeholder: _ctx.$filters.translate("TL_SEARCH"),
          type: "text",
          name: "search"
        }, null, 8, ["modelValue", "placeholder"]),
        $options.maxCount <= 0 || $options.listCount < $options.maxCount ? (openBlock(), createBlock(VBtn, {
          key: 0,
          elevation: "0",
          icon: "",
          class: normalizeClass(["new-record", { active: $options.isCreatingNewRecord() }]),
          onClick: $options.onClickNew
        }, {
          default: withCtx(() => [
            $props.selectedItem && !$props.multiselect ? (openBlock(), createBlock(VIcon, { key: 0 }, {
              default: withCtx(() => [
                createTextVNode("mdi-note-edit-outline")
              ]),
              _: 1
            })) : (openBlock(), createBlock(VIcon, { key: 1 }, {
              default: withCtx(() => [
                createTextVNode("mdi-note-plus-outline")
              ]),
              _: 1
            }))
          ]),
          _: 1
        }, 8, ["class", "onClick"])) : createCommentVNode("", true)
      ], 34)), [
        [_directive_shortkey, $options.getShortcuts()]
      ])
    ]),
    $options.hasEditableRecords() ? (openBlock(), createElementBlock("div", _hoisted_4$6, [
      createBaseVNode("div", {
        class: "toggle-view-mode",
        onClick: _cache[3] || (_cache[3] = ($event) => $options.toggleViewMode())
      }, [
        createVNode(VIcon, {
          size: "small",
          class: normalizeClass({ selected: !$props.multiselect })
        }, {
          default: withCtx(() => [
            createTextVNode("mdi-note-edit-outline")
          ]),
          _: 1
        }, 8, ["class"]),
        createVNode(VIcon, {
          size: "small",
          class: normalizeClass({ selected: $props.multiselect })
        }, {
          default: withCtx(() => [
            createTextVNode("mdi-format-list-checks")
          ]),
          _: 1
        }, 8, ["class"])
      ]),
      $props.multiselect ? (openBlock(), createElementBlock("div", _hoisted_5$5, [
        createBaseVNode("span", {
          class: normalizeClass({ disabled: $options.allRecordsSelected() }),
          onClick: _cache[4] || (_cache[4] = (...args) => $options.onClickSelectAll && $options.onClickSelectAll(...args))
        }, toDisplayString(_ctx.$filters.translate("TL_SELECT_ALL")), 3),
        createBaseVNode("span", {
          class: normalizeClass({ disabled: $props.multiselectItems.length === 0 }),
          onClick: _cache[5] || (_cache[5] = (...args) => $options.onClickDeselectAll && $options.onClickDeselectAll(...args))
        }, toDisplayString(_ctx.$filters.translate("TL_DESELECT_ALL")), 3)
      ])) : createCommentVNode("", true)
    ])) : createCommentVNode("", true),
    withDirectives((openBlock(), createElementBlock("div", {
      class: "records",
      onShortkey: _cache[6] || (_cache[6] = ($event) => $options.selectAll())
    }, [
      createVNode(_component_RecycleScroller, {
        class: "list",
        items: $options.filteredList || [],
        "item-size": 58,
        "key-field": "_id"
      }, {
        default: withCtx(({ item }) => [
          createBaseVNode("div", {
            class: normalizeClass(["item", { selected: $options.isItemSelected(item), frozen: !item._local }]),
            onClick: [
              withModifiers(($event) => $options.select(item), ["exact"]),
              withModifiers(($event) => $options.selectTo(item), ["shift"]),
              withModifiers(($event) => $options.selectTo(item, true), ["ctrl"])
            ]
          }, [
            createBaseVNode("div", _hoisted_7$4, [
              $props.multiselect ? (openBlock(), createElementBlock("div", {
                key: 0,
                class: normalizeClass(["checkbox", { "blink-background": $options.isItemSelected(item) }]),
                onClick: withModifiers(($event) => $options.select(item, true), ["exact"])
              }, [
                item._local ? (openBlock(), createBlock(VIcon, {
                  key: 0,
                  class: normalizeClass({ displayed: $options.isItemSelected(item) }),
                  size: "small"
                }, {
                  default: withCtx(() => [
                    createTextVNode("mdi-check-bold")
                  ]),
                  _: 2
                }, 1032, ["class"])) : createCommentVNode("", true)
              ], 10, _hoisted_8$4)) : createCommentVNode("", true),
              createBaseVNode("div", _hoisted_9$4, [
                item ? (openBlock(), createElementBlock("div", _hoisted_10$4, [
                  createVNode(VTooltip, { location: "right" }, {
                    activator: withCtx(({ props }) => [
                      createBaseVNode("span", normalizeProps(guardReactiveProps(props)), toDisplayString(_ctx.$filters.truncate(_ctx.getName(item), 15)), 17)
                    ]),
                    default: withCtx(() => [
                      createBaseVNode("span", null, toDisplayString(_ctx.getName(item)), 1)
                    ]),
                    _: 2
                  }, 1024)
                ])) : createCommentVNode("", true),
                createBaseVNode("div", _hoisted_11$3, [
                  createBaseVNode("div", _hoisted_12$3, [
                    item._updatedBy ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
                      createTextVNode(toDisplayString(item._updatedBy) + " - ", 1)
                    ], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
                      createTextVNode(toDisplayString(_ctx.$filters.translate("TL_UPDATED")), 1)
                    ], 64)),
                    createTextVNode(),
                    createBaseVNode("span", {
                      class: "time-ago",
                      onClick: ($event) => $options.copyIdToClipboard(item._id)
                    }, [
                      createVNode(_component_timeago, {
                        datetime: item._updatedAt
                      }, null, 8, ["datetime"])
                    ], 8, _hoisted_13$3)
                  ])
                ])
              ])
            ])
          ], 10, _hoisted_6$5)
        ]),
        _: 1
      }, 8, ["items"])
    ], 32)), [
      [_directive_shortkey, $props.multiselect ? ["ctrl", "a"] : false]
    ])
  ])) : createCommentVNode("", true);
}
const RecordList = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$b]]);
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
  },
  pillbox: (value, field, model) => {
    if (_.get(field, "required", false) && (!_.isArray(value) || _.isEmpty(value))) {
      return messages.fieldIsRequired;
    }
    return true;
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
    overrideType: "CustomCheckbox"
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
      multiple: true,
      searchable: true,
      onNewTag(newTag, id, options, value) {
        options.push(newTag);
        value.push(newTag);
      }
    },
    values: [],
    validator: customValidators.pillbox
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
    type: "CustomMultiSelect",
    selectOptions: {
      multiple: true,
      listBox: true,
      trackBy: "_id",
      customLabel: (item, labelProp) => {
        return _.get(labelProp, item, item);
      },
      searchable: true
    },
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
  type.density = "compact";
  type.rounded = true;
  type.filled = true;
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
      if (field.input === "pillbox") {
        schema2.selectOptions.min = field.min;
        schema2.selectOptions.max = field.max;
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
  mixins: [_sfc_main$i],
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
      let typePrefix = "TL_ERROR_ON_RECORD_";
      if (type === "create") {
        typePrefix += "CREATION";
      } else if (type === "update") {
        typePrefix += "UPDATE";
      } else if (type === "delete") {
        typePrefix += "DELETE";
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
    formatSchemaLayout(schema) {
      if (!_.get(schema, "layout.lines", false)) {
        return schema;
      }
      const alreadyPlacedFields = [];
      _.each(schema.layout.lines, (line) => {
        line.slots = line.slots || _.get(line, "fields.length", 1);
        _.each(line.fields, (field) => {
          field.schema = _.find(schema.fields, { model: field.model });
          if (_.isUndefined(field.schema)) {
            field.schema = _.find(schema.fields, { originalModel: field.model });
          }
          if (_.isUndefined(field.schema)) {
            console.error(`Couldn't find schema for field ${field.model}`);
          } else {
            alreadyPlacedFields.push(field.model);
          }
        });
      });
      _.each(schema.fields, (field) => {
        if (!_.includes(alreadyPlacedFields, field.model) && !_.includes(alreadyPlacedFields, field.originalModel)) {
          schema.layout.lines.push({ fields: [{ model: field.model, schema: field }] });
        }
      });
      return schema;
    },
    async updateSchema() {
      try {
        const disabled = !(this.record && this.record._local);
        this.$loading.start("loading-schema");
        const fields = SchemaService$1.getSchemaFields(this.resource.schema, this.resource, this.locale || this.userLocale, this.userLocale, disabled, this.resource.extraSources);
        const groups = SchemaService$1.getNestedGroups(this.resource, fields, 0);
        this.schema = this.formatSchemaLayout({
          fields: groups,
          layout: _.cloneDeep(this.resource.layout)
        });
        this.$loading.stop("loading-schema");
        this.originalFieldList = fields;
      } catch (error) {
        console.error("AbstractEditorView - updateSchema - Error happen during updateSchema:", error);
      }
    }
  }
};
const _sfc_main$a = {
  mixins: [AbstractEditorView, _sfc_main$i],
  props: {
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
      scrolledToBottom: false,
      randomId: Math.random(),
      formValid: false,
      fileInputTypes: ["file", "img", "image", "imageView", "attachmentView"],
      cachedMap: {},
      editingRecord: {},
      originalFieldList: [],
      schema: { fields: [] },
      isReady: false,
      formElem: false,
      formOptions: {
        validateAfterLoad: true,
        validateAfterChanged: true
      }
    };
  },
  watch: {
    async locale() {
      await this.updateSchema();
      this.editingRecord = _.clone(this.editingRecord);
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
    }
    // model () {
    //   console.warn('MODEL CHANGED: ', this.model)
    // }
  },
  async mounted() {
    await this.updateSchema();
    this.cloneEditingRecord();
    this.isReady = true;
    FieldSelectorService$1.events.on("select", this.onFieldSelected);
    this.$nextTick(() => {
      this.formElem = document.getElementById(this.randomId);
    });
  },
  beforeUnmount() {
    FieldSelectorService$1.events.off("select", this.onFieldSelected);
  },
  methods: {
    onScroll({ target: { scrollTop, clientHeight, scrollHeight } }) {
      this.scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50;
    },
    toggleLocale() {
      this.selectLocale(_.find(this.resource.locales, (l) => l !== this.locale));
    },
    getLocaleTranslation(locale) {
      return TranslateService$4.get("TL_" + locale.toUpperCase());
    },
    getFieldRealOffset(elem) {
      return _.get(elem, "$el.offsetTop", elem.offsetTop) - 50;
    },
    onFieldSelected(field) {
      this.schema.fields = _.map(this.schema.fields, (f) => {
        const key = `${f.localised ? `${TranslateService$4.locale}.` : ""}${field.field}`;
        if (f.model === key) {
          const elem = document.getElementById(`${key}-${this.randomId}`);
          const top = this.getFieldRealOffset(elem);
          this.formElem.scrollTo({ top });
        }
        return f;
      });
    },
    back() {
      this.$emit("back");
    },
    onError(error) {
      console.log(999, "error", error);
    },
    selectLocale(item) {
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
        console.info("Will send", uploadObject);
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
const _hoisted_1$a = { class: "top-bar" };
const _hoisted_2$8 = { class: "buttons" };
function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_top_bar_locale_list = resolveComponent("top-bar-locale-list");
  const _component_custom_form = resolveComponent("custom-form");
  return $props.record ? (openBlock(), createBlock(VCard, {
    key: 0,
    elevation: "0",
    class: normalizeClass(["record-editor", { frozen: !$props.record._local }])
  }, {
    default: withCtx(() => [
      createBaseVNode("div", _hoisted_1$a, [
        createVNode(_component_top_bar_locale_list, {
          locales: $props.resource.locales,
          locale: $props.locale,
          "select-locale": $options.selectLocale,
          back: $options.back
        }, null, 8, ["locales", "locale", "select-locale", "back"]),
        createBaseVNode("div", _hoisted_2$8, [
          $data.editingRecord._id ? (openBlock(), createBlock(VBtn, {
            key: 0,
            elevation: "0",
            class: "delete",
            icon: "",
            rounded: "",
            onClick: $options.deleteRecord
          }, {
            default: withCtx(() => [
              createVNode(VIcon, null, {
                default: withCtx(() => [
                  createTextVNode("mdi-trash-can-outline")
                ]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["onClick"])) : createCommentVNode("", true),
          createVNode(VBtn, {
            elevation: "0",
            class: "update",
            rounded: "",
            onClick: $options.createUpdateClicked
          }, {
            default: withCtx(() => [
              createTextVNode(toDisplayString(($data.editingRecord._id ? "TL_UPDATE" : "TL_CREATE") | _ctx.translate), 1)
            ]),
            _: 1
          }, 8, ["onClick"])
        ])
      ]),
      createBaseVNode("div", {
        class: normalizeClass(["scroll-wrapper", { "scrolled-to-bottom": $data.scrolledToBottom }]),
        onScroll: _cache[1] || (_cache[1] = (...args) => $options.onScroll && $options.onScroll(...args))
      }, [
        createVNode(VForm, {
          id: $data.randomId,
          ref: "vfg",
          modelValue: $data.formValid,
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.formValid = $event),
          class: "record-editor-form",
          "lazy-validation": ""
        }, {
          default: withCtx(() => [
            $data.isReady ? (openBlock(), createBlock(_component_custom_form, {
              key: 0,
              schema: $data.schema,
              "form-id": $data.randomId,
              "form-options": $data.formOptions,
              model: $data.editingRecord,
              "paragraph-level": 1,
              onError: $options.onError,
              onInput: $options.onModelUpdated
            }, null, 8, ["schema", "form-id", "form-options", "model", "onError", "onInput"])) : createCommentVNode("", true)
          ]),
          _: 1
        }, 8, ["id", "modelValue"])
      ], 34)
    ]),
    _: 1
  }, 8, ["class"])) : createCommentVNode("", true);
}
const RecordEditor = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$a]]);
const _sfc_main$9 = {
  props: ["resource", "schema", "items", "locale", "options", "selectedRecords"],
  data() {
    return {
      localSelectedRecords: [],
      columns: [],
      sourceData: [],
      tableData: [],
      rowStyleOption: {
        stripe: true
      },
      filteredColumns: [],
      sortOption: {
        multipleSort: true,
        sortAlways: true,
        sortChange: (params) => {
          this.tableData = _.sortBy(this.tableData, _.keys(params), _.values(params));
        }
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
          _.forEach(this.resource.locales, (locale, localeIndex) => {
            if (field.model === `${locale}.${field.originalModel}`) {
              field.localised = false;
              field.options.localeIndex = localeIndex + 1;
            } else {
              let newField = _.cloneDeep(field);
              newField.localised = false;
              const name = field.originalModel && TranslateService$4.get(field.originalModel);
              newField.label = `${name} (${TranslateService$4.get(`TL_${locale.toUpperCase()}`)})`;
              newField.model = `${locale}.${field.originalModel}`;
              _.set(newField, "options.localeIndex", localeIndex + 1);
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
      return _.sortBy(list, (i) => `${i.options.index}${_.get(i, "options.localeIndex", 0)}`);
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
    resetRecordsFiltering() {
      this.sourceData = this.orderedItem;
      this.tableData = this.sourceData.slice(0);
    },
    createTableColumns() {
      const columns = [{
        field: "__RECORD_SELECTION__",
        key: "__RECORD_SELECTION__",
        // title: TranslateService.get('TL_RECORD_SELECTION'),
        fixed: "left",
        align: "center",
        disableResizing: true,
        width: 20,
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
                return createVNode(resolveComponent("v-icon"), null, {
                  default: () => [createTextVNode("mdi-filter")]
                });
              }
              return createVNode(resolveComponent("v-icon"), null, {
                default: () => [createTextVNode("mdi-filter-outline")]
              });
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
        width: 75,
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
              remove: (row2) => this.$emit("remove", row2),
              edit: (row2) => this.$emit("edit", row2)
            }
          });
        }
      });
      this.columns = columns;
    },
    isRecordSelected(record) {
      return _.includes(this.localSelectedRecords, _.get(record, "_id", false));
    },
    onSelectRecord(rowId, val) {
      if (val) {
        this.localSelectedRecords.push(rowId);
      } else {
        this.localSelectedRecords = _.filter(this.localSelectedRecords, (id) => id !== rowId);
      }
      this.$emit("update:selectedRecords", this.localSelectedRecords);
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
const VueTableGenerator_vue_vue_type_style_index_0_scoped_0d37d050_lang = "";
const _hoisted_1$9 = {
  ref: "excel-container",
  class: "vue-table-generator vue-form-generator table"
};
function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_ve_table = resolveComponent("ve-table");
  return openBlock(), createElementBlock("div", _hoisted_1$9, [
    createVNode(_component_ve_table, {
      ref: "tableRef",
      "scroll-width": "0",
      "sort-option": $data.sortOption,
      "virtual-scroll-option": { enable: true },
      "column-width-resize-option": $data.columnWidthResizeOption,
      columns: $data.columns,
      "table-data": $data.tableData,
      "fixed-header": true,
      "border-around": true,
      "border-x": true,
      "border-y": true,
      "clipboard-option": $data.clipboardOption,
      "row-style-option": $data.rowStyleOption,
      "max-height": "100%",
      "row-key-field-name": "_id"
    }, null, 8, ["sort-option", "column-width-resize-option", "columns", "table-data", "clipboard-option", "row-style-option"]),
    withDirectives(createBaseVNode("div", { class: "empty-data" }, toDisplayString("TL_NO_DATA_FOUND" | _ctx.translate), 513), [
      [vShow, $data.tableData.length === 0]
    ])
  ], 512);
}
const VueTableGenerator = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$9], ["__scopeId", "data-v-0d37d050"]]);
const _sfc_main$8 = {
  components: {
    VueTableGenerator,
    RecordEditor
    // Paginate
  },
  mixins: [AbstractEditorView, _sfc_main$i],
  props: {
    groupedList: {
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
    selectedResourceCallback: {
      type: Function,
      default: () => {
      }
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
      menuOpened: false,
      isReady: false,
      omnibarDisplayed: false,
      search: null,
      cachedMap: {},
      selectedRecords: [],
      schema: { fields: [] },
      TranslateService: TranslateService$4,
      localLocale: false,
      localRecord: {},
      clonedRecordList: null
    };
  },
  computed: {
    selectedResourceGroup() {
      return _.find(this.groupedList, (resourceGroup) => this.groupSelected(resourceGroup));
    },
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
  mounted() {
    NotificationsService$1.events.on("omnibar-display-status", this.onGetOmnibarDisplayStatus);
  },
  methods: {
    onGetOmnibarDisplayStatus(status) {
      this.omnibarDisplayed = status;
    },
    getShortcuts() {
      if (this.omnibarDisplayed) {
        return {};
      }
      return { esc: ["esc"], open: ["ctrl", "/"] };
    },
    async interactiveSearch(event) {
      const action = _.get(event, "srcKey", false);
      const elem = _.get(this.$refs, "['search']", false);
      if (!action || !elem) {
        return;
      }
      return action === "esc" ? elem.blur() : elem.focus();
    },
    getResourceTitle(resource) {
      if (!resource) {
        return "";
      }
      return resource.displayname ? TranslateService$4.get(resource.displayname) : resource.title;
    },
    groupSelected(resourceGroup) {
      if (!this.resource) {
        return false;
      }
      const selectedItemGroup = _.get(this.resource, "group.enUS", _.get(this.resource, "group", false));
      const groupName = _.get(resourceGroup, "name.enUS", resourceGroup.name);
      if (groupName === "TL_OTHERS" && !selectedItemGroup) {
        return true;
      }
      return groupName === selectedItemGroup;
    },
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
    async removeRecords() {
      if (!this.askConfirmation(true)) {
        return;
      }
      await Promise.all(_.map(this.selectedRecords, (record) => this.removeRecord({ _id: record }, true)));
    },
    async removeRecord(record, skipConfirm = false) {
      if (!skipConfirm && !this.askConfirmation()) {
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
const _hoisted_1$8 = { class: "record-table-wrapper" };
const _hoisted_2$7 = { class: "resource-title" };
const _hoisted_3$7 = {
  key: 0,
  class: "top-bar"
};
const _hoisted_4$5 = { class: "buttons" };
function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_top_bar_locale_list = resolveComponent("top-bar-locale-list");
  const _component_vue_table_generator = resolveComponent("vue-table-generator");
  const _component_record_editor = resolveComponent("record-editor");
  const _directive_shortkey = resolveDirective("shortkey");
  return openBlock(), createElementBlock("div", _hoisted_1$8, [
    $options.selectedResourceGroup && $props.groupedList ? (openBlock(), createBlock(VMenu, {
      key: 0,
      modelValue: $data.menuOpened,
      "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.menuOpened = $event),
      auto: "",
      "content-class": "resources-menu full-width",
      "offset-y": "",
      "close-on-content-click": true
    }, {
      activator: withCtx(({ props }) => [
        createBaseVNode("div", mergeProps({ class: "resource-selector" }, props, {
          class: { opened: $data.menuOpened }
        }), [
          createBaseVNode("div", _hoisted_2$7, toDisplayString($options.getResourceTitle($props.resource)), 1),
          createVNode(VIcon, { size: "large" }, {
            default: withCtx(() => [
              createTextVNode("mdi-chevron-down")
            ]),
            _: 1
          })
        ], 16)
      ]),
      default: withCtx(() => [
        createVNode(VList, { rounded: "" }, {
          default: withCtx(() => [
            (openBlock(true), createElementBlock(Fragment, null, renderList($options.selectedResourceGroup.list, (r) => {
              return openBlock(), createBlock(VListItem, {
                key: r.name,
                density: "compact",
                class: normalizeClass({ selected: r === $props.resource }),
                onClick: ($event) => r !== $props.resource ? _ctx.selectResourceCallback(r) : ""
              }, {
                default: withCtx(() => [
                  createVNode(VListItemTitle, null, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString($options.getResourceTitle(r)), 1)
                    ]),
                    _: 2
                  }, 1024)
                ]),
                _: 2
              }, 1032, ["class", "onClick"]);
            }), 128))
          ]),
          _: 1
        })
      ]),
      _: 1
    }, 8, ["modelValue"])) : createCommentVNode("", true),
    createVNode(VCard, {
      class: normalizeClass(["record-table", { "has-back-button": $props.record }]),
      elevation: "0"
    }, {
      default: withCtx(() => [
        !$props.record ? (openBlock(), createElementBlock("div", _hoisted_3$7, [
          createVNode(_component_top_bar_locale_list, {
            locales: $props.resource.locales,
            locale: $props.locale,
            "select-locale": $options.selectLocale,
            back: $options.back
          }, null, 8, ["locales", "locale", "select-locale", "back"]),
          withDirectives((openBlock(), createElementBlock("div", {
            class: "search",
            onShortkey: _cache[2] || (_cache[2] = (...args) => $options.interactiveSearch && $options.interactiveSearch(...args))
          }, [
            createVNode(VTextField, {
              ref: "search",
              modelValue: $data.search,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.search = $event),
              "prepend-inner-icon": "mdi-magnify",
              class: "search-bar",
              flat: "",
              variant: "filled",
              rounded: "",
              "hide-details": "",
              density: "compact",
              placeholder: "TL_SEARCH" | _ctx.translate,
              type: "text",
              name: "search"
            }, null, 8, ["modelValue", "placeholder"])
          ], 32)), [
            [_directive_shortkey, $options.getShortcuts()]
          ]),
          createBaseVNode("div", _hoisted_4$5, [
            $data.selectedRecords.length > 0 ? (openBlock(), createBlock(VBtn, {
              key: 0,
              elevation: "0",
              rounded: "",
              class: "delete-selected-records",
              onClick: $options.removeRecords
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString("TL_DELETE_SELECTED_RECORDS" | _ctx.translate), 1)
              ]),
              _: 1
            }, 8, ["onClick"])) : createCommentVNode("", true),
            $options.maxCount <= 0 || $options.listCount < $options.maxCount ? (openBlock(), createBlock(VBtn, {
              key: 1,
              elevation: "0",
              rounded: "",
              class: "new",
              onClick: $options.createRecord
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString("TL_ADD_NEW_RECORD" | _ctx.translate), 1)
              ]),
              _: 1
            }, 8, ["onClick"])) : createCommentVNode("", true)
          ])
        ])) : createCommentVNode("", true),
        !$props.record ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
          $data.isReady ? (openBlock(), createBlock(_component_vue_table_generator, {
            key: 0,
            options: $options.options,
            "selected-records": $data.selectedRecords,
            resource: $props.resource,
            schema: $data.schema,
            items: $options.filteredList,
            locale: $data.localLocale,
            onRemove: $options.removeRecord,
            onEdit: $options.editRecord
          }, null, 8, ["options", "selected-records", "resource", "schema", "items", "locale", "onRemove", "onEdit"])) : createCommentVNode("", true)
        ], 64)) : createCommentVNode("", true),
        $props.record ? (openBlock(), createBlock(_component_record_editor, {
          key: $props.record._id,
          record: $data.localRecord,
          resource: $props.resource,
          locale: $data.localLocale,
          "user-locale": $data.TranslateService.locale,
          onUpdateRecordList: $options.updateRecordList,
          onBack: $options.back
        }, null, 8, ["record", "resource", "locale", "user-locale", "onUpdateRecordList", "onBack"])) : createCommentVNode("", true)
      ]),
      _: 1
    }, 8, ["class"])
  ]);
}
const RecordTable = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$8]]);
const App_vue_vue_type_style_index_0_lang = "";
const _sfc_main$7 = {
  components: {
    // ResourceList,
    NavBar,
    RecordList,
    RecordEditor,
    Loading: Loading$1,
    LocaleList,
    RecordTable
  },
  mixins: [_sfc_main$i],
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
    groupedList() {
      const others = { name: "TL_OTHERS" };
      const plugins = { name: "TL_PLUGINS" };
      let groups = [others, plugins];
      let list = _.union(this.resourceList, _.map(this.pluginList, (item) => _.extend(item, { type: "plugin" })));
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
    },
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
        const allResources = _.union(this.pluginList, this.resourceList);
        if (allResources.length > 0) {
          this.selectResource(_.find(allResources, { title: this.$route.query.id }));
        }
      }
    }
  },
  unmounted() {
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
      if (_.isUndefined(resource)) {
        return;
      }
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
      const extraResources = (obj) => {
        if (_.isArray(obj)) {
          _.each(obj, (item) => {
            extraResources(item);
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
                      extraResources(item);
                      const paragraphSchema = _.get(item, "schema");
                      extraResources(paragraphSchema);
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
      extraResources(resource.schema);
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
const _hoisted_1$7 = {
  key: 0,
  class: "cms-layout"
};
const _hoisted_2$6 = { class: "resources" };
const _hoisted_3$6 = { class: "records" };
function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_nav_bar = resolveComponent("nav-bar");
  const _component_locale_list = resolveComponent("locale-list");
  const _component_record_list = resolveComponent("record-list");
  const _component_record_editor = resolveComponent("record-editor");
  const _component_record_table = resolveComponent("record-table");
  const _component_plugin_page = resolveComponent("plugin-page");
  const _component_loading = resolveComponent("loading");
  return openBlock(), createBlock(VApp, null, {
    default: withCtx(() => [
      createVNode(VThemeProvider, {
        theme: _ctx.$vuetify && _ctx.$vuetify.theme && !_ctx.$vuetify.theme.isDark ? "light" : "dark"
      }, {
        default: withCtx(() => [
          createVNode(VScrollYTransition, null, {
            default: withCtx(() => [
              $data.notification.type ? (openBlock(), createBlock(VSnackbar, {
                key: 0,
                modelValue: $data.notification,
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.notification = $event),
                "multi-line": "",
                location: "centered",
                class: normalizeClass(["notification elevation-10", $options.getNotificationClass()]),
                timeout: $data.notification.type === "error" ? -1 : 1e3
              }, {
                action: withCtx(({ props }) => [
                  createVNode(VBtn, mergeProps({
                    rounded: "",
                    icon: ""
                  }, props, {
                    onClick: _cache[0] || (_cache[0] = ($event) => $data.notification = {})
                  }), {
                    default: withCtx(() => [
                      createVNode(VIcon, null, {
                        default: withCtx(() => [
                          createTextVNode("mdi-close-circle-outline")
                        ]),
                        _: 1
                      })
                    ]),
                    _: 2
                  }, 1040)
                ]),
                default: withCtx(() => [
                  createBaseVNode("p", null, toDisplayString($data.notification.message), 1)
                ]),
                _: 1
              }, 8, ["modelValue", "timeout", "class"])) : createCommentVNode("", true)
            ]),
            _: 1
          }),
          $data.user ? (openBlock(), createElementBlock("div", _hoisted_1$7, [
            createBaseVNode("div", {
              class: normalizeClass(["cms-inner-layout", $options.getThemeClass()])
            }, [
              $data.resourceList.length > 0 ? (openBlock(), createBlock(_component_nav_bar, {
                key: 0,
                config: $data.config,
                "toolbar-title": $data.toolbarTitle,
                "locale-class": { locale: $data.localeList && $data.localeList.length > 1 },
                "select-resource-group-callback": $options.selectResourceGroup,
                "select-resource-callback": $options.selectResource,
                "grouped-list": $options.groupedList,
                "selected-resource-group": $data.selectedResourceGroup,
                "selected-item": $data.selectedResource || $data.selectedPlugin
              }, null, 8, ["config", "toolbar-title", "locale-class", "select-resource-group-callback", "select-resource-callback", "grouped-list", "selected-resource-group", "selected-item"])) : createCommentVNode("", true),
              createBaseVNode("div", _hoisted_2$6, [
                $data.localeList ? (openBlock(), createBlock(_component_locale_list, {
                  key: 0,
                  "locale-list": $data.localeList
                }, null, 8, ["locale-list"])) : createCommentVNode("", true)
              ]),
              createBaseVNode("div", _hoisted_3$6, [
                $data.selectedResource && (!$data.selectedResource.view || $data.selectedResource.view == "list") ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
                  $data.selectedResource ? (openBlock(), createBlock(_component_record_list, {
                    key: 0,
                    list: $data.recordList,
                    locale: $data.locale,
                    "selected-item": $data.selectedRecord,
                    "grouped-list": $options.groupedList,
                    "resource-group": $data.selectedResourceGroup,
                    resource: $data.selectedResource,
                    "select-resource-callback": $options.selectResource,
                    multiselect: $data.multiselect,
                    "multiselect-items": $data.multiselectItems,
                    onSelectItem: $options.selectRecord,
                    onChangeMultiselectItems: $options.onChangeMultiselectItems,
                    onSelectMultiselect: $options.onSelectMultiselect,
                    onUpdateRecordList: $options.updateRecordList
                  }, null, 8, ["list", "locale", "selected-item", "grouped-list", "resource-group", "resource", "select-resource-callback", "multiselect", "multiselect-items", "onSelectItem", "onChangeMultiselectItems", "onSelectMultiselect", "onUpdateRecordList"])) : createCommentVNode("", true),
                  $data.selectedRecord && !$data.multiselect ? (openBlock(), createBlock(_component_record_editor, {
                    key: $data.selectedRecord._id,
                    record: $data.selectedRecord,
                    resource: $data.selectedResource,
                    locale: $data.locale,
                    "user-locale": $data.TranslateService.locale,
                    onUpdateRecordList: $options.updateRecordList
                  }, null, 8, ["record", "resource", "locale", "user-locale", "onUpdateRecordList"])) : createCommentVNode("", true)
                ], 64)) : createCommentVNode("", true),
                $data.selectedResource && $data.selectedResource.view == "table" ? (openBlock(), createBlock(_component_record_table, {
                  key: 1,
                  "grouped-list": $options.groupedList,
                  "resource-group": $data.selectedResourceGroup,
                  "select-resource-callback": $options.selectResource,
                  "record-list": $data.recordList,
                  resource: $data.selectedResource,
                  record: $data.selectedRecord,
                  locale: $data.locale,
                  "user-locale": $data.TranslateService.locale,
                  onUnsetRecord: $options.unsetSelectedRecord,
                  onUpdateRecordList: $options.updateRecordList
                }, null, 8, ["grouped-list", "resource-group", "select-resource-callback", "record-list", "resource", "record", "locale", "user-locale", "onUnsetRecord", "onUpdateRecordList"])) : createCommentVNode("", true),
                $data.selectedPlugin ? (openBlock(), createBlock(_component_plugin_page, {
                  key: 2,
                  plugin: $data.selectedPlugin
                }, null, 8, ["plugin"])) : createCommentVNode("", true)
              ]),
              $data.LoadingService.isShow ? (openBlock(), createBlock(_component_loading, { key: 1 })) : createCommentVNode("", true)
            ], 2)
          ])) : createCommentVNode("", true)
        ]),
        _: 1
      }, 8, ["theme"])
    ]),
    _: 1
  });
}
const App = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$7]]);
const LoginApp_vue_vue_type_style_index_0_scoped_61042664_lang = "";
const _sfc_main$6 = {
  components: {
    Loading: Loading$1
  },
  mixins: [_sfc_main$i],
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
const _hoisted_1$6 = { class: "login-canvas" };
const _hoisted_2$5 = { class: "node-cms-title" };
const _hoisted_3$5 = ["placeholder"];
const _hoisted_4$4 = ["placeholder"];
const _hoisted_5$4 = {
  key: 0,
  class: "error-message"
};
const _hoisted_6$4 = ["disabled"];
function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_loading = resolveComponent("loading");
  return openBlock(), createBlock(VApp, null, {
    default: withCtx(() => [
      $data.loaded ? (openBlock(), createElementBlock("div", {
        key: 0,
        class: normalizeClass(["cms-layout", { displayed: $data.showLoginForm }])
      }, [
        createBaseVNode("div", _hoisted_1$6, [
          createBaseVNode("form", {
            onSubmit: _cache[2] || (_cache[2] = withModifiers((...args) => $options.login && $options.login(...args), ["prevent"]))
          }, [
            createBaseVNode("div", _hoisted_2$5, toDisplayString(_ctx.$filters.translate("TL_LOGIN")), 1),
            withDirectives(createBaseVNode("input", {
              ref: "username",
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.username = $event),
              autofocus: "",
              type: "test",
              name: "nodeCmsUsername",
              autocomplete: "on",
              placeholder: _ctx.$filters.translate("TL_USERNAME")
            }, null, 8, _hoisted_3$5), [
              [vModelText, $data.username]
            ]),
            withDirectives(createBaseVNode("input", {
              ref: "password",
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.password = $event),
              type: "password",
              name: "nodeCmsPassword",
              autocomplete: "on",
              placeholder: _ctx.$filters.translate("TL_PASSWORD")
            }, null, 8, _hoisted_4$4), [
              [vModelText, $data.password]
            ]),
            $data.loginFailed ? (openBlock(), createElementBlock("span", _hoisted_5$4, toDisplayString(_ctx.$filters.translate("TL_LOGIN_FAIL")), 1)) : createCommentVNode("", true),
            createBaseVNode("div", {
              class: normalizeClass(["login-btn-wrapper", { disabled: !$data.username || !$data.password || $data.loggingIn }])
            }, [
              createBaseVNode("button", { disabled: $data.loggingIn }, toDisplayString(_ctx.$filters.translate("TL_CONFIRM")), 9, _hoisted_6$4)
            ], 2)
          ], 32)
        ])
      ], 2)) : createCommentVNode("", true),
      $data.LoadingService.isShow ? (openBlock(), createBlock(_component_loading, { key: 1 })) : createCommentVNode("", true)
    ]),
    _: 1
  });
}
const LoginApp = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$6], ["__scopeId", "data-v-61042664"]]);
const MultiselectPage_vue_vue_type_style_index_0_scoped_1bff322a_lang = "";
const _sfc_main$5 = {
  mixins: [RecordNameHelper, AbstractEditorView, _sfc_main$i],
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
      scrolledToBottom: false,
      size: _.size,
      isEmpty: _.isEmpty
    };
  },
  methods: {
    onScroll({ target: { scrollTop, clientHeight, scrollHeight } }) {
      this.scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50;
    },
    deselectItem(item) {
      this.$emit("changeMultiselectItems", _.filter(this.multiselectItems, (i) => i._id !== item._id));
    },
    onClickCancel() {
      this.$emit("cancel");
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
const _hoisted_1$5 = { class: "top-bar" };
const _hoisted_2$4 = { class: "buttons" };
const _hoisted_3$4 = { class: "selected-records-list" };
function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createBlock(VCard, {
    elevation: "0",
    class: "multiselect-page"
  }, {
    default: withCtx(() => [
      createBaseVNode("div", _hoisted_1$5, [
        createBaseVNode("h3", null, toDisplayString("TL_NUMBER_OF_SELECTED_RECORDS" | _ctx.translate(null, { num: $data.size($props.multiselectItems) })), 1),
        createBaseVNode("div", _hoisted_2$4, [
          createVNode(VBtn, {
            elevation: "0",
            class: "delete",
            rounded: "",
            disabled: $data.isEmpty($props.multiselectItems),
            onClick: $options.onClickDelete
          }, {
            default: withCtx(() => [
              createTextVNode(toDisplayString("TL_DELETE" | _ctx.translate), 1)
            ]),
            _: 1
          }, 8, ["disabled", "onClick"])
        ])
      ]),
      createBaseVNode("div", {
        class: normalizeClass(["scroll-wrapper", { "scrolled-to-bottom": $data.scrolledToBottom }]),
        onScroll: _cache[0] || (_cache[0] = (...args) => $options.onScroll && $options.onScroll(...args))
      }, [
        createBaseVNode("div", _hoisted_3$4, [
          (openBlock(true), createElementBlock(Fragment, null, renderList($props.multiselectItems, (item) => {
            return openBlock(), createElementBlock("div", {
              key: item._id,
              class: "selected-record"
            }, [
              createVNode(VChip, {
                variant: "outlined",
                c: "",
                small: "",
                ripple: false
              }, {
                default: withCtx(() => [
                  createVNode(VAvatar, { start: "" }, {
                    default: withCtx(() => [
                      createVNode(VIcon, {
                        size: "small",
                        onClick: ($event) => $options.deselectItem(item)
                      }, {
                        default: withCtx(() => [
                          createTextVNode("mdi-close-circle-outline")
                        ]),
                        _: 2
                      }, 1032, ["onClick"])
                    ]),
                    _: 2
                  }, 1024),
                  createTextVNode(" " + toDisplayString(_ctx.getName(item) | _ctx.truncate(15)) + " (" + toDisplayString(item._id) + ") ", 1)
                ]),
                _: 2
              }, 1024)
            ]);
          }), 128))
        ])
      ], 34)
    ]),
    _: 1
  });
}
const MultiselectPage = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$5], ["__scopeId", "data-v-1bff322a"]]);
const CustomForm_vue_vue_type_style_index_0_scoped_ff943210_lang = "";
const PluginPage_vue_vue_type_style_index_0_scoped_284fcf40_lang = "";
const PluginPage_vue_vue_type_style_index_1_lang = "";
const _sfc_main$4 = {
  props: ["plugin"]
};
const _hoisted_1$4 = { class: "plugin-page" };
function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", _hoisted_1$4, [
    (openBlock(), createBlock(resolveDynamicComponent($props.plugin.component)))
  ]);
}
const PluginPage = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$4], ["__scopeId", "data-v-284fcf40"]]);
const Syslog_vue_vue_type_style_index_0_scoped_049fdc3c_lang = "";
const _sfc_main$3 = {
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
  async unmounted() {
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
    detectScroll(event) {
      const scrollHeight = _.get(event, "srcElement.scrollHeight", 0);
      const scrollTop = _.get(event, "srcElement.scrollTop", 0);
      const clientHeight = _.get(event, "srcElement.clientHeight", 0);
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
const _hoisted_1$3 = { class: "syslog" };
const _hoisted_2$3 = { class: "buttons" };
const _hoisted_3$3 = ["placeholder"];
const _hoisted_4$3 = {
  key: 1,
  class: "item filter-out"
};
const _hoisted_5$3 = { class: "item logs-raised-flags" };
const _hoisted_6$3 = {
  key: 0,
  class: "bg-error"
};
const _hoisted_7$3 = {
  ref: "log-viewer",
  class: "log-viewer-wrapper"
};
const _hoisted_8$3 = ["data-line-id", "data-is-active"];
const _hoisted_9$3 = ["onClick"];
const _hoisted_10$3 = ["innerHTML"];
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_DynamicScrollerItem = resolveComponent("DynamicScrollerItem");
  const _component_DynamicScroller = resolveComponent("DynamicScroller");
  return openBlock(), createElementBlock("div", _hoisted_1$3, [
    createBaseVNode("div", _hoisted_2$3, [
      createBaseVNode("button", {
        class: normalizeClass(["item autoscroll", { active: $data.autoscroll }]),
        onClick: _cache[0] || (_cache[0] = (...args) => $options.onClickAutoscroll && $options.onClickAutoscroll(...args))
      }, [
        $data.autoscroll ? (openBlock(), createBlock(VIcon, { key: 0 }, {
          default: withCtx(() => [
            createTextVNode("mdi-lock-outline")
          ]),
          _: 1
        })) : (openBlock(), createBlock(VIcon, { key: 1 }, {
          default: withCtx(() => [
            createTextVNode("mdi-unlock")
          ]),
          _: 1
        }))
      ], 2),
      createBaseVNode("button", {
        class: "item clear",
        onClick: _cache[1] || (_cache[1] = (...args) => $options.onClickClear && $options.onClickClear(...args))
      }, [
        createVNode(VIcon, null, {
          default: withCtx(() => [
            createTextVNode("mdi-trash-can-outline")
          ]),
          _: 1
        })
      ]),
      createBaseVNode("button", {
        class: "item refresh",
        onClick: _cache[2] || (_cache[2] = (...args) => $options.onClickRefresh && $options.onClickRefresh(...args))
      }, [
        createVNode(VIcon, null, {
          default: withCtx(() => [
            createTextVNode("mdi-refresh")
          ]),
          _: 1
        })
      ]),
      withDirectives(createBaseVNode("input", {
        "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.searchKey = $event),
        class: normalizeClass([{ "is-sift": $data.searchKey && $data.searchKey.search("sift:") === 0 }, "item search"]),
        placeholder: "TL_SEARCH" | _ctx.translate,
        onInput: _cache[4] || (_cache[4] = (...args) => $options.onInputSearch && $options.onInputSearch(...args))
      }, null, 42, _hoisted_3$3), [
        [vModelText, $data.searchKey]
      ]),
      $data.searchKey && $data.searchKey.length > 0 ? (openBlock(), createElementBlock("button", {
        key: 0,
        class: "item clear-search",
        onClick: _cache[5] || (_cache[5] = (...args) => $options.onClickClearSearch && $options.onClickClearSearch(...args))
      }, [
        createVNode(VIcon, null, {
          default: withCtx(() => [
            createTextVNode("mdi-close")
          ]),
          _: 1
        })
      ])) : createCommentVNode("", true),
      $data.filterOutLines > 0 ? (openBlock(), createElementBlock("div", _hoisted_4$3, [
        createVNode(VIcon, null, {
          default: withCtx(() => [
            createTextVNode("mdi-target")
          ]),
          _: 1
        }),
        createTextVNode(toDisplayString($data.filterOutLines) + " lines are filter out", 1)
      ])) : createCommentVNode("", true),
      createBaseVNode("div", _hoisted_5$3, [
        $data.warningQty >= 0 ? (openBlock(), createElementBlock("span", {
          key: 0,
          class: "flag-item flag-warning",
          onClick: _cache[6] || (_cache[6] = ($event) => $options.filterLevel(1))
        }, [
          createVNode(VIcon, null, {
            default: withCtx(() => [
              createTextVNode("mdi-flag-outline")
            ]),
            _: 1
          }),
          createTextVNode(" " + toDisplayString($data.warningQty), 1)
        ])) : createCommentVNode("", true),
        $data.errorQty >= 0 ? (openBlock(), createElementBlock("span", {
          key: 1,
          class: "flag-item flag-error",
          onClick: _cache[7] || (_cache[7] = ($event) => $options.filterLevel(2))
        }, [
          createVNode(VIcon, null, {
            default: withCtx(() => [
              createTextVNode("mdi-alert-box-outline")
            ]),
            _: 1
          }),
          createTextVNode(" " + toDisplayString($data.errorQty), 1)
        ])) : createCommentVNode("", true)
      ])
    ]),
    $data.error ? (openBlock(), createElementBlock("div", _hoisted_6$3, toDisplayString("TL_ERROR_RETRIEVE_SYSLOG" | _ctx.translate), 1)) : createCommentVNode("", true),
    createBaseVNode("div", _hoisted_7$3, [
      createVNode(_component_DynamicScroller, {
        ref: "scroller",
        items: $data.sysLog,
        "min-item-size": 14,
        class: "scroller"
      }, {
        default: withCtx(({ item, index, active }) => [
          createVNode(_component_DynamicScrollerItem, {
            item,
            active,
            "size-dependencies": [
              $options.calculateLineNumberSpacing(item.id),
              item.line
            ],
            "data-index": index
          }, {
            default: withCtx(() => [
              createBaseVNode("div", {
                class: "line-wrapper",
                "data-line-id": item.id,
                "data-is-active": active
              }, [
                createBaseVNode("div", {
                  class: normalizeClass(["line-number", { stickId: $data.stickyId === item.id, search: $data.searchKey }]),
                  onClick: ($event) => $options.jumpTo(item.id)
                }, toDisplayString(item.id), 11, _hoisted_9$3),
                createBaseVNode("div", {
                  class: "line-content",
                  innerHTML: item.html
                }, null, 8, _hoisted_10$3)
              ], 8, _hoisted_8$3)
            ]),
            _: 2
          }, 1032, ["item", "active", "size-dependencies", "data-index"])
        ]),
        _: 1
      }, 8, ["items"])
    ], 512)
  ]);
}
const Syslog = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$3], ["__scopeId", "data-v-049fdc3c"]]);
const CmsImport_vue_vue_type_style_index_0_scoped_92eca463_lang = "";
const CmsImport_vue_vue_type_style_index_1_lang = "";
const _sfc_main$2 = {
  data() {
    return {
      config: null,
      status: null,
      error: null,
      type: 0,
      loading: false,
      uploadedXlsx: null,
      dragover: false
    };
  },
  async mounted() {
    const response = await axios("./config");
    this.config = response.data.import;
  },
  methods: {
    getRules() {
      return [(value) => !value || value.type === "text/xlsx" || value.type === "text/xls" || value.type === "text/csv" || "Only XLSX/XLS/CSV files allowed"];
    },
    clickOnFileInput() {
      this.$refs.xlsxFile.$refs.input.click();
    },
    onDrop(event) {
      this.dragover = false;
      if (event.dataTransfer.files.length > 1) {
        return console.error("Only one file can be uploaded at a time..");
      }
      this.onChangeXlsxFile(event, event.dataTransfer.files);
    },
    async onChangeXlsxFile(event, files = false) {
      this.uploadedXlsx = null;
      const file = _.first(files || _.get(event, "target.files", event)) || event;
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
const _withScopeId$2 = (n) => (pushScopeId("data-v-92eca463"), n = n(), popScopeId(), n);
const _hoisted_1$2 = { class: "plugin-wrapper" };
const _hoisted_2$2 = /* @__PURE__ */ _withScopeId$2(() => /* @__PURE__ */ createBaseVNode("div", { class: "plugin-title" }, [
  /* @__PURE__ */ createBaseVNode("h5", null, "Cms Import")
], -1));
const _hoisted_3$2 = { class: "main-container" };
const _hoisted_4$2 = { class: "config-resources" };
const _hoisted_5$2 = /* @__PURE__ */ _withScopeId$2(() => /* @__PURE__ */ createBaseVNode("h5", null, "Resources", -1));
const _hoisted_6$2 = /* @__PURE__ */ _withScopeId$2(() => /* @__PURE__ */ createBaseVNode("div", { class: "divider dashed" }, null, -1));
const _hoisted_7$2 = /* @__PURE__ */ _withScopeId$2(() => /* @__PURE__ */ createBaseVNode("h5", null, "Actions", -1));
const _hoisted_8$2 = { class: "other-actions" };
const _hoisted_9$2 = /* @__PURE__ */ _withScopeId$2(() => /* @__PURE__ */ createBaseVNode("div", { class: "divider dashed" }, null, -1));
const _hoisted_10$2 = /* @__PURE__ */ _withScopeId$2(() => /* @__PURE__ */ createBaseVNode("h5", null, "Upload Xlsx", -1));
const _hoisted_11$2 = /* @__PURE__ */ _withScopeId$2(() => /* @__PURE__ */ createBaseVNode("div", { class: "subtext" }, "Import Excel", -1));
const _hoisted_12$2 = { class: "other-actions margin-top" };
const _hoisted_13$2 = { key: 0 };
const _hoisted_14$2 = { key: 0 };
const _hoisted_15$2 = { key: 1 };
const _hoisted_16$2 = ["innerHTML"];
const _hoisted_17$2 = ["innerHTML"];
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", _hoisted_1$2, [
    _hoisted_2$2,
    createVNode(VCard, {
      elevation: "0",
      class: "cms-import"
    }, {
      default: withCtx(() => [
        createBaseVNode("div", _hoisted_3$2, [
          createBaseVNode("div", _hoisted_4$2, [
            _hoisted_5$2,
            $data.config && $data.config.resources ? (openBlock(), createBlock(VChipGroup, {
              key: 0,
              column: ""
            }, {
              default: withCtx(() => [
                (openBlock(true), createElementBlock(Fragment, null, renderList($data.config.resources, (item, index) => {
                  return openBlock(), createBlock(VChip, {
                    key: index,
                    small: "",
                    ripple: false
                  }, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(item), 1)
                    ]),
                    _: 2
                  }, 1024);
                }), 128))
              ]),
              _: 1
            })) : createCommentVNode("", true)
          ]),
          _hoisted_6$2,
          _hoisted_7$2,
          createBaseVNode("div", null, [
            createVNode(VBtn, {
              rounded: "",
              density: "compact",
              onClick: _cache[0] || (_cache[0] = ($event) => $options.openFile())
            }, {
              default: withCtx(() => [
                createTextVNode("Edit Google Sheet")
              ]),
              _: 1
            }),
            createBaseVNode("div", _hoisted_8$2, [
              createVNode(VBtn, {
                rounded: "",
                density: "compact",
                disabled: $data.loading,
                onClick: _cache[1] || (_cache[1] = ($event) => $options.checkStatus())
              }, {
                default: withCtx(() => [
                  createTextVNode("Check Difference")
                ]),
                _: 1
              }, 8, ["disabled"]),
              createVNode(VBtn, {
                rounded: "",
                density: "compact",
                disabled: $data.loading,
                onClick: _cache[2] || (_cache[2] = ($event) => $options.execute())
              }, {
                default: withCtx(() => [
                  createTextVNode("Import from Remote")
                ]),
                _: 1
              }, 8, ["disabled"])
            ])
          ]),
          _hoisted_9$2,
          _hoisted_10$2,
          _hoisted_11$2,
          createVNode(VCard, {
            class: normalizeClass(["file-input-card", { "drag-and-drop": $data.dragover, bold: $data.uploadedXlsx && $data.uploadedXlsx.name }]),
            elevation: "0",
            onDrop: _cache[3] || (_cache[3] = withModifiers(($event) => $options.onDrop($event), ["prevent"])),
            onDragover: _cache[4] || (_cache[4] = withModifiers(($event) => $data.dragover = true, ["prevent"])),
            onClick: _cache[5] || (_cache[5] = ($event) => $options.clickOnFileInput()),
            onDragenter: _cache[6] || (_cache[6] = withModifiers(($event) => $data.dragover = true, ["prevent"])),
            onDragleave: _cache[7] || (_cache[7] = withModifiers(($event) => $data.dragover = false, ["prevent"]))
          }, {
            default: withCtx(() => [
              !$data.uploadedXlsx ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
                createTextVNode("Click or drag & drop to import an .xlsx file")
              ], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
                createTextVNode(toDisplayString($data.uploadedXlsx.name), 1)
              ], 64)),
              createVNode(VFileInput, {
                ref: "xlsxFile",
                accept: ".xlsx, .xls, .csv",
                rules: $options.getRules(),
                class: "hidden-field",
                flat: "",
                density: "compact",
                "hide-details": "",
                type: "file",
                onChange: $options.onChangeXlsxFile
              }, null, 8, ["rules", "onChange"])
            ]),
            _: 1
          }, 8, ["class"]),
          createBaseVNode("div", _hoisted_12$2, [
            createVNode(VBtn, {
              rounded: "",
              density: "compact",
              disabled: $data.loading || !$data.uploadedXlsx,
              onClick: _cache[8] || (_cache[8] = ($event) => $options.checkXlsxStatus())
            }, {
              default: withCtx(() => [
                createTextVNode("Check Difference")
              ]),
              _: 1
            }, 8, ["disabled"]),
            createVNode(VBtn, {
              rounded: "",
              density: "compact",
              disabled: $data.loading || !$data.uploadedXlsx,
              onClick: _cache[9] || (_cache[9] = ($event) => $options.executeXlsx())
            }, {
              default: withCtx(() => [
                createTextVNode("Import from Remote")
              ]),
              _: 1
            }, 8, ["disabled"])
          ]),
          $data.status || $data.error ? (openBlock(), createElementBlock("div", _hoisted_13$2, [
            $data.type == 0 ? (openBlock(), createElementBlock("h6", _hoisted_14$2, "Difference:")) : (openBlock(), createElementBlock("h6", _hoisted_15$2, "Status:")),
            createBaseVNode("pre", { innerHTML: $data.status }, null, 8, _hoisted_16$2),
            createBaseVNode("pre", { innerHTML: $data.error }, null, 8, _hoisted_17$2)
          ])) : createCommentVNode("", true)
        ])
      ]),
      _: 1
    })
  ]);
}
const CmsImport = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$2], ["__scopeId", "data-v-92eca463"]]);
const SyncResource_vue_vue_type_style_index_0_scoped_5bc476c0_lang = "";
const _sfc_main$1 = {
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
  unmounted() {
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
const _withScopeId$1 = (n) => (pushScopeId("data-v-5bc476c0"), n = n(), popScopeId(), n);
const _hoisted_1$1 = { class: "sync-resources main" };
const _hoisted_2$1 = /* @__PURE__ */ _withScopeId$1(() => /* @__PURE__ */ createBaseVNode("h1", null, "Sync Resources", -1));
const _hoisted_3$1 = { key: 0 };
const _hoisted_4$1 = ["value"];
const _hoisted_5$1 = {
  key: 0,
  class: "num-records"
};
const _hoisted_6$1 = /* @__PURE__ */ _withScopeId$1(() => /* @__PURE__ */ createBaseVNode("span", null, "number of records", -1));
const _hoisted_7$1 = { class: "num-records-wrapper" };
const _hoisted_8$1 = ["num"];
const _hoisted_9$1 = {
  key: 1,
  class: "num-records"
};
const _hoisted_10$1 = /* @__PURE__ */ _withScopeId$1(() => /* @__PURE__ */ createBaseVNode("span", null, "records difference", -1));
const _hoisted_11$1 = { class: "num-records-wrapper" };
const _hoisted_12$1 = ["set"];
const _hoisted_13$1 = /* @__PURE__ */ _withScopeId$1(() => /* @__PURE__ */ createBaseVNode("span", null, "local / remote", -1));
const _hoisted_14$1 = { key: 0 };
const _hoisted_15$1 = { key: 1 };
const _hoisted_16$1 = {
  key: 1,
  class: "na-field"
};
const _hoisted_17$1 = {
  key: 1,
  class: "bg-error"
};
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", _hoisted_1$1, [
    _hoisted_2$1,
    $data.config ? (openBlock(), createElementBlock("div", _hoisted_3$1, [
      withDirectives(createBaseVNode("select", {
        "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.selectedResource = $event),
        onChange: _cache[1] || (_cache[1] = (...args) => $options.onChangeResource && $options.onChangeResource(...args))
      }, [
        (openBlock(true), createElementBlock(Fragment, null, renderList($data.config.sync.resources, (item) => {
          return openBlock(), createElementBlock("option", {
            key: item,
            value: item
          }, toDisplayString(item), 9, _hoisted_4$1);
        }), 128))
      ], 544), [
        [vModelSelect, $data.selectedResource]
      ]),
      !$data.isEmpty($data.recordData) ? (openBlock(), createElementBlock("div", _hoisted_5$1, [
        _hoisted_6$1,
        createBaseVNode("div", _hoisted_7$1, [
          (openBlock(true), createElementBlock(Fragment, null, renderList($data.environments, (env) => {
            return openBlock(), createElementBlock("div", {
              key: env,
              class: "num-record",
              num: $data.environments.length
            }, [
              createBaseVNode("span", null, toDisplayString(env), 1),
              createBaseVNode("span", null, toDisplayString($data.get($data.recordData, `${env}.length`, "N/A")), 1)
            ], 8, _hoisted_8$1);
          }), 128))
        ])
      ])) : createCommentVNode("", true),
      !$data.isEmpty($data.reportData) ? (openBlock(), createElementBlock("div", _hoisted_9$1, [
        _hoisted_10$1,
        createBaseVNode("div", _hoisted_11$1, [
          createBaseVNode("div", {
            class: "num-record",
            num: "1",
            set: _ctx.enabled = $data.get($data.recordData, `local.length`) !== void 0 && $data.get($data.recordData, `remote.length`) !== void 0
          }, [
            _ctx.enabled ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
              $data.get($data.syncStatus, "local.status") !== "syncing" && $data.get($data.syncStatus, "remote.status") !== "syncing" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
                _hoisted_13$1,
                createBaseVNode("span", null, "create: " + toDisplayString($data.reportData.create), 1),
                createBaseVNode("span", null, "update: " + toDisplayString($data.reportData.update), 1),
                createBaseVNode("span", null, "remove: " + toDisplayString($data.reportData.remove), 1),
                $data.includes($data.get($data.syncStatus, "remote.allows"), "write") ? (openBlock(), createElementBlock("span", _hoisted_14$1, [
                  createBaseVNode("button", {
                    onClick: _cache[2] || (_cache[2] = ($event) => $options.onClickDeploy("local", "remote"))
                  }, "push to remote")
                ])) : createCommentVNode("", true),
                $data.includes($data.get($data.syncStatus, "local.allows"), "write") ? (openBlock(), createElementBlock("span", _hoisted_15$1, [
                  createBaseVNode("button", {
                    onClick: _cache[3] || (_cache[3] = ($event) => $options.onClickDeploy("remote", "local"))
                  }, "pull from remote")
                ])) : createCommentVNode("", true)
              ], 64)) : createCommentVNode("", true),
              $data.get($data.syncStatus, "local.status") === "syncing" ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [
                createBaseVNode("span", null, "resource: " + toDisplayString($data.get($data.syncStatus, `local.resource`)), 1),
                createBaseVNode("span", null, "created: " + toDisplayString($data.get($data.syncStatus, `local.created`)) + " / " + toDisplayString($data.get($data.syncStatus, `local.createTotal`)), 1),
                createBaseVNode("span", null, "updated: " + toDisplayString($data.get($data.syncStatus, `local.updated`)) + " / " + toDisplayString($data.get($data.syncStatus, `local.updateTotal`)), 1),
                createBaseVNode("span", null, "removed: " + toDisplayString($data.get($data.syncStatus, `local.removed`)) + " / " + toDisplayString($data.get($data.syncStatus, `local.removeTotal`)), 1)
              ], 64)) : createCommentVNode("", true),
              $data.get($data.syncStatus, "remote.status") === "syncing" ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [
                createBaseVNode("span", null, "resource: " + toDisplayString($data.get($data.syncStatus, `remote.resource`)), 1),
                createBaseVNode("span", null, "created: " + toDisplayString($data.get($data.syncStatus, `remote.created`)) + " / " + toDisplayString($data.get($data.syncStatus, `remote.createTotal`)), 1),
                createBaseVNode("span", null, "updated: " + toDisplayString($data.get($data.syncStatus, `remote.updated`)) + " / " + toDisplayString($data.get($data.syncStatus, `remote.updateTotal`)), 1),
                createBaseVNode("span", null, "removed: " + toDisplayString($data.get($data.syncStatus, `remote.removed`)) + " / " + toDisplayString($data.get($data.syncStatus, `remote.removeTotal`)), 1)
              ], 64)) : createCommentVNode("", true)
            ], 64)) : createCommentVNode("", true),
            !_ctx.enabled ? (openBlock(), createElementBlock("span", _hoisted_16$1, " N/A ")) : createCommentVNode("", true)
          ], 8, _hoisted_12$1)
        ])
      ])) : createCommentVNode("", true)
    ])) : createCommentVNode("", true),
    $data.error ? (openBlock(), createElementBlock("div", _hoisted_17$1, " Error: " + toDisplayString($data.error), 1)) : createCommentVNode("", true)
  ]);
}
const SyncResource = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__scopeId", "data-v-5bc476c0"]]);
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
  props: ["model", "schema", "formOptions", "disabled", "focused"],
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
  watch: {
    focused() {
      if (this.focused === -1) {
        return;
      }
      let elem = lodashExports.get(this.$refs, "input", false);
      if (!elem) {
        return console.error("no input ref for ", this.schema);
      }
      if (!lodashExports.isFunction(elem.focus)) {
        return;
      }
      if (this.focused) {
        elem.focus();
      }
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
({
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
});
const CustomCode_vue_vue_type_style_index_0_lang = "";
const Wysiwyg_vue_vue_type_style_index_0_lang = "";
const ParagraphView_vue_vue_type_style_index_0_scoped_bbfa30c8_lang = "";
const ParagraphView_vue_vue_type_style_index_1_lang = "";
const ImageView_vue_vue_type_style_index_0_scoped_ee3c6fe5_lang = "";
const AttachmentView_vue_vue_type_style_index_0_scoped_8487bcb4_lang = "";
const ParagraphAttachmentView_vue_vue_type_style_index_0_scoped_d7a49211_lang = "";
const DatetimePicker_vue_vue_type_style_index_0_scoped_c6aa99c4_lang = "";
const _sfc_main = {
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
  unmounted() {
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
    keyIsDown(event) {
      const key = event.which || event.keycode;
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
        event.preventDefault();
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
    calendarClicked(event) {
      if (event.target.id !== "j-hour" && event.target.id !== "j-minute") {
        this.minuteSelectorVisible = false;
        this.hourSelectorVisible = false;
      }
      event.cancelBubble = true;
      if (event.stopPropagation) {
        event.stopPropagation();
      }
    },
    documentClicked(event) {
      if (event.target.id !== "tj-datetime-input") {
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
const _withScopeId = (n) => (pushScopeId("data-v-c6aa99c4"), n = n(), popScopeId(), n);
const _hoisted_1 = ["value", "name"];
const _hoisted_2 = { class: "year-month-wrapper" };
const _hoisted_3 = { class: "month-setter" };
const _hoisted_4 = { class: "year" };
const _hoisted_5 = { class: "month-setter" };
const _hoisted_6 = { class: "month" };
const _hoisted_7 = { class: "headers" };
const _hoisted_8 = ["onClick"];
const _hoisted_9 = { class: "hour-selector" };
const _hoisted_10 = { ref: "hourScroller" };
const _hoisted_11 = ["onClick"];
const _hoisted_12 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createBaseVNode("div", { class: "time-separator" }, [
  /* @__PURE__ */ createBaseVNode("span", null, ":")
], -1));
const _hoisted_13 = { class: "minute-selector" };
const _hoisted_14 = { ref: "minuteScroller" };
const _hoisted_15 = ["onClick"];
const _hoisted_16 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createBaseVNode("div", { class: "time-separator" }, [
  /* @__PURE__ */ createBaseVNode("span", null, ":")
], -1));
const _hoisted_17 = { class: "minute-selector" };
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", {
    style: normalizeStyle({ width: $props.width }),
    class: "datetime-picker",
    onClick: _cache[11] || (_cache[11] = ($event) => $options.calendarClicked($event))
  }, [
    createBaseVNode("div", null, [
      createBaseVNode("input", {
        id: "tj-datetime-input",
        ref: "input",
        readonly: "",
        type: "text",
        value: $options.display(),
        name: $props.name,
        autocomplete: "off",
        onClick: _cache[0] || (_cache[0] = (...args) => $options.toggleCal && $options.toggleCal(...args))
      }, null, 8, _hoisted_1),
      createBaseVNode("div", {
        class: normalizeClass(["calender-div", { noDisplay: $data.hideCal }])
      }, [
        createBaseVNode("div", {
          class: normalizeClass({ noDisplay: $options.hideDate })
        }, [
          createBaseVNode("div", _hoisted_2, [
            createBaseVNode("div", _hoisted_3, [
              createBaseVNode("span", {
                type: "button",
                class: "nav-l",
                onClick: _cache[1] || (_cache[1] = (...args) => $options.leftYear && $options.leftYear(...args))
              }, [
                createVNode(VIcon, null, {
                  default: withCtx(() => [
                    createTextVNode("mdi-chevron-left")
                  ]),
                  _: 1
                })
              ]),
              createBaseVNode("span", _hoisted_4, toDisplayString($data.year), 1),
              createBaseVNode("span", {
                type: "button",
                class: "nav-r",
                onClick: _cache[2] || (_cache[2] = (...args) => $options.rightYear && $options.rightYear(...args))
              }, [
                createVNode(VIcon, null, {
                  default: withCtx(() => [
                    createTextVNode("mdi-chevron-right")
                  ]),
                  _: 1
                })
              ])
            ]),
            createBaseVNode("div", _hoisted_5, [
              createBaseVNode("span", {
                type: "button",
                class: "nav-l",
                onClick: _cache[3] || (_cache[3] = (...args) => $options.leftMonth && $options.leftMonth(...args))
              }, [
                createVNode(VIcon, null, {
                  default: withCtx(() => [
                    createTextVNode("mdi-chevron-left")
                  ]),
                  _: 1
                })
              ]),
              createBaseVNode("span", _hoisted_6, toDisplayString("TL_" + $options.month.toUpperCase() | _ctx.translate), 1),
              createBaseVNode("span", {
                type: "button",
                class: "nav-r",
                onClick: _cache[4] || (_cache[4] = (...args) => $options.rightMonth && $options.rightMonth(...args)),
                onMousedown: _cache[5] || (_cache[5] = withModifiers(() => {
                }, ["stop", "prevent"]))
              }, [
                createVNode(VIcon, null, {
                  default: withCtx(() => [
                    createTextVNode("mdi-chevron-right")
                  ]),
                  _: 1
                })
              ], 32)
            ])
          ]),
          createBaseVNode("div", _hoisted_7, [
            (openBlock(true), createElementBlock(Fragment, null, renderList($data.days, (d, index) => {
              return openBlock(), createElementBlock("span", {
                key: index,
                class: "days"
              }, toDisplayString("TL_" + d.toUpperCase() | _ctx.translate), 1);
            }), 128))
          ]),
          createBaseVNode("div", null, [
            (openBlock(true), createElementBlock(Fragment, null, renderList($options.ports, (port, index) => {
              return openBlock(), createElementBlock("span", {
                key: index,
                class: normalizeClass(["port", { activePort: index === $data.activePort }]),
                onClick: ($event) => $options.setDay(index, port)
              }, toDisplayString(port), 11, _hoisted_8);
            }), 128))
          ])
        ], 2),
        createBaseVNode("div", {
          class: normalizeClass(["time-picker", { noDisplay: $options.hideTime }])
        }, [
          createBaseVNode("div", _hoisted_9, [
            createBaseVNode("div", {
              id: "j-hour",
              onClick: _cache[6] || (_cache[6] = (...args) => $options.showHourSelector && $options.showHourSelector(...args))
            }, toDisplayString($options.padZero($data.hour)), 1),
            createBaseVNode("div", {
              ref: "hourScrollerWrapper",
              class: normalizeClass(["scroll-hider", { showSelector: $data.hourSelectorVisible }])
            }, [
              createBaseVNode("ul", _hoisted_10, [
                (openBlock(true), createElementBlock(Fragment, null, renderList($options.hours, (h2, index) => {
                  return openBlock(), createElementBlock("li", {
                    key: index,
                    class: normalizeClass({ active: index == $data.hourIndex }),
                    onClick: ($event) => $options.setHour(index, true)
                  }, toDisplayString(h2), 11, _hoisted_11);
                }), 128))
              ], 512)
            ], 2)
          ]),
          _hoisted_12,
          createBaseVNode("div", _hoisted_13, [
            createBaseVNode("div", {
              id: "j-minute",
              onClick: _cache[7] || (_cache[7] = (...args) => $options.showMinuteSelector && $options.showMinuteSelector(...args))
            }, toDisplayString($options.padZero($data.minute)), 1),
            createBaseVNode("div", {
              ref: "minuteScrollerWrapper",
              class: normalizeClass(["scroll-hider", { showSelector: $data.minuteSelectorVisible }])
            }, [
              createBaseVNode("ul", _hoisted_14, [
                (openBlock(true), createElementBlock(Fragment, null, renderList($options.minutes, (m, index) => {
                  return openBlock(), createElementBlock("li", {
                    key: index,
                    class: normalizeClass({ active: index == $data.minuteIndex }),
                    onClick: ($event) => $options.setMinute(index, true)
                  }, toDisplayString(m), 11, _hoisted_15);
                }), 128))
              ], 512)
            ], 2)
          ]),
          _hoisted_16,
          createBaseVNode("div", _hoisted_17, [
            createBaseVNode("div", {
              onClick: _cache[8] || (_cache[8] = (...args) => $options.changePeriod && $options.changePeriod(...args))
            }, toDisplayString("TL_" + $data.period.toUpperCase() | _ctx.translate), 1)
          ])
        ], 2),
        createBaseVNode("span", {
          type: "button",
          class: "okButton",
          onClick: _cache[9] || (_cache[9] = ($event) => $options.setDate(true))
        }, toDisplayString("TL_OK" | _ctx.translate), 1),
        createBaseVNode("span", {
          type: "button",
          class: "okButton",
          onClick: _cache[10] || (_cache[10] = ($event) => $options.clearDate())
        }, toDisplayString("TL_CLEAR" | _ctx.translate), 1)
      ], 2)
    ])
  ], 4);
}
const datetime = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c6aa99c4"]]);
({
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
});
const CustomMultiSelect_vue_vue_type_style_index_0_lang = "";
const CustomTextarea_vue_vue_type_style_index_0_lang = "";
const CustomCheckbox_vue_vue_type_style_index_0_scoped_18cbabbb_lang = "";
const Group_vue_vue_type_style_index_0_scoped_443c84f7_lang = "";
const TableImageView_vue_vue_type_style_index_0_scoped_7d14c05c_lang = "";
const TableCustomCheckbox_vue_vue_type_style_index_0_scoped_676f4230_lang = "";
const TableRowActions_vue_vue_type_style_index_0_scoped_2c4e866b_lang = "";
const Loading = {
  install(app2, options) {
    this.params = options;
    app2.config.globalProperties.$loading = LoadingService$1;
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
const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: "/", component: App }]
});
const app = createApp({
  render: () => {
    const mountEl = document.querySelector("#app");
    if (!mountEl) {
      return h(App);
    }
    return h(mountEl.getAttribute("type") === "login" ? LoginApp : App);
  }
});
window.nodeCms = app;
app.config.globalProperties.$filters = {
  translate: TranslateFilter,
  truncate: TruncateFilter
};
app.use(router).use(vuetify).component("PluginPage", PluginPage).component("MultiselectPage", MultiselectPage).component("Syslog", Syslog).component("CmsImport", CmsImport).component("SyncResource", SyncResource).use(Loading).use(plugin).use(VueShortkey).use(install, {
  name: "timeago"
  // TODO: hugo - later - add locales via import { en, zh } from "date-fns/locale";
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
let recaptchaScript = document.createElement("script");
recaptchaScript.setAttribute("src", "./plugins/scripts/bundle.js");
document.head.appendChild(recaptchaScript);
window.addEventListener("load", async function() {
  _.each(window.plugins, (item) => {
    item.type = "plugin";
  });
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
  app.mount("#app");
});
