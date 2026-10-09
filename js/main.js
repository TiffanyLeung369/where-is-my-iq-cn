/**
 * Vue 应用入口
 * 创建 Vue 实例，注册页面组件，初始化路由
 */

const { createApp, ref, computed, markRaw } = Vue;

const app = createApp({
  setup() {
    // 当前页面名
    const currentPage = ref('home');

    // 页面组件映射
    const pageMap = {
      home: markRaw(HomePage),
      game: markRaw(GamePage),
      map: markRaw(MapPage),
      shop: markRaw(ShopPage),
    };

    // 当前页面组件
    const currentPageComponent = computed(() => {
      return pageMap[currentPage.value] || pageMap.home;
    });

    // 绑定路由更新回调
    Router.onUpdate((page) => {
      currentPage.value = page;
    });

    return {
      currentPage,
      currentPageComponent,
    };
  }
});

// Vue 错误捕获
app.config.errorHandler = function(err, vm, info) {
  console.error('[Vue Error]', err, info);
};
app.config.warnHandler = function(msg, vm, trace) {
  console.warn('[Vue Warn]', msg);
};

// 初始化（必须在 mount 之前，否则首页读到的是默认值）
initApp();

// 注入 i18n 翻译函数到 Vue 全局
app.config.globalProperties.t = t;

// 挂载应用
app.mount('#app');

// 初始化路由
Router.init();

console.log("[Main] Where's My IQ H5 started");
