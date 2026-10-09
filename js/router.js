/**
 * 轻量路由系统
 * 基于 Vue 动态组件 + history API 实现页面切换
 */

const Router = {
  // 页面栈
  _stack: ['home'],
  // 页面参数
  _params: {},

  /** 获取当前页面名 */
  currentPage() {
    return this._stack[this._stack.length - 1];
  },

  /** 获取当前页面参数 */
  getParams() {
    return this._params;
  },

  /**
   * 导航到新页面（入栈）
   * @param {string} page - 页面名（home/game/map/shop）
   * @param {Object} params - 页面参数
   */
  navigateTo(page, params = {}) {
    this._params = params;
    this._stack.push(page);
    history.pushState({ page, params }, '', '#/' + page);
    // 触发 Vue 更新
    if (this._updateFn) this._updateFn(page);
  },

  /**
   * 返回上一页（出栈）
   */
  navigateBack() {
    if (this._stack.length > 1) {
      this._stack.pop();
      const page = this.currentPage();
      this._params = {};
      history.back();
      if (this._updateFn) this._updateFn(page);
    }
  },

  /**
   * 直接返回首页
   */
  navigateToHome() {
    this._stack = ['home'];
    this._params = {};
    history.pushState({ page: 'home' }, '', '#/home');
    if (this._updateFn) this._updateFn('home');
  },

  /**
   * 绑定更新回调（在 main.js 中设置）
   */
  onUpdate(fn) {
    this._updateFn = fn;
  },

  /**
   * 初始化 popstate 监听
   */
  init() {
    // 初始状态
    history.replaceState({ page: 'home' }, '', '#/home');

    // 监听浏览器后退按钮
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        // 浏览器后退到某个页面
        const page = e.state.page;
        // 同步栈
        if (this._stack.length > 1 && this._stack[this._stack.length - 1] !== page) {
          this._stack.pop();
        }
        this._params = e.state.params || {};
        if (this._updateFn) this._updateFn(page);
      }
    });
  }
};
