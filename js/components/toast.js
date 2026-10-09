/**
 * 自定义 Toast 组件（替代 wx.showToast）
 */
const Toast = {
  _container: null,
  _timer: null,

  _ensureContainer() {
    if (!this._container) {
      this._container = document.getElementById('toast-container');
    }
    return this._container;
  },

  /**
   * 显示 Toast 提示
   * @param {string} title - 提示文字
   * @param {string} icon - 图标类型：'none' | 'success' | 'error'
   * @param {number} duration - 显示时长（毫秒），默认 1500
   */
  show(title, icon = 'none', duration = 2000) {
    const container = this._ensureContainer();
    if (!container) return;

    // 清除之前的定时器
    if (this._timer) {
      clearTimeout(this._timer);
    }

    // 图标 HTML
    let iconHtml = '';
    if (icon === 'success') {
      iconHtml = '<div class="toast-icon toast-icon-success">✓</div>';
    } else if (icon === 'error') {
      iconHtml = '<div class="toast-icon toast-icon-error">✕</div>';
    }

    container.innerHTML = `
      <div class="toast-box">
        ${iconHtml}
        <div class="toast-text">${title}</div>
      </div>
    `;
    container.classList.add('toast-visible');

    this._timer = setTimeout(() => {
      container.classList.remove('toast-visible');
    }, duration);
  },

  hide() {
    const container = this._ensureContainer();
    if (container) {
      container.classList.remove('toast-visible');
    }
  }
};
