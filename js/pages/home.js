/**
 * Home 页面 — Vue 3 组件
 * 从微信小程序 pages/home/home.wxml + home.js 转换而来
 */

function getLocalToday() {
  const dt = new Date();
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const HomePage = {
  template: `
<div class="page">

  <!-- 启动(Splash) -->
  <div class="splash-screen" v-if="isSplashLoading">

    <!-- 中心游戏 Logo 与标题 -->
    <div class="splash-center">
      <div class="splash-logo-bg">
        <img class="splash-logo-img" :src="IMG.logo" style="object-fit:contain" />
      </div>
      <span class="splash-title">{{ t('home.game_title') }}</span>

      <!-- CADPA 适龄提示 - 放在标题下方 -->
      <div class="splash-cadpa">
        <div class="cadpa-age">8+</div>
        <div class="cadpa-line"></div>
        <div class="cadpa-text">
          <div>CADPA</div>
          <div>适龄提示</div>
        </div>
      </div>

      <!-- 健康游戏忠告 - 放在中间区域 -->
      <div class="splash-health-advice">
        <div class="advice-title">【健康游戏忠告】</div>
        <div class="advice-content">
          <div>抵制不良游戏，拒绝盗版游戏</div>
          <div>注意自我保护，谨防受骗上当</div>
          <div>适度游戏益脑，沉迷游戏伤身</div>
          <div>合理安排时间，享受健康生活</div>
        </div>
      </div>
    </div>

    <!-- 底部进度条组 -->
    <div class="splash-bottom-area">

      <!-- 网络加载提示 - 移到进度条上方 -->
      <div class="splash-network-warning" v-if="!splashReady">{{ t('home.splash_loading') }}</div>

      <!-- 带有行走动画螃蟹的进度容器 -->
      <div class="splash-progress-wrapper">

        <!-- 跑动的螃蟹与特效（位置根据进度动态变化） -->
        <div class="splash-runner" :style="{left: splashProgress + '%'}">
          <div class="dust-particle d1"></div>
          <div class="dust-particle d2"></div>
          <div class="dust-particle d3"></div>
          <div class="runner-anim">
            <img class="runner-frame-1" :src="IMG.crab_walk_1" style="object-fit:contain" />
            <img class="runner-frame-2" :src="IMG.crab_walk_2" style="object-fit:contain" />
          </div>
        </div>

        <!-- 背景 -->
        <div class="splash-progress-track">
          <!-- 填充黄条 -->
          <div class="splash-progress-fill" :style="{width: splashProgress + '%'}"></div>
          <!-- 百分比文字叠加在最上层居中 -->
          <div class="splash-progress-text">{{splashProgress}}%</div>
        </div>

      </div>

      <!-- 加载完成：点击进入按钮 -->
      <button class="splash-enter-btn" v-if="splashReady" @click="enterGame">
        {{ t('home.splash_enter') }}
      </button>

    </div>

  </div>



  <!-- 背景装饰 -->
  <div class="bg-bubbles">
    <div class="bubble bubble-1"></div>
    <div class="bubble bubble-2"></div>
    <div class="bubble bubble-3"></div>
    <div class="bubble bubble-4"></div>
    <div class="bubble bubble-5"></div>
  </div>



  <!-- 主内容 -->
  <div class="content">

    <!-- 资产栏 -->
    <div class="asset-bar">

      <div class="gear-btn" @click="onOpenSettings">
        <img class="gear-icon pencil-icon" :src="IMG.gear" style="object-fit:contain" />
      </div>

      <div class="asset-item" @click="onBuyCoins">
        <img class="asset-icon" :src="IMG.coin" style="object-fit:contain" />
        <span class="asset-value">{{coins}}</span>
        <div class="asset-plus">+</div>
      </div>

      <div class="asset-item" @click="onBuyShells">
        <img class="asset-icon" :src="IMG.shell" style="object-fit:contain" />
        <span v-if="isInfinitePlay" class="infinite-energy-value"><strong>∞</strong><span>{{infiniteTimeDisplay}}</span></span>
        <span v-else class="asset-value">{{shellsDisplay}}</span>
        <div class="bonus-badge" v-if="bonusShells > 0">{{bonusShells}}</div>
        <div class="asset-plus">+</div>
      </div>

    </div>



    <!-- Logo 区域（静态螃蟹 + 标题） -->
    <div class="logo-area">
      <img class="logo-crab-static" :src="IMG.crab" style="object-fit:contain" />
      <div class="logo-title">{{ t('home.game_title') }}</div>
      <div class="logo-subtitle"><span class="en-subtitle">Star Battle</span>{{ t('home.game_subtitle') }}</div>
    </div>



    <!-- 入口栏 -->
    <div class="entry-bar">

      <div class="entry-btn" @click="onOpenShop">
        <img class="entry-btn-img" :src="IMG.btn_skin" style="object-fit:cover" />
      </div>

      <div class="entry-btn" @click="onOpenMap">
        <img class="entry-btn-img" :src="IMG.btn_map" style="object-fit:cover" />
        <div class="red-dot" v-if="hasUnclaimedGift"></div>
      </div>

    </div>



    <!-- 模式卡片 -->
    <div class="mode-cards">

      <!-- 每日挑战 -->
      <div class="mode-card daily-card" @click="onDailyChallenge"
           :style="hasPlayedDaily ? 'padding:3.2vw 1.6vw; justify-content:space-around;' : ''">

        <template v-if="!hasPlayedDaily">

          <div class="card-crab-area">

            <template v-if="skinData.dailyAnimationType === 'walk'">
              <div class="animate-walk">
                <img class="walk-frame-1" :src="skinData.dailyImage" style="object-fit:contain" />
                <img class="walk-frame-2" :src="IMG.crab_walk_2" style="object-fit:contain" />
              </div>
            </template>

            <template v-else-if="skinData.dailyAnimationType === 'fly'">
              <div class="animate-fly animate-fly-horiz">
                <div class="animate-fly-bounce">
                  <img class="walk-frame-1" :src="skinData.dailyImage" style="object-fit:contain" />
                  <img class="walk-frame-2" :src="skinData.dailyImage2" style="object-fit:contain" />
                </div>
              </div>
            </template>

            <template v-else-if="skinData.dailyAnimationType === 'swim'">
              <div class="animate-swim animate-swim-horiz">
                <div class="animate-swim-bounce">
                  <img class="swim-frame-squat" :src="skinData.dailyImage" style="object-fit:contain" />
                  <img class="swim-frame-fly" :src="skinData.dailyImage2" style="object-fit:contain" />
                </div>
              </div>
            </template>

            <template v-else-if="skinData.dailyAnimationType === 'stumble'">
              <div class="animate-stumble">
                <img class="stumble-frame-walk" :src="skinData.dailyImage" style="object-fit:contain" />
                <img class="stumble-frame-fall" :src="skinData.dailyImage2" style="object-fit:contain" />
              </div>
            </template>

            <template v-else-if="skinData.dailyAnimationType === 'soar-flap'">
              <div class="animate-soar">
                <div class="soar-wave">
                  <img class="soar-frame-up" :src="skinData.dailyImage" style="object-fit:contain" />
                  <img class="soar-frame-down" :src="skinData.dailyImage2" style="object-fit:contain" />
                </div>
              </div>
            </template>

            <template v-else-if="skinData.dailyAnimationType === 'hop'">
              <div class="animate-hop">
                <div class="hop-bounce">
                  <img class="hop-frame-squat" :src="skinData.dailyImage" style="object-fit:contain" />
                  <img class="hop-frame-jump" :src="skinData.dailyImage2" style="object-fit:contain" />
                </div>
              </div>
            </template>

            <template v-else-if="skinData.dailyAnimationType === 'chirp'">
              <div class="animate-chirp">
                <div class="chirp-sway">
                  <img class="chirp-frame-closed" :src="skinData.dailyImage" style="object-fit:contain" />
                  <img class="chirp-frame-open" :src="skinData.dailyImage2" style="object-fit:contain" />
                </div>
              </div>
            </template>

            <template v-else>
              <img class="animate-roll" :src="skinData.dailyImage" style="object-fit:contain" />
            </template>

          </div>

          <span class="card-tag">{{ t('home.daily_same_level') }}</span>

          <div class="card-btn daily-btn">
            <img v-if="dailyNeedAd" :src="IMG.ad_icon_clean" class="btn-ad-icon-corner" style="object-fit:contain" />
            <span class="card-btn-text">{{ t('home.daily_start') }}</span>
            <span v-if="!dailyNeedAd" class="card-btn-sub">{{ t('home.daily_free') }}</span>
            <span v-else class="card-btn-sub">{{ t('home.watch_ad_continue') }}</span>
          </div>

          <span class="card-timer">{{ t('home.daily_time_remaining', {dailyTimer: dailyTimer}) }}</span>

        </template>

        <template v-else>

          <!-- 007 复刻面板 -->
          <div class="c007-win-panel">

            <!-- 标题 -->
            <img :src="skinData.icon" class="c007-skin-icon" style="object-fit:contain" />

            <div class="c007-title-row">
              <span class="c007-title">{{ t('home.daily_success') }}</span>
            </div>

            <!-- 耗时 -->
            <div class="c007-time-row">
              <span style="font-size: 4.533vw; margin-right: 1.067vw;">⏱️</span>
              <span class="c007-time-val">{{dailyChallengeTime}}</span>
            </div>

            <!-- 排名 -->
            <div class="c007-rank-row">
              <span style="font-size: 3.467vw; margin-right: 0.8vw;"></span>
              <span class="c007-rank-label">{{ t('home.daily_beat') }}</span>
              <span class="c007-rank-hl">{{dailyChallengeRank}}%</span>
              <span class="c007-rank-label">{{ t('home.daily_players') }}</span>
            </div>

            <!-- 连胜 -->
            <div class="c007-streak-row">
              <div class="c007-laurel-l">❦</div>
              <div class="c007-streak-center">
                <span class="c007-streak-label">{{ t('home.daily_streak') }}</span>
                <span class="c007-streak-hl">{{dailyConsecutiveDays}}</span>
                <span class="c007-streak-label">{{ t('home.daily_days') }}</span>
              </div>
              <div class="c007-laurel-r">❦</div>
            </div>

          </div>

        </template>

      </div>



      <!-- 生存模式 -->
      <div class="mode-card survival-card" @click="onSurvivalMode">

        <img :class="'card-crab-duel-bg skin-survival-' + currentSkin" :src="skinData.survivalImage" style="object-fit:cover" />

        <div class="card-btn survival-btn">
          <img v-if="survivalFreeRemain <= 0" :src="IMG.ad_icon_clean" class="btn-ad-icon-corner" style="object-fit:contain" />
          <span class="card-btn-text">{{ t('home.survival_mode') }}</span>
          <template v-if="survivalFreeRemain > 0">
            <span class="card-btn-sub">{{ t('home.survival_free', {survivalFreeRemain: survivalFreeRemain}) }}</span>
          </template>
          <template v-else>
            <span class="card-btn-sub">{{ t('home.watch_ad_continue') }}</span>
          </template>
        </div>

      </div>

    </div>



    <!-- 开始游戏主按钮 -->
    <button class="btn-start" @click="onStartGame">
      <span class="btn-text" v-if="!tutorialDone">{{ t('home.start_game') }}</span>
      <span class="btn-text" v-else>{{ t('home.level_number', {currentLevel: currentLevel}) }}</span>
    </button>



    <!-- 每日打卡入口 -->
    <div class="checkin-entry-btn" @click="onOpenCheckIn">
      <div style="display:flex; align-items:center; justify-content:center; gap:1.067vw;">
        <img class="pencil-icon" :src="IMG.calendar" style="width:4.8vw; height:4.8vw;" />
        <span class="checkin-entry-text">{{ t('home.daily_checkin') }}</span>
      </div>
      <div class="red-dot" v-if="!hasCheckedInToday"></div>
    </div>



    <!-- 底部 -->
    <div class="footer">
      <span class="footer-text">{{ t('home.footer_find', {skinName: t(skinData.nameKey)}) }}</span>
      <img :src="skinData.icon" class="footer-icon" style="object-fit:contain" />
    </div>

  </div>



  <!-- 金币兑换贝壳弹窗 -->
  <div class="modal-overlay" v-if="showShellExchange" @click="onCloseShellExchange">

    <div class="exchange-card" @click.stop="preventBubble">

      <span class="exchange-title">{{ t('home.exchange_title') }}</span>

      <div class="exchange-rate">
        <img class="exchange-icon" :src="IMG.coin" style="object-fit:contain" />
        <span class="exchange-text">20 = </span>
        <img class="exchange-icon" :src="IMG.shell" style="object-fit:contain" />
        <span class="exchange-text">1</span>
      </div>

      <div class="exchange-row">
        <span class="exchange-label">{{ t('home.exchange_quantity') }}</span>
        <div class="exchange-stepper">
          <div class="stepper-btn" @click="onShellMinus">-</div>
          <span class="stepper-value">{{exchangeCount}}</span>
          <div class="stepper-btn" @click="onShellPlus">+</div>
        </div>
      </div>

      <span class="exchange-cost">{{ t('home.exchange_cost', {cost: exchangeCount * 20}) }}</span>

      <div class="exchange-btn" @click="onConfirmExchange">{{ t('home.exchange_confirm') }}</div>

    </div>

  </div>



  <!-- 赚金币弹窗 -->
  <div class="modal-overlay" v-if="showCoinAd" @click="onCloseCoinAd">

    <div class="exchange-card recharge-card" @click.stop="preventBubble">

      <span class="exchange-title">{{ t('home.earn_coins') }}</span>

      <div class="coin-ad-banner">
        <div class="coin-ad-icons">
          <img :src="IMG.coin" class="coin-ad-coin-icon" style="object-fit:contain" />
          <span class="coin-ad-amount">+30</span>
        </div>
        <span class="coin-ad-desc">{{ t('home.earn_coins_desc') }}</span>
      </div>

      <div class="coin-ad-btn-wrapper">
        <button class="coin-ad-btn pulse-wrapper" @click="onWatchCoinAd" :disabled="coinAdRemain <= 0">
          <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner pulse-corner" style="object-fit:contain" />
          <span>{{coinAdRemain > 0 ? t('home.watch_ad_earn') : t('home.daily_limit')}}</span>
        </button>
      </div>

      <span class="coin-ad-footer">{{ t('home.coin_ad_remaining', {remain: coinAdRemain}) }}</span>

    </div>

  </div>



  <!-- 每日打卡全屏页 -->
  <div class="checkin-fullpage" v-if="showCheckIn">

    <!-- 顶部返回按钮 -->
    <div class="checkin-back-btn" @click="onCloseCheckIn">
      <span class="checkin-back-arrow">←</span>
      <span class="checkin-back-text">{{ t('common.back') }}</span>
    </div>

    <!-- 标题区域 -->
    <div class="checkin-header">
      <div style="display:flex;align-items:center;justify-content:center;gap:1.6vw;margin-bottom:1.067vw;">
        <img :src="IMG.calendar_2" style="width:7.467vw;height:7.467vw;" />
        <span class="checkin-title" style="margin:0;">{{ t('home.daily_checkin') }}</span>
      </div>
      <span class="checkin-sub">{{ t('home.checkin_subtitle') }}</span>
    </div>

    <!-- 打卡网格 -->
    <div class="checkin-grid">
      <div class="checkin-day"
           :class="[ciItem.status, index === 6 ? 'day-7' : '']"
           v-for="(ciItem, index) in checkInList" :key="ciItem.day">

        <div class="checkin-day-num">{{ t('home.checkin_day', {day: ciItem.day}) }}</div>

        <div class="checkin-rewards">
          <div class="checkin-reward-item" v-for="(rew, rIdx) in ciItem.rewards" :key="rIdx">
            <img class="checkin-icon" :src="rew.img" style="object-fit:contain" v-if="rew.img" />
            <div class="checkin-icon-text" v-else>{{rew.iconText}}</div>
            <span class="checkin-count" v-if="rew.text">{{rew.text}}</span>
          </div>
        </div>

        <!-- 已领取遮罩 -->
        <div class="checkin-mask mask-claimed" v-if="ciItem.status === 'claimed'">
          <img class="checkin-mask-icon pencil-icon" :src="IMG.check" style="object-fit:contain" />
        </div>

      </div>
    </div>

    <!-- 领取按钮 -->
    <button class="checkin-btn" :class="hasCheckedInToday ? 'btn-disabled' : 'btn-active'" @click="onClaimCheckIn">
      <span>{{hasCheckedInToday ? t('home.checkin_done') : t('home.checkin_claim')}}</span>
    </button>

  </div>



  <!-- ========== 免费体力恢复弹窗 ========== -->
  <div class="stamina-modal-overlay" v-if="showStaminaModal" @click="onCloseStaminaModal">

    <div class="stamina-m-card animate-fadeIn" @click.stop="preventBubble">

      <span class="stamina-m-title">{{ t('home.stamina_title') }}</span>
      <span class="stamina-m-sub">{{ t('home.stamina_subtitle') }}</span>

      <div class="stamina-m-banner">
        <div class="stamina-m-icons">
          <img :src="IMG.shell" class="stamina-m-shell" style="object-fit:contain" />
          <span class="stamina-m-val">+1</span>
        </div>
        <span class="stamina-m-hint">{{ t('home.stamina_hint') }}</span>
      </div>

      <button class="stamina-btn-ad pulse-wrapper" @click="onWatchStaminaAd">
        <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner pulse-corner" style="object-fit:contain" />
        <div class="s-btn-inner">
          <span>{{ t('home.stamina_4x') }}</span>
        </div>
      </button>

      <button class="stamina-btn-share" @click="onShareStamina">
        <div class="s-btn-inner">
          <div class="svg-share-icon"></div>
          <span>{{ t('home.stamina_share') }}</span>
        </div>
      </button>

      <span class="stamina-m-footer">{{ t('home.stamina_uses', {count: staminaAdCount || 0}) }}</span>

    </div>

  </div>



  <!-- ========== 设置弹窗 ========== -->
  <div class="modal-overlay" v-if="showSettings" @click="onCloseSettings">

    <div class="settings-card" @click.stop="preventBubble">

      <span class="settings-title">{{ t('home.settings_title') }}</span>

      <div class="settings-item">
        <img :src="IMG.music" class="settings-icon pencil-icon" style="object-fit:contain" />
        <span class="settings-label">{{ t('home.settings_music') }}</span>
        <input type="checkbox" class="switch-input" :checked="musicOn" @change="onToggleMusic" />
      </div>

      <div class="settings-item">
        <img :src="IMG.sound" class="settings-icon pencil-icon" style="object-fit:contain" />
        <span class="settings-label">{{ t('home.settings_sound') }}</span>
        <input type="checkbox" class="switch-input" :checked="soundOn" @change="onToggleSound" />
      </div>

      <div class="settings-item">
        <img :src="IMG.vibrate" class="settings-icon pencil-icon" style="object-fit:contain" />
        <span class="settings-label">{{ t('home.settings_vibration') }}</span>
        <input type="checkbox" class="switch-input" :checked="vibrateOn" @change="onToggleVibrate" />
      </div>

      <div class="settings-item">
        <span class="settings-label">{{ t('home.settings_version') }}</span>
        <span class="settings-version-text">1.1.2</span>
      </div>

      <div class="settings-back-btn" @click="onCloseSettings">
        <span class="settings-back-text">{{ t('common.back') }}</span>
      </div>

    </div>

  </div>



  <!-- ========== 奖励获得动画浮层 ========== -->
  <div class="reward-anim-overlay" v-if="showRewardAnim">

    <!-- 中心弹出图标 -->
    <div class="reward-anim-center">
      <div class="reward-anim-icons">
        <img class="reward-anim-icon" v-for="(ic, idx) in rewardAnimIcons" :key="idx" :src="ic" style="object-fit:contain" />
      </div>
      <span class="reward-anim-text">{{rewardAnimText}}</span>
    </div>

    <!-- 飞行粒子 -->
    <div class="reward-particles">
      <img v-for="p in rewardAnimParticles" :key="p.id"
           :class="'reward-particle rp-' + p.id"
           :style="{animationDelay: p.delay + 's'}"
           :src="rewardAnimIcon" style="object-fit:contain" />
    </div>

  </div>

</div>
  `,

  data() {
    return {
      // 图片资源常量引用
      IMG: IMG,

      // 启动页（加载屏）— 仅首次显示
      isSplashLoading: !window._splashDone,
      splashProgress: 0.0,
      splashReady: false,

      currentLevel: 1,
      shells: 6,
      coins: 0,
      shellsDisplay: t('home.stamina_full'),
      isInfinitePlay: false,
      infiniteTimeDisplay: '00:00',
      bonusShells: 0,
      dailyTimer: '23:59:59',
      tutorialDone: false,

      // 金币兑换贝壳弹窗
      showShellExchange: false,
      exchangeCount: 1,

      // 广告赚金币弹窗
      showCoinAd: false,
      coinAdRemain: 5,

      // 打卡弹窗
      showCheckIn: false,
      checkInList: [],
      hasCheckedInToday: false,

      // 设置弹窗
      showSettings: false,
      musicOn: true,
      soundOn: true,
      vibrateOn: true,

      // 奖励浮层动画
      showRewardAnim: false,
      rewardAnimIcon: '',
      rewardAnimIcons: [],
      rewardAnimText: '',
      rewardAnimParticles: [],

      // 每日挑战相关
      hasPlayedDaily: false,
      dailyNeedAd: false,
      dailyChallengeTime: '00:00',
      dailyChallengeRank: '99.9',
      dailyConsecutiveDays: 1,

      // 生存模式
      survivalFreeRemain: 2,

      // 地图红点
      hasUnclaimedGift: false,

      // 体力弹窗
      showStaminaModal: false,
      staminaAdCount: 0,
    };
  },

  computed: {
    // 当前皮肤数据（响应式）
    skinData() {
      const skinId = appState.currentSkin || 'crab';
      return appState.skins[skinId] || {};
    },
    currentSkin() {
      return appState.currentSkin || 'crab';
    }
  },

  mounted() {
    // 如果已经完成过启动画面，跳过
    if (window._splashDone) {
      this.isSplashLoading = false;
      this.splashProgress = 100;
      this.onPageShow();
      return;
    }

    // 模拟启动加载过程
    let currentProgress = 0;
    const totalTime = 500; // 总时间 0.5 秒（开发调试用，生产环境可改回 2200）
    const intervalTime = 30; // 刷新频率
    const step = 100 / (totalTime / intervalTime);

    this.splashTimer = setInterval(() => {
      currentProgress += step + (Math.random() * 2 - 0.5);

      // 允许用户在进度达到 30% 后就可以点击进入
      if (currentProgress >= 30 && !this.splashReady) {
        this.splashReady = true;
      }

      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(this.splashTimer);
      }
      this.splashProgress = currentProgress.toFixed(1);
    }, intervalTime);

    // 首次显示页面
    this.onPageShow();
  },

  beforeUnmount() {
    if (this.UI_TIMER) clearInterval(this.UI_TIMER);
    if (this.splashTimer) clearInterval(this.splashTimer);
    if (this._rewardAnimTimer) clearTimeout(this._rewardAnimTimer);
  },

  methods: {

    // ========== 点击进入游戏 ==========
    enterGame() {
      // 启动页只负责进入应用，不触发浏览器全屏，避免阻塞移动端预览器。
      this.isSplashLoading = false;
      window._splashDone = true;
      this.$nextTick(() => {
        this._checkReturnGift(getLocalToday());
      });
    },

    // ========== 页面显示（替代小程序 onShow） ==========
    onPageShow() {

      const today = getLocalToday();
      const hasPlayedDaily = (localStorage.getItem('dailyChallengeLastWin') === today);
      const dailyFreeUsed = localStorage.getItem('dailyChallengeFreeUsed_' + today) === 'true';
      const dailyNeedAd = !hasPlayedDaily && dailyFreeUsed;
      const hasCheckedInToday = (appState.lastCheckInDate === today);

      // 生存模式免费次数计算
      let survivalUsed = 0;
      if (appState.survivalPlayedDate === today) {
        survivalUsed = appState.survivalPlayedCount || 0;
      }
      const survivalFreeRemain = Math.max(0, 2 - survivalUsed);

      // 岛屿满星礼盒红点：检查是否有可领取的礼盒
      const levelStars = appState.levelStars || {};
      const claimedGifts = appState.claimedGifts || [];
      const LPI = 20; // 每岛关卡数
      const ISLAND_COUNT = Math.max(100, Math.ceil(appState.currentLevel / LPI));
      let hasUnclaimedGift = false;
      for (let i = 0; i < ISLAND_COUNT; i++) {
        const start = i * LPI + 1;
        // 该岛必须已解锁
        if (appState.currentLevel < start) continue;
        // 检查是否全满星
        let allPerfect = true;
        for (let lv = start; lv < start + LPI; lv++) {
          if ((levelStars[lv] || 0) < 3) { allPerfect = false; break; }
        }
        if (allPerfect && !claimedGifts.includes(i + 1)) {
          hasUnclaimedGift = true;
          break;
        }
      }

      const dailyChallengeTime = localStorage.getItem('dailyChallengeTime') || '00:00';
      const dailyChallengeRank = localStorage.getItem('dailyChallengeRank') || '99.9';
      const dailyConsecutiveDays = parseInt(localStorage.getItem('dailyConsecutiveDays')) || 1;

      // 金币广告次数
      const coinAdCount = parseInt(localStorage.getItem('coinAdCount_' + today)) || 0;
      const coinAdRemain = Math.max(0, 5 - coinAdCount);

      // 更新页面数据
      this.currentLevel = appState.currentLevel;
      this.tutorialDone = appState.tutorialDone;
      this.shells = appState.shells;
      this.coins = appState.coins;
      this.hasPlayedDaily = hasPlayedDaily;
      this.dailyNeedAd = dailyNeedAd;
      this.hasCheckedInToday = hasCheckedInToday;
      this.survivalFreeRemain = survivalFreeRemain;
      this.hasUnclaimedGift = hasUnclaimedGift;
      this.dailyChallengeTime = dailyChallengeTime;
      this.dailyChallengeRank = dailyChallengeRank;
      this.dailyConsecutiveDays = dailyConsecutiveDays;
      this.coinAdRemain = coinAdRemain;

      // 开启秒级监听器
      this.updateUIState();
      if (this.UI_TIMER) clearInterval(this.UI_TIMER);
      this.UI_TIMER = setInterval(() => {
        this.updateUIState();
      }, 1000);
      // 已进入过应用时没有启动页，直接检查回归礼包。
      if (!this.isSplashLoading) {
        this._checkReturnGift(today);
      }

      // 播放菜单 BGM
      AudioManager.playBGM('menu');

      // 同步设置开关状态
      this.musicOn = AudioManager.musicOn;
      this.soundOn = AudioManager.soundOn;
      const vibrateStored = localStorage.getItem('audioVibrateOn');
      this.vibrateOn = vibrateStored === null ? true : vibrateStored === 'true';
      appState.vibrateOn = this.vibrateOn;
    },

    // 页面隐藏（替代小程序 onHide）
    onPageHide() {
      if (this.UI_TIMER) clearInterval(this.UI_TIMER);
    },

    // ========== 回归礼包：至少3天未登录 ==========
    _checkReturnGift(today) {
      const lastLogin = appState.lastLoginDate || '';
      const daysSinceLogin = lastLogin ? Math.floor((new Date(today) - new Date(lastLogin)) / 86400000) : 0;

      if (lastLogin && daysSinceLogin >= 3) {
        Modal.show({
          title: t('home.welcome_title'),
          content: t('home.welcome_content'),
          showCancel: false,
          cancelOnMask: false,
        }).then(res => {
          if (!res.confirm) return;

          appState.hintCount = (appState.hintCount || 0) + 5;
          appState.placeOneCount = (appState.placeOneCount || 0) + 2;
          appState.lastLoginDate = today;
          saveGameData();

          this._playRewardAnim(IMG.hint, t('home.reward_hint_x5'), 'coin', 4);
          setTimeout(() => {
            this._playRewardAnim(this.skinData.icon, t('home.reward_place_x2'), 'coin', 4);
          }, 1600);
        });
      } else {
        appState.lastLoginDate = today;
        saveGameData();
      }
    },

    // 定时更新 UI (计时器/显示逻辑)
    updateUIState() {
      const shells = appState.shells;
      const maxShells = appState.maxShells;
      const nowDt = new Date();
      const now = nowDt.getTime();
      const endTime = appState.infinitePlayEndTime || 0;
      const isInfinitePlay = endTime && endTime > now;

      let shellsDisplay = '';
      let infiniteTimeDisplay = '00:00';
      if (isInfinitePlay) {
        const remainMs = endTime - now;
        const remainSec = Math.ceil(remainMs / 1000);
        const m = Math.floor(remainSec / 60);
        const s = remainSec % 60;
        infiniteTimeDisplay = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      } else if (shells >= maxShells) {
        shellsDisplay = t('home.stamina_display', {cur: maxShells, max: maxShells});
      } else {
        const remain = getShellRecoveryRemaining();
        shellsDisplay = `${shells}/${maxShells} ${remain}s`;
      }

      // 每日挑战倒计时 (距离本地午夜 0:00)
      const tomorrow = new Date(nowDt.getFullYear(), nowDt.getMonth(), nowDt.getDate() + 1);
      const msUntilMidnight = tomorrow.getTime() - now;
      const secUntilMidnight = Math.floor(msUntilMidnight / 1000);
      const h = Math.floor(secUntilMidnight / 3600).toString().padStart(2, '0');
      const min = Math.floor((secUntilMidnight % 3600) / 60).toString().padStart(2, '0');
      const sec = Math.floor(secUntilMidnight % 60).toString().padStart(2, '0');
      const dailyTimer = `${h}:${min}:${sec}`;

      // 实时检测日期跨越
      const todayStr = getLocalToday();
      const hasPlayedDaily = (localStorage.getItem('dailyChallengeLastWin') === todayStr);

      if (this.shellsDisplay !== shellsDisplay) {
        this.shellsDisplay = shellsDisplay;
      }
      this.isInfinitePlay = !!isInfinitePlay;
      this.infiniteTimeDisplay = infiniteTimeDisplay;
      this.bonusShells = appState.bonusShells || 0;
      if (this.dailyTimer !== dailyTimer) {
        this.dailyTimer = dailyTimer;
      }
      if (this.hasPlayedDaily !== hasPlayedDaily) {
        this.hasPlayedDaily = hasPlayedDaily;
        this.dailyNeedAd = !hasPlayedDaily && (localStorage.getItem('dailyChallengeFreeUsed_' + todayStr) === 'true');
        const survivalUsed = (appState.survivalPlayedDate === todayStr) ? (appState.survivalPlayedCount || 0) : 0;
        this.survivalFreeRemain = Math.max(0, 2 - survivalUsed);
        this.hasCheckedInToday = (appState.lastCheckInDate === todayStr);
      }
    },

    // ========== 开始游戏 ==========
    onStartGame() {
      console.log('🔥 onStartGame 被调用了！');
      console.log('🔥 Vue 实例:', this);
      console.log('🔥 Router 对象:', window.Router);
      AudioManager.playSFX('click');
      const now = Date.now();
      const isInfinitePlay = appState.infinitePlayEndTime && appState.infinitePlayEndTime > now;

      let targetLevel = appState.currentLevel;
      if (!appState.tutorialDone) {
        targetLevel = 0;
      }

      if (targetLevel !== 0 && appState.shells <= 0 && (appState.bonusShells || 0) <= 0 && !isInfinitePlay) {
        this.showStaminaModal = true;
        this.staminaAdCount = parseInt(localStorage.getItem('staminaAdCount_' + getLocalToday())) || 0;
        return;
      }

      Router.navigateTo('game', { level: targetLevel });
    },

    // ========== 体力不足弹窗控制 ==========
    onCloseStaminaModal() {
      this.showStaminaModal = false;
    },

    onWatchStaminaAd() {
      const today = getLocalToday();
      const key = 'staminaAdCount_' + today;
      let count = parseInt(localStorage.getItem(key)) || 0;
      if (count >= 3) {
        Toast.show(t('home.daily_limit'));
        return;
      }
      AdManager.showAd('stamina_recover', () => {
        count++;
        localStorage.setItem(key, String(count));
        appState.shells += 4; // 四倍获得 (+4)
        saveGameData();
        this.shells = appState.shells;
        this.showStaminaModal = false;
        this.staminaAdCount = count;
        this._playRewardAnim(IMG.shell, t('home.stamina_plus4'), 'coin', 4);
      });
    },

    onShareStamina() {
      ShareManager.share({
        title: t('home.share_title'),
        text: t('home.share_text'),
      }, () => {
        // 分享成功回调（接入4399 SDK后启用奖励发放）
        const today = getLocalToday();
        const key = 'staminaAdCount_' + today;
        let count = parseInt(localStorage.getItem(key)) || 0;
        if (count >= 3) return;
        count++;
        localStorage.setItem(key, String(count));
        appState.shells += 1;
        saveGameData();
        this.shells = appState.shells;
        this.showStaminaModal = false;
        this.staminaAdCount = count;
        this._playRewardAnim(IMG.shell, t('home.stamina_plus1'), 'coin', 1);
      });
    },

    // ========== 入口按钮 ==========

    onOpenShop() {
      AudioManager.playSFX('click');
      Router.navigateTo('shop');
    },

    onOpenMap() {
      AudioManager.playSFX('click');
      Router.navigateTo('map');
    },

    onDailyChallenge() {
      AudioManager.playSFX('click');
      if (this.hasPlayedDaily) {
        // 已通关，成绩面板展示中，不做任何操作
        return;
      } else if (this.dailyNeedAd) {
        AdManager.showAd('daily_entry', () => {
          Router.navigateTo('game', { mode: 'daily' });
        });
      } else {
        const today = getLocalToday();
        appState.dailyPlayedDate = today;
        localStorage.setItem('dailyChallengeFreeUsed_' + today, 'true');
        saveGameData();
        this.dailyNeedAd = true;
        Router.navigateTo('game', { mode: 'daily' });
      }
    },

    onSurvivalMode() {
      AudioManager.playSFX('click');
      const today = getLocalToday();
      let survivalUsed = 0;
      if (appState.survivalPlayedDate === today) {
        survivalUsed = appState.survivalPlayedCount || 0;
      }

      if (survivalUsed >= 2) {
        AdManager.showAd('survival_entry', () => {
          Router.navigateTo('game', { mode: 'survival' });
        });
      } else {
        appState.survivalPlayedDate = today;
        appState.survivalPlayedCount = survivalUsed + 1;
        saveGameData();
        this.survivalFreeRemain = Math.max(0, 2 - survivalUsed - 1);
        Router.navigateTo('game', { mode: 'survival' });
      }
    },

    onBuyCoins() {
      this.showCoinAd = true;
    },

    onCloseCoinAd() {
      this.showCoinAd = false;
    },

    onWatchCoinAd() {
      const today = getLocalToday();
      const key = 'coinAdCount_' + today;
      let count = parseInt(localStorage.getItem(key)) || 0;

      if (count >= 5) {
        Toast.show(t('home.daily_limit'));
        return;
      }

      AdManager.showAd('coin_earn', () => {
        count++;
        localStorage.setItem(key, String(count));

        appState.coins += 30;
        saveGameData();

        this.coins = appState.coins;
        this.coinAdRemain = Math.max(0, 5 - count);
        this.showCoinAd = false;

        this._playRewardAnim(IMG.coin, t('home.coins_30'), 'coin', 6);
      });
    },

    onBuyShells() {
      const isInfinite = appState.infinitePlayEndTime && appState.infinitePlayEndTime > Date.now();
      if (isInfinite) {
        Toast.show(t('home.infinite_active'));
        return;
      }
      if (appState.shells >= appState.maxShells) {
        Toast.show(t('home.shells_full'));
        return;
      }
      if (appState.coins < 20) {
        Toast.show(t('home.coins_insufficient'));
        return;
      }
      this.showShellExchange = true;
      this.exchangeCount = 1;
    },

    onCloseShellExchange() {
      this.showShellExchange = false;
    },

    onShellMinus() {
      if (this.exchangeCount > 1) {
        this.exchangeCount--;
      }
    },

    onShellPlus() {
      const maxBuy = Math.floor(appState.coins / 20);
      const maxExt = appState.maxShells - appState.shells;
      const limit = Math.min(maxBuy, Math.max(maxExt, 1), 8);
      if (this.exchangeCount < limit) {
        this.exchangeCount++;
      }
    },

    onConfirmExchange() {
      const count = this.exchangeCount;
      const cost = count * 20;

      if (appState.coins < cost) {
        Toast.show(t('home.coins_insufficient'));
        return;
      }

      if (appState.shells >= appState.maxShells) {
        Toast.show(t('home.shells_full'));
        return;
      }

      appState.coins -= cost;
      appState.shells = Math.min(appState.shells + count, appState.maxShells);
      saveGameData();

      this.coins = appState.coins;
      this.shells = appState.shells;
      this.showShellExchange = false;

      this.updateUIState();
      this._playRewardAnim(IMG.shell, t('home.reward_shells', {count: count}), 'coin', count);
    },

    onOpenCheckIn() {
      AudioManager.playSFX('click');
      const count = appState.checkInCount || 1;
      const today = getLocalToday();
      const hasCheckedInToday = (appState.lastCheckInDate === today);

      const checkInList = [
        { day: 1, rewards: [{ img: IMG.shell, text: 'x1' }] },
        { day: 2, rewards: [{ img: this.skinData.icon, text: t('home.checkin_place_x1') }] },
        { day: 3, rewards: [{ img: IMG.hint, text: 'x1' }] },
        { day: 4, rewards: [{ img: IMG.shell, text: 'x2' }, { img: IMG.hint, text: 'x1' }] },
        { day: 5, rewards: [{ img: IMG.infinite, text: t('home.checkin_infinite_30m') }] },
        { day: 6, rewards: [{ img: IMG.shell, text: 'x2' }, { img: this.skinData.icon, text: 'x1' }, { img: IMG.hint, text: 'x1' }] },
        { day: 7, rewards: [{ img: IMG.infinite, text: t('home.checkin_infinite_1h') }] },
      ].map((item, index) => {
        let status = 'locked';
        if (index + 1 < count) status = 'claimed';
        else if (index + 1 === count) status = hasCheckedInToday ? 'current today-claimed' : 'current';
        return { ...item, status };
      });

      this.showCheckIn = true;
      this.checkInList = checkInList;
      this.hasCheckedInToday = hasCheckedInToday;
    },

    onCloseCheckIn() {
      this.showCheckIn = false;
    },

    onClaimCheckIn() {
      const today = getLocalToday();
      if (appState.lastCheckInDate === today) return;

      let count = appState.checkInCount || 1;
      const now = Date.now();
      let rewards = [];

      if (count === 1) {
        appState.bonusShells = (appState.bonusShells || 0) + 1;
        rewards = [{ icon: IMG.shell, msg: t('home.reward_shell_x1') }];
      } else if (count === 2) {
        appState.placeOneCount++;
        rewards = [{ icon: this.skinData.icon, msg: t('home.reward_place_x1') }];
      } else if (count === 3) {
        appState.hintCount++;
        rewards = [{ icon: IMG.hint, msg: t('home.reward_hint_x1') }];
      } else if (count === 4) {
        appState.bonusShells = (appState.bonusShells || 0) + 2;
        appState.hintCount++;
        rewards = [
          { icon: IMG.shell, msg: t('home.reward_shell_x2') },
          { icon: IMG.hint, msg: t('home.reward_hint_x1') }
        ];
      } else if (count === 5) {
        const baseTime = Math.max(now, appState.infinitePlayEndTime || 0);
        appState.infinitePlayEndTime = baseTime + 30 * 60 * 1000;
        rewards = [{ icon: IMG.infinite, msg: t('home.reward_infinite_30m') }];
      } else if (count === 6) {
        appState.bonusShells = (appState.bonusShells || 0) + 2;
        appState.placeOneCount++;
        appState.hintCount++;
        rewards = [
          { icon: IMG.shell, msg: t('home.reward_shell_x2') },
          { icon: this.skinData.icon, msg: t('home.reward_place_x1') },
          { icon: IMG.hint, msg: t('home.reward_hint_x1') }
        ];
      } else if (count === 7) {
        const baseTime = Math.max(now, appState.infinitePlayEndTime || 0);
        appState.infinitePlayEndTime = baseTime + 60 * 60 * 1000;
        rewards = [{ icon: IMG.infinite, msg: t('home.reward_infinite_1h') }];
      }

      appState.lastCheckInDate = today;
      appState.checkInCount = count >= 7 ? 1 : count + 1;
      saveGameData();

      this.onCloseCheckIn();

      // 依次弹出每个奖励，间隔 1.6 秒，每个都响一声
      rewards.forEach((r, i) => {
        setTimeout(() => {
          this._playRewardAnim(r.icon, r.msg, 'coin', 4);
        }, i * 1600);
      });
      // 所有动画完成后刷新页面数据
      setTimeout(() => { this.onPageShow(); }, rewards.length * 1600 + 500);
    },



    preventBubble() {},

    // ========== 设置弹窗 ==========

    onOpenSettings() {
      AudioManager.playSFX('click');
      this.showSettings = true;
    },

    onCloseSettings() {
      this.showSettings = false;
    },

    onToggleMusic(e) {
      const on = e.target.checked;
      this.musicOn = on;
      AudioManager.setMusicOn(on);
      if (on) {
        AudioManager.playBGM('menu');
      }
    },

    onToggleSound(e) {
      const on = e.target.checked;
      this.soundOn = on;
      AudioManager.setSoundOn(on);
    },

    onToggleVibrate(e) {
      const on = e.target.checked;
      this.vibrateOn = on;
      appState.vibrateOn = on;
      localStorage.setItem('audioVibrateOn', String(on));
    },

    // ========== 统一奖励浮层动画 ==========

    /**
     * 播放奖励获得动画
     * @param {string} icon - 图标路径（金币/贝壳等）
     * @param {string} text - 显示文案，如 "+30 金币"
     * @param {string} sfx - 音效 key
     * @param {number} particleCount - 飞行粒子数量
     */
    _playRewardAnim(icon, text, sfx, particleCount) {
      const particles = Array.from({ length: Math.min(particleCount, 8) }, (_, i) => ({
        id: i,
        delay: (i * 0.08).toFixed(2),
      }));
      const icons = Array.isArray(icon) ? icon : [icon];

      // 先关闭，强制 Vue 重新渲染动画
      this.showRewardAnim = false;
      if (this._rewardAnimTimer) clearTimeout(this._rewardAnimTimer);

      this.$nextTick(() => {
        this.showRewardAnim = true;
        this.rewardAnimIcon = icons[0];
        this.rewardAnimIcons = icons;
        this.rewardAnimText = text;
        this.rewardAnimParticles = particles;

        if (sfx) {
          AudioManager.playSFX(sfx);
        }

        const vibrateStored = localStorage.getItem('audioVibrateOn');
        if (vibrateStored === null || vibrateStored === 'true') {
          vibrateShort();
        }

        this._rewardAnimTimer = setTimeout(() => {
          this.showRewardAnim = false;
        }, 1500);
      });
    },
  },
};
