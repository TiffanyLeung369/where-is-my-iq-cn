/**
 * 自定义 Modal 组件（替代 wx.showModal）
 */
const Modal = {
  _container: null,
  _resolveCallback: null,

  _ensureContainer() {
    if (!this._container) {
      this._container = document.getElementById('modal-container');
    }
    return this._container;
  },

  /**
   * 显示模态对话框
   * @param {Object} options
   * @param {string} options.title - 标题
   * @param {string} options.content - 内容
   * @param {boolean} options.showCancel - 是否显示取消按钮，默认 true
   * @param {string} options.cancelText - 取消按钮文字，默认 '取消'
   * @param {string} options.confirmText - 确认按钮文字，默认 '确定'
   * @param {boolean} options.cancelOnMask - 点击遮罩是否取消，默认 true
   * @returns {Promise<{confirm: boolean, cancel: boolean}>}
   */
  show(options = {}) {
    const container = this._ensureContainer();
    if (!container) return Promise.resolve({ confirm: false, cancel: true });

    const {
      title = '',
      content = '',
      showCancel = true,
      cancelText = t('common.cancel'),
      confirmText = t('common.confirm'),
      cancelOnMask = true,
    } = options;

    return new Promise((resolve) => {
      const cancelBtn = showCancel
        ? `<button class="modal-btn modal-btn-cancel" onclick="Modal._onCancel()">${cancelText}</button>`
        : '';

      container.innerHTML = `
        <div class="modal-mask"${cancelOnMask ? ' onclick="Modal._onCancel()"' : ''}></div>
        <div class="modal-dialog">
          ${title ? `<div class="modal-title">${title}</div>` : ''}
          ${content ? `<div class="modal-content">${content}</div>` : ''}
          <div class="modal-footer">
            ${cancelBtn}
            <button class="modal-btn modal-btn-confirm" onclick="Modal._onConfirm()">${confirmText}</button>
          </div>
        </div>
      `;
      container.classList.add('modal-visible');
      this._resolveCallback = resolve;
    });
  },

  _onConfirm() {
    this._close();
    if (this._resolveCallback) {
      this._resolveCallback({ confirm: true, cancel: false });
      this._resolveCallback = null;
    }
  },

  _onCancel() {
    this._close();
    if (this._resolveCallback) {
      this._resolveCallback({ confirm: false, cancel: true });
      this._resolveCallback = null;
    }
  },

  _close() {
    const container = this._ensureContainer();
    if (container) {
      container.classList.remove('modal-visible');
    }
  }
};
