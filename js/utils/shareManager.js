/**
 * 分享管理器 — Web Share API 版
 *
 * 使用浏览器原生 Web Share API 进行分享，适用于 itch.io 等 Web 平台。
 *
 * 接入指南：
 * 1. share() 调用浏览器 navigator.share() API
 * 2. 分享成功后调用 onSuccess 回调（发放奖励）
 * 3. 分享失败/取消调用 onFail 回调
 * 4. 不支持 Web Share API 的浏览器会回退到复制链接
 */

const ShareManager = {
  /**
   * 发起分享（使用 Web Share API）
   * @param {Object}   options           - 分享配置
   * @param {string}   options.title     - 分享标题
   * @param {string}   options.text      - 分享描述文案
   * @param {string}   [options.imageUrl]- 分享图片URL（预留，Web Share API 暂不支持）
   * @param {Function} [onSuccess]       - 分享成功回调
   * @param {Function} [onFail]          - 分享失败/取消回调
   */
  share(options, onSuccess, onFail) {
    console.log('[ShareManager] 发起分享', options);

    // 分享功能暂未开放：统一提示「暂不可用」，不发放奖励
    // 待接入正式分享渠道后，删除此段即可恢复下方原有逻辑
    Modal.show({
      title: t('share.unavailable_title'),
      content: t('share.unavailable_content'),
      showCancel: false,
    });
    if (onFail) onFail();
    return;

    // 获取干净的基础 URL（移除查询参数和哈希），添加版本号绕过社交平台缓存
    const baseUrl = window.location.origin + window.location.pathname;
    const version = Date.now(); // 使用时间戳确保每次分享都是新 URL
    const url = baseUrl + '?v=' + version;

    // 检查浏览器是否支持 Web Share API
    if (navigator.share) {
      // 使用原生分享 API
      navigator.share({
        title: options.title || '看你智商藏哪',
        text: options.text || '一款超烧脑的益智推理游戏',
        url: url
      })
      .then(() => {
        console.log('[ShareManager] 分享成功');
        if (onSuccess) onSuccess();
      })
      .catch((error) => {
        console.log('[ShareManager] 分享取消或失败', error);
        if (onFail) onFail();
      });
    } else {
      // 不支持 Web Share API，回退到复制链接
      console.log('[ShareManager] 浏览器不支持 Web Share API，使用复制链接方式');

      // 尝试复制链接到剪贴板
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(() => {
            Modal.show({
              title: t('share.link_copied_title') || 'Link Copied!',
              content: t('share.link_copied_content') || 'Game link has been copied to clipboard. Share it with your friends!',
              showCancel: false,
            });
            // 复制成功也算分享成功，发放奖励
            if (onSuccess) onSuccess();
          })
          .catch((error) => {
            console.error('[ShareManager] 复制失败', error);
            Modal.show({
              title: t('share.copy_failed_title') || '复制失败',
              content: t('share.copy_failed_content') || '无法复制链接，请手动分享。',
              showCancel: false,
            });
            if (onFail) onFail();
          });
      } else {
        // 连剪贴板 API 都不支持，显示手动分享提示
        Modal.show({
          title: t('share.manual_share_title') || 'Share',
          content: (t('share.manual_share_content') || 'Copy this link to share:') + '\n' + url,
          showCancel: false,
        });
        // 显示了链接也算完成分享，发放奖励
        if (onSuccess) onSuccess();
      }
    }
  },

  /**
   * 初始化分享管理器
   */
  init() {
    if (navigator.share) {
      console.log('[ShareManager] Web Share API 可用');
    } else {
      console.log('[ShareManager] Web Share API 不可用，将使用复制链接方式');
    }
  }
};
