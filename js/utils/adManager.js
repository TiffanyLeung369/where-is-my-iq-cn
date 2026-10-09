/**
 * 广告管理器 — 桩函数版
 * 
 * 在正式接入 4399 广告 SDK 之前，showAd 直接触发成功回调（免费发放奖励）。
 * 后续接入 4399 SDK 时只需修改此文件。
 * 
 * 接入指南：
 * 1. 在 init() 中初始化 4399 广告 SDK
 * 2. 在 showAd() 中根据 scene 映射到对应的广告位 ID，调用平台 API
 * 3. 广告播放完成后调用 onSuccess，失败/取消调用 onFail
 * 
 * 广告场景（scene）清单：
 * ┌──────────────────────┬──────────────────────────────────┐
 * │ scene                │ 说明                             │
 * ├──────────────────────┼──────────────────────────────────┤
 * │ stamina_recover      │ 首页·体力不足弹窗·看广告恢复体力 │
 * │ coin_earn            │ 首页·赚金币弹窗·看广告得金币     │
 * │ daily_entry          │ 首页·每日挑战入口·看广告进入      │
 * │ survival_entry       │ 首页·生存模式入口·看广告进入      │
 * │ hint_buy             │ 游戏内·看广告得1个提示            │
 * │ place_one_buy        │ 普通模式·看广告得1个放一只        │
 * │ normal_boost         │ 普通模式·通关·广告翻倍金币        │
 * │ normal_revive        │ 普通模式·失败·广告复活            │
 * │ daily_boost          │ 每日挑战·通关·广告翻倍体力        │
 * │ daily_revive         │ 每日挑战·失败·广告复活            │
 * │ daily_retry          │ 每日挑战·复活后再失败·广告重玩    │
 * │ survival_double      │ 生存模式·结算·广告双倍奖励        │
 * │ survival_revive      │ 生存模式·失败·广告复活            │
 * │ survival_continue    │ 生存模式·失败·广告续命            │
 * │ survival_retry       │ 生存模式·失败·广告免费重试        │
 * │ shop_unlock_pig      │ 商店·看广告解锁小猪皮肤          │
 * └──────────────────────┴──────────────────────────────────┘
 */

const AdManager = {
  /**
   * 展示激励视频广告（桩函数：直接发放奖励）
   * @param {string}   scene     - 广告场景标识（用于映射广告位ID）
   * @param {Function} onSuccess - 广告看完/跳过后的成功回调
   * @param {Function} [onFail]  - 广告播放失败/取消回调
   */
  showAd(scene, onSuccess, onFail) {
    // 兼容旧的两参数调用方式：showAd(onSuccess, onFail)
    if (typeof scene === 'function') {
      onFail = onSuccess;
      onSuccess = scene;
      scene = 'unknown';
    }
    console.log(`[AdManager] 桩函数：场景=${scene}，直接发放奖励`);
    // 模拟短暂延迟，让体验更自然
    setTimeout(() => {
      if (onSuccess) onSuccess();
    }, 300);
  },

  /**
   * 预留：初始化 4399 广告 SDK
   * 上架 4399 时在此接入平台 SDK
   */
  init() {
    console.log('[AdManager] 桩函数模式，未接入广告 SDK');
  }
};
