/**
 * 皮肤商店页面 — Vue 3 组件
 * 从微信小程序 pages/shop/shop.wxml + shop.js 转换而来
 * 
 * swiper 轮播用 CSS transform + 触摸滑动 实现
 */

const ShopPage = {
  template: `
<div class="page">

  <!-- 背景 -->
  <div class="bg-bubbles">
    <div class="bubble bubble-1"></div>
    <div class="bubble bubble-2"></div>
    <div class="bubble bubble-3"></div>
  </div>

  <!-- 顶栏（自定义导航） -->
  <div class="top-bar" style="flex-direction:column;align-items:stretch;">
    <!-- 第一行：标题居中 -->
    <div class="shop-title" style="text-align:center;margin-bottom:3vw;">{{ t('shop.skin_closet') }}</div>
    <!-- 第二行：home靠左 + 金币靠右 -->
    <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
      <img :src="IMG.home" style="width:10.67vw; height:10.67vw; margin-left: 1.6vw; object-fit:contain" @click="onBack" />
      <div class="asset-item" @click="onBuyCoins">
        <img class="asset-icon" :src="IMG.coin" style="object-fit:contain" />
        <span class="asset-value">{{coins}}</span>
        <div class="asset-plus">+</div>
      </div>
    </div>
  </div>

  <!-- 聚光灯区 -->
  <div class="spotlight"></div>

  <!-- 皮肤轮播（3-slide 窗口法） -->
  <div class="skin-swiper"
       @pointerdown="onPointerStart"
       @pointermove="onPointerMove"
       @pointerup="onPointerEnd"
       @pointercancel="onPointerEnd">
    <div class="skin-swiper-track" ref="swiperTrack" :style="trackStyle">
      <div v-for="(item, i) in visibleSlides" :key="'s' + i"
           class="skin-swiper-slide"
           @click="onSlideClick(i)">
        <div :class="'skin-slide ' + (i === 1 ? 'active' : '')">

          <!-- 锁定遮罩 -->
          <div class="lock-overlay" v-if="!item.unlocked && i === 1">
            <span class="lock-icon">🔒</span>
          </div>

          <!-- 动画展示 -->
          <div class="skin-preview">
            <template v-if="item.animType === 'walk'">
              <div class="animate-walk">
                <img class="walk-frame-1" :src="item.dailyImage" style="object-fit:contain" />
                <img class="walk-frame-2" :src="IMG.crab_walk_2" style="object-fit:contain" />
              </div>
            </template>

            <template v-else-if="item.animType === 'fly'">
              <div class="animate-fly animate-fly-horiz">
                <div class="animate-fly-bounce">
                  <img class="walk-frame-1" :src="item.dailyImage" style="object-fit:contain" />
                  <img class="walk-frame-2" :src="item.dailyImage2" style="object-fit:contain" />
                </div>
              </div>
            </template>

            <template v-else-if="item.animType === 'swim'">
              <div class="animate-swim animate-swim-horiz">
                <div class="animate-swim-bounce">
                  <img class="swim-frame-squat" :src="item.dailyImage" style="object-fit:contain" />
                  <img class="swim-frame-fly" :src="item.dailyImage2" style="object-fit:contain" />
                </div>
              </div>
            </template>

            <template v-else-if="item.animType === 'stumble'">
              <div class="animate-stumble">
                <img class="stumble-frame-walk" :src="item.dailyImage" style="object-fit:contain" />
                <img class="stumble-frame-fall" :src="item.dailyImage2" style="object-fit:contain" />
              </div>
            </template>

            <template v-else-if="item.animType === 'soar-flap'">
              <div class="animate-soar">
                <div class="soar-wave">
                  <img class="soar-frame-up" :src="item.dailyImage" style="object-fit:contain" />
                  <img class="soar-frame-down" :src="item.dailyImage2" style="object-fit:contain" />
                </div>
              </div>
            </template>

            <template v-else-if="item.animType === 'hop'">
              <div class="animate-hop">
                <div class="hop-bounce">
                  <img class="hop-frame-squat" :src="item.dailyImage" style="object-fit:contain" />
                  <img class="hop-frame-jump" :src="item.dailyImage2" style="object-fit:contain" />
                </div>
              </div>
            </template>

            <template v-else-if="item.animType === 'chirp'">
              <div class="animate-chirp">
                <div class="chirp-sway">
                  <img class="chirp-frame-closed" :src="item.dailyImage" style="object-fit:contain" />
                  <img class="chirp-frame-open" :src="item.dailyImage2" style="object-fit:contain" />
                </div>
              </div>
            </template>

            <template v-else>
              <img class="animate-roll" :src="item.dailyImage" style="object-fit:contain" />
            </template>
          </div>

          <!-- 皮肤名称 -->
          <span class="skin-name">{{t(item.nameKey)}}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 底部操作 -->
  <div class="action-area">

    <!-- 当前已装备 -->
    <template v-if="currentSkinData.isCurrent">
      <div class="action-btn btn-current">
        <span class="action-text">{{ t('shop.in_use') }}</span>
      </div>
    </template>

    <!-- 已解锁，可装备 -->
    <template v-else-if="currentSkinData.unlocked">
      <div class="action-btn btn-equip" @click="onEquip">
        <span class="action-text">{{ t('shop.equip') }}</span>
      </div>
    </template>

    <!-- 关卡门槛未达 -->
    <template v-else-if="currentSkinData.levelLocked">
      <div class="action-btn btn-locked">
        <span class="action-text lock-requirement-text">{{ t('shop.level_required', {level: currentSkinData.unlockLevel, allStars: currentSkinData.requireAllStars ? t('shop.all_stars') : ''}) }}</span>
        <span v-if="currentSkinData.price > 0" class="lock-price-group">
          <span class="action-text">+</span>
          <img class="lock-price-icon" :src="IMG.coin" style="object-fit:contain" />
          <span class="action-text">{{currentSkinData.price}}</span>
        </span>
      </div>
    </template>

    <!-- 广告解锁（小猪）：看广告或花金币 -->
    <template v-else-if="currentSkinData.unlockType === 'ad'">
      <div class="action-btn btn-ad" @click="onWatchAd">
        <img class="action-ad-icon pencil-icon" :src="IMG.ad_icon_clean" style="object-fit:contain" />
        <span class="action-text">{{ t('shop.watch_ad_progress', {watched: pigAdWatched}) }}</span>
      </div>
      <div class="action-btn btn-unlock" style="margin-top: 2.13vw;" @click="onUnlock">
        <img class="action-coin" :src="IMG.coin" style="object-fit:contain" />
        <span class="action-text">{{ t('shop.unlock_price', {price: currentSkinData.price}) }}</span>
      </div>
    </template>

    <!-- 金币解锁 -->
    <template v-else>
      <div class="action-btn btn-unlock" @click="onUnlock">
        <img class="action-coin" :src="IMG.coin" style="object-fit:contain" />
        <span class="action-text">{{ t('shop.unlock_price', {price: currentSkinData.price}) }}</span>
      </div>
    </template>

  </div>

  <!-- ========== 炫酷解锁/换肤成功覆盖层 ========== -->
  <div class="result-overlay animate-fadeIn" v-if="showResultModal">
    <!-- 全屏彩带飘落 -->
    <div class="confetti-container">
      <div v-for="(cp, idx) in confettiPieces" :key="'sc'+idx" class="confetti-piece" :style="cp"></div>
    </div>

    <div class="modal-content">
      <!-- 动态旋转的光线条背景 -->
      <div class="light-rays-container">
        <div class="light-ray" v-for="deg in [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]" :key="deg" :style="{transform: 'rotate(' + deg + 'deg)'}"></div>
      </div>

      <!-- 放大展示当前刚解锁/佩戴的皮肤 -->
      <div class="showcase-skin">
        <img class="showcase-img" :src="currentSkinData.icon" style="object-fit:contain" />
      </div>

      <!-- 恭喜文案 -->
      <div class="modal-title-text">{{modalTitle}}</div>
    </div>

    <!-- 返回首页按钮 -->
    <div class="modal-btn-home" @click="onBackToHome">
      <span>{{ t('shop.back_home') }}</span>
    </div>
  </div>

  <!-- ========== 赚金币弹窗 ========== -->
  <div class="modal-overlay" v-if="showCoinAd" @click="onCloseCoinAd">
    <div class="exchange-card recharge-card" @click.stop="preventBubble">
      <span class="exchange-title">{{ t('shop.earn_coins') }}</span>
      <div class="coin-ad-banner">
        <div class="coin-ad-icons">
          <img :src="IMG.coin" class="coin-ad-coin-icon" style="object-fit:contain" />
          <span class="coin-ad-amount">+30</span>
        </div>
        <span class="coin-ad-desc">{{ t('shop.watch_ad_coins') }}</span>
      </div>
      <div class="coin-ad-btn-wrapper">
        <button class="coin-ad-btn pulse-wrapper" @click="onWatchCoinAd" :disabled="coinAdRemain <= 0">
          <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner pulse-corner" style="object-fit:contain" />
          <span>{{coinAdRemain > 0 ? t('shop.watch_ad_earn') : t('shop.daily_limit')}}</span>
        </button>
      </div>
      <span class="coin-ad-footer">{{ t('shop.daily_remaining', {remain: coinAdRemain}) }}</span>
    </div>
  </div>

</div>
  `,

  data() {
    return {
      IMG: IMG,
      coins: 0,
      currentIndex: 0,
      skinList: [],
      currentSkinData: {},
      pigAdWatched: 0,
      showResultModal: false,
      modalTitle: '',
      // 轮播状态
      trackOffset: 0,   // vw 偏移量（相对于居中位置）
      animating: false,  // 是否正在动画
      touchStartX: 0,
      touchStartY: 0,
      activePointerId: null,
      swiping: false,
      ignoreSlideClick: false,
      confettiPieces: [],
      // 赚金币弹窗
      showCoinAd: false,
      coinAdRemain: 5,
    };
  },

  computed: {
    // 始终只渲染 3 个 slide：前一个、当前、后一个
    visibleSlides() {
      const list = this.skinList;
      if (list.length === 0) return [];
      const len = list.length;
      const idx = this.currentIndex;
      return [
        list[(idx - 1 + len) % len],
        list[idx],
        list[(idx + 1) % len],
      ];
    },

    // track 样式：slide 宽度 78vw
    trackStyle() {
      const sw = 78; // 每个 slide 宽度 vw
      const center = -sw + (100 - sw) / 2; // 让第2个slide居中
      const x = center + this.trackOffset;
      return {
        transform: `translateX(${x}vw)`,
        transition: this.animating ? 'transform 0.3s ease' : 'none',
      };
    },
  },

  mounted() {
    this.buildSkinList();
  },

  beforeUnmount() {
    AudioManager.stopCelebrate();
  },

  methods: {
    buildSkinList() {
      const skins = appState.skins;
      const unlockedSkins = appState.unlockedSkins;
      const currentSkin = appState.currentSkin;
      const playerLevel = appState.currentLevel || 1;
      const skinIds = ['crab', 'pig', 'owl', 'octopus', 'squirrel', 'parrot', 'turtle', 'dino', 'phoenix'];

      const skinList = skinIds.map((id) => {
        const s = skins[id];
        const unlocked = unlockedSkins.indexOf(id) !== -1;
        const unlockLevel = s.unlockLevel || 0;
        const clearedLevels = playerLevel - 1;
        const levelLocked = unlockLevel > 0 && clearedLevels < unlockLevel && !unlocked;
        return {
          id: id,
          name: s.name,
          nameKey: s.nameKey,
          icon: s.icon,
          unlockType: s.unlockType,
          price: s.price,
          adRequired: s.adRequired || 0,
          unlockLevel: unlockLevel,
          requireAllStars: s.requireAllStars || false,
          levelLocked: levelLocked,
          dailyImage: s.dailyImage,
          dailyImage2: s.dailyImage2 || '',
          animType: s.dailyAnimationType,
          survivalImage: s.survivalImage,
          unlocked: unlocked,
          isCurrent: id === currentSkin,
        };
      });

      let currentIndex = 0;
      for (let i = 0; i < skinList.length; i++) {
        if (skinList[i].isCurrent) { currentIndex = i; break; }
      }

      this.skinList = skinList;
      this.currentIndex = currentIndex;
      this.coins = appState.coins;
      this.pigAdWatched = appState.pigAdWatched || 0;
      this.currentSkinData = skinList[currentIndex];
    },

    // ========== 轮播指针控制 ==========

    onPointerStart(e) {
      if (this.animating || (e.pointerType === 'mouse' && e.button !== 0)) return;
      this.activePointerId = e.pointerId;
      this.touchStartX = e.clientX;
      this.touchStartY = e.clientY;
      this.swiping = false;
      this.trackOffset = 0;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {
        // 合成事件没有活动指针时无需捕获。
      }
    },

    onPointerMove(e) {
      if (this.animating || e.pointerId !== this.activePointerId) return;
      const dx = e.clientX - this.touchStartX;
      const dy = e.clientY - this.touchStartY;
      if (!this.swiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        this.swiping = true;
      }
      if (this.swiping) {
        // px 转 vw 跟手
        this.trackOffset = dx / window.innerWidth * 100;
        e.preventDefault();
      }
    },

    onPointerEnd(e) {
      if (e.pointerId !== this.activePointerId) return;
      this.activePointerId = null;
      if (!this.swiping || this.animating) return;
      this.ignoreSlideClick = true;
      setTimeout(() => { this.ignoreSlideClick = false; }, 0);
      const sw = 78; // slide 宽度 vw
      const threshold = 15; // vw 阈值

      if (this.trackOffset < -threshold) {
        // 左滑 → 下一个
        this.animating = true;
        this.trackOffset = -sw;
        setTimeout(() => {
          this.animating = false;
          this.trackOffset = 0;
          this.currentIndex = (this.currentIndex + 1) % this.skinList.length;
          this.currentSkinData = this.skinList[this.currentIndex];
        }, 310);
      } else if (this.trackOffset > threshold) {
        // 右滑 → 上一个
        this.animating = true;
        this.trackOffset = sw;
        setTimeout(() => {
          this.animating = false;
          this.trackOffset = 0;
          this.currentIndex = (this.currentIndex - 1 + this.skinList.length) % this.skinList.length;
          this.currentSkinData = this.skinList[this.currentIndex];
        }, 310);
      } else {
        // 未达阈值，回弹
        this.animating = true;
        this.trackOffset = 0;
        setTimeout(() => { this.animating = false; }, 310);
      }
      this.swiping = false;
    },

    onSlideClick(i) {
      if (this.ignoreSlideClick) return;
      // i=0 左边（上一个），i=1 当前，i=2 右边（下一个）
      if (i === 1 || this.animating) return;
      const sw = 78;
      const dir = i === 0 ? 1 : -1; // 0=右滑看上一个, 2=左滑看下一个
      this.animating = true;
      this.trackOffset = dir * sw;
      setTimeout(() => {
        this.animating = false;
        this.trackOffset = 0;
        const len = this.skinList.length;
        this.currentIndex = dir > 0
          ? (this.currentIndex - 1 + len) % len
          : (this.currentIndex + 1) % len;
        this.currentSkinData = this.skinList[this.currentIndex];
      }, 310);
    },

    // ========== 装备 ==========

    onEquip() {
      const skinId = this.currentSkinData.id;
      appState.currentSkin = skinId;
      saveGameData();
      this.buildSkinList();
      AudioManager.playCelebrate();
      this.confettiPieces = generateConfetti(45);
      this.showResultModal = true;
      this.modalTitle = t('shop.equip_success');
    },

    // ========== 金币解锁 ==========

    onUnlock() {
      const skin = this.currentSkinData;
      if (appState.coins < skin.price) {
        Toast.show(t('shop.coins_insufficient'), 'none');
        return;
      }

      Modal.show({
        title: t('shop.confirm_unlock'),
        content: t('shop.unlock_confirm_msg', {price: skin.price, skinName: t(skin.nameKey)}),
      }).then(res => {
        if (res.confirm) {
          appState.coins -= skin.price;
          appState.unlockedSkins.push(skin.id);
          appState.currentSkin = skin.id; // 购买后直接装备（优化用户体验）
          saveGameData();
          this.buildSkinList();
          AudioManager.playCelebrate();
          this.confettiPieces = generateConfetti(45);
          this.showResultModal = true;
          this.modalTitle = t('shop.unlock_success');
        }
      });
    },

    // ========== 广告解锁（小猪） ==========

    onWatchAd() {
      AdManager.showAd('shop_unlock_pig', () => {
        appState.pigAdWatched = (appState.pigAdWatched || 0) + 1;

        if (appState.pigAdWatched >= 3) {
          // 解锁小猪
          if (appState.unlockedSkins.indexOf('pig') === -1) {
            appState.unlockedSkins.push('pig');
            appState.currentSkin = 'pig'; // 同样直接换上
          }
          saveGameData();
          this.buildSkinList();
          AudioManager.playCelebrate();
          this.confettiPieces = generateConfetti(45);
          this.showResultModal = true;
          this.modalTitle = t('shop.unlock_success');
        } else {
          saveGameData();
          this.pigAdWatched = appState.pigAdWatched;
          Toast.show(t('shop.ad_progress', {watched: appState.pigAdWatched}), 'none');
        }
      });
    },

    // ========== 返回 ==========

    onBack() {
      Router.navigateBack();
    },

    onBackToHome() {
      // 强制终止欢呼声
      AudioManager.stopCelebrate();
      // 关掉 Modal 并返回
      this.showResultModal = false;
      Router.navigateBack();
    },

    // ========== 分享 ==========

    // ========== 赚金币弹窗 ==========
    onBuyCoins() {
      var today = new Date();
      var todayStr = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
      var count = parseInt(localStorage.getItem('coinAdCount_' + todayStr)) || 0;
      this.coinAdRemain = Math.max(0, 5 - count);
      this.showCoinAd = true;
    },

    onCloseCoinAd() {
      this.showCoinAd = false;
    },

    onWatchCoinAd() {
      var today = new Date();
      var todayStr = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
      var key = 'coinAdCount_' + todayStr;
      var count = parseInt(localStorage.getItem(key)) || 0;
      if (count >= 5) { Toast.show(t('shop.daily_limit')); return; }
      var self = this;
      AdManager.showAd('coin_earn', function() {
        count++;
        localStorage.setItem(key, String(count));
        appState.coins += 30;
        saveGameData();
        self.coins = appState.coins;
        self.coinAdRemain = Math.max(0, 5 - count);
        self.showCoinAd = false;
        Toast.show(t('shop.coins_earned'), 'success');
      });
    },

    preventBubble() {},

    share() {
      ShareManager.share({
        title: t('shop.share_title'),
        text: t('shop.share_text'),
      });
    },
  },
};
