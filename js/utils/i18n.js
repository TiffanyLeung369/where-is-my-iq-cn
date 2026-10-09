/**
 * i18n 国际化模块
 * 提供 t(key, params) 全局翻译函数
 * 
 * 用法：
 *   t('home.play_btn')          → "Play"
 *   t('game.level', {n: 5})     → "Level 5"
 *   t('game.stars', {cur: 2, max: 3}) → "2/3 Stars"
 */

const I18n = {
  /** 当前语言 */
  currentLang: 'zh',

  /** 已注册的语言包 { zh: {...}, en: {...} } */
  messages: {},

  /**
   * 初始化：从 localStorage 读取语言偏好
   */
  init() {
    // 国内正式版默认只展示中文，避免旧本地缓存 app-lang=en 导致界面回到英文。
    this.currentLang = 'zh';
    localStorage.setItem('app-lang', 'zh');
  },

  /**
   * 切换语言
   */
  setLanguage(lang) {
    if (this.messages[lang]) {
      this.currentLang = lang;
      localStorage.setItem('app-lang', lang);
    }
  },

  /**
   * 注册语言包
   * @param {string} lang - 语言代码 ('zh' / 'en')
   * @param {Object} msgs - 扁平化 key-value 对象
   */
  register(lang, msgs) {
    this.messages[lang] = { ...(this.messages[lang] || {}), ...msgs };
  },

  /**
   * 翻译
   * @param {string} key - 翻译键，如 'home.play_btn'
   * @param {Object} [params] - 动态参数，如 {n: 5}
   * @returns {string}
   */
  t(key, params) {
    const msg = (this.messages[this.currentLang] && this.messages[this.currentLang][key])
             || (this.messages['en'] && this.messages['en'][key])
             || key;
    if (!params) return msg;
    return msg.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
  }
};

/**
 * 全局快捷函数
 */
function t(key, params) {
  return I18n.t(key, params);
}
