/**
 * 地图页面 — Vue 3 组件
 * 从微信小程序 pages/map/map.wxml + map.js 转换而来
 */

// 岛屿礼盒沿用每日打卡的7天奖励循环，每次随机抽取其中一组。
const PRIZES = [
  [{ icon: 'shell', field: 'shells', value: 1, name: 'home.reward_shell_x1' }],
  [{ icon: 'skin', field: 'placeOneCount', value: 1, name: 'home.reward_place_x1' }],
  [{ icon: 'hint', field: 'hintCount', value: 1, name: 'home.reward_hint_x1' }],
  [
    { icon: 'shell', field: 'shells', value: 2, name: 'home.reward_shell_x2' },
    { icon: 'hint', field: 'hintCount', value: 1, name: 'home.reward_hint_x1' },
  ],
  [{ icon: 'infinite', field: null, value: 0, type: 'infinite30', name: 'home.reward_infinite_30m' }],
  [
    { icon: 'shell', field: 'shells', value: 2, name: 'home.reward_shell_x2' },
    { icon: 'skin', field: 'placeOneCount', value: 1, name: 'home.reward_place_x1' },
    { icon: 'hint', field: 'hintCount', value: 1, name: 'home.reward_hint_x1' },
  ],
  [{ icon: 'infinite', field: null, value: 0, type: 'infinite60', name: 'home.reward_infinite_1h' }],
];

// 节点坐标用百分比（相对于岛屿插画容器）
// 沿着岛屿上弯曲小路蜿蜒排列
const ISLAND_PATHS = {
  // 路径1：S形曲线（用户拖拽定位）
  1: [
    {x:21, y:87}, {x:36, y:84}, {x:50, y:81}, {x:64, y:78}, {x:76, y:73},
    {x:88, y:66}, {x:90, y:56}, {x:81, y:48}, {x:67, y:47}, {x:52, y:49},
    {x:35, y:50}, {x:20, y:49}, {x:9, y:41},  {x:8, y:31},  {x:16, y:22},
    {x:29, y:16}, {x:44, y:13}, {x:59, y:11}, {x:75, y:11}, {x:88, y:15},
  ],
  // 路径2：大弧钩形（用户拖拽定位）
  2: [
    {x:27, y:86}, {x:18, y:76}, {x:13, y:64}, {x:16, y:52}, {x:27, y:44},
    {x:43, y:42}, {x:54, y:50}, {x:57, y:60}, {x:66, y:69}, {x:82, y:70},
    {x:89, y:61}, {x:90, y:49}, {x:89, y:38}, {x:84, y:27}, {x:75, y:19},
    {x:61, y:13}, {x:46, y:12}, {x:30, y:16}, {x:20, y:24}, {x:10, y:36},
  ],
  // 第3岛：冰雪岛 - 蜗牛壳螺旋（均匀间距）
  3: [
    {x:50, y:92}, {x:35, y:88}, {x:20, y:82}, {x:12, y:72}, {x:10, y:60},
    {x:8, y:46},  {x:12, y:32}, {x:24, y:22}, {x:40, y:14}, {x:58, y:14},
    {x:72, y:18}, {x:82, y:28}, {x:86, y:40}, {x:82, y:54}, {x:74, y:64},
    {x:62, y:70}, {x:48, y:68}, {x:34, y:62}, {x:28, y:50}, {x:32, y:38},
  ],
};

const MapPage = {
  template: `
<div class="page scroll-view" ref="scrollView" @scroll="onMapScroll"
     @pointerdown="onMapPointerDown" @pointermove="onMapPointerMove"
     @pointerup="onMapPointerUp" @pointercancel="onMapPointerUp" @click="onMapClick">

  <!-- 顶栏 -->
  <div class="map-top-bar">
    <div class="map-back-btn" @click="onBack">
      <span class="back-arrow">‹</span>
    </div>
    <span class="map-title">{{ t('map.island_map') }}</span>
    <div style="width:8cqw"></div>
  </div>


  <!-- 岛屿列表 -->
  <div class="map-body">
    <div style="height: 80cqh;"></div>
    <template v-for="(item, index) in islands" :key="item.index">
      <div class="island-section" :id="'island-' + item.index" :ref="'island-' + item.index">

        <!-- 岛名牌（放在图片上方） -->
        <div class="island-tag">
          <div class="tag-red-dot" v-if="item.allPerfect && !item.giftClaimed"></div>
          <span class="tag-name">{{ t('map.island_number', {index: item.index}) }}</span>
          <span class="tag-range">{{ t('map.level_range', {start: item.startLevel, end: item.endLevel}) }}</span>
        </div>

        <!-- 岛屿插画 + 关卡叠加 -->
        <div :class="'island-card ' + (item.unlocked ? '' : 'card-locked') + ' theme-' + item.theme">
          <!-- 岛屿插画底图 -->
          <img :class="'island-bg' + (item.mirrored ? ' mirrored' : '')" :src="item.bgImage + '?v=17'" style="object-fit:contain;width:100%" />

          <!-- 关卡节点层 -->
          <div class="nodes-layer" v-if="item.unlocked">
            <!-- 路径小圆点 -->
            <div class="trail" v-for="(d, dIdx) in item.trails" :key="dIdx"
                  :style="{left: d.x + '%', top: d.y + '%'}"></div>

            <!-- 关卡节点 -->
            <div :class="'node n-' + node.status" v-for="(node, nIdx) in item.nodes" :key="node.level"
                  :style="{left: node.x + '%', top: node.y + '%'}"
                  @click="onTapLevel(node.level)">
              <span class="node-lbl" v-if="node.status !== 'locked'">{{node.level}}</span>
              <img class="node-lck pencil-icon" v-if="node.status === 'locked'" :src="IMG.lock" style="object-fit:contain" />
              <div class="node-stars" v-if="node.stars > 0">
                <span :class="'s ' + (si < node.stars ? 'on' : '')" v-for="si in [0,1,2]" :key="si">★</span>
              </div>
              <div class="node-ring" v-if="node.status === 'current'"></div>
            </div>
          </div>

          <!-- 未解锁 -->
          <div class="lock-overlay" v-if="!item.unlocked">
            <img class="lock-icon pencil-icon" :src="IMG.lock" style="object-fit:contain" />
            <span class="lock-msg">{{ t('map.unlock_by_level', {level: item.startLevel - 1}) }}</span>
          </div>
        </div>

        <!-- 礼盒进度条（图片下方） -->
        <div class="gift-strip" v-if="item.unlocked"
              @click="onOpenGift(item.index)">
          <img :class="'gs-icon pencil-icon ' + (item.allPerfect && !item.giftClaimed ? 'ready-to-claim' : '')"
               :src="item.giftClaimed ? IMG.box : IMG.gift" style="object-fit:contain" />
          <div class="gs-bar"><div class="gs-fill" :style="{width: (item.perfectCount/20*100) + '%'}"></div></div>
          <span class="gs-txt">{{item.giftClaimed ? t('map.gift_claimed') : item.perfectCount + '/20'}}</span>
        </div>
      </div>

      <!-- 海上航线 -->
      <div class="sea-lane" v-if="index < islands.length - 1">
        <span class="lane-wave">～</span>
        <div class="lane-mid"><span class="lane-wave">～</span><span class="lane-ship">🚢</span><span class="lane-wave">～</span></div>
        <span class="lane-wave">～</span>
      </div>
    </template>

    <div style="height: 55cqh;"></div>
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

  <!-- 抽奖弹窗 -->
  <div class="modal-bg" v-if="showLottery" @click="onCloseLottery">
    <div class="lottery-card" @click.stop="preventBubble">
      <div style="display:flex; align-items:center; gap:1.6cqw; margin-bottom: 1.07cqw;">
        <img :src="IMG.gift" style="width:6.4cqw;height:6.4cqw;object-fit:contain" />
        <span class="lc-title" style="margin:0;">{{ t('map.full_star_gift') }}</span>
      </div>
      <span class="lc-sub">{{ t('map.island_reward', {island: lotteryIsland}) }}</span>
      <div class="giftbox-zone">
        <!-- 未开箱/开箱中 -->
        <template v-if="lotteryState === 'box' || lotteryState === 'opening'">
          <div :class="'gb-box ' + (lotteryState === 'opening' ? 'shake-box' : '')">
            <img class="gb-icon" :src="IMG.gift" style="object-fit:contain" />
          </div>
          <button class="gb-btn" @click="onOpenBox" :disabled="lotteryState === 'opening'">
            <span>{{lotteryState === 'opening' ? t('map.opening') : t('map.open_gift')}}</span>
          </button>
        </template>

        <!-- 开箱结果 -->
        <template v-else-if="lotteryState === 'prize'">
          <!-- 全屏飘落大彩带 (慢速飘落 40 片) -->
          <div class="confetti-container">
            <div v-for="(cp, idx) in confettiPieces" :key="'mc'+idx" class="confetti-piece" :style="cp"></div>
          </div>
          <div class="gb-prize-bg prize-appear">
            <div class="gb-prize-icons">
              <div v-for="(reward, ri) in lotteryResult.rewards" :key="ri" style="position:relative; display:inline-block;">
                <img class="gb-prize-icon" :src="reward.iconSrc" style="object-fit:contain" />
                <div v-if="reward.showBonusBadge" class="gb-bonus-badge">{{reward.value}}</div>
              </div>
            </div>
            <span class="gb-prize-text">{{lotteryResult.displayName}}</span>
          </div>
          <button class="gb-btn claim-btn" @click="onClaimPrize">
            <span>{{ t('map.claim_prize') }}</span>
          </button>
        </template>

        <!-- 已领取（查看模式） -->
        <template v-else-if="lotteryState === 'claimed'">
          <div class="gb-prize-bg">
            <div class="gb-prize-icons">
              <div v-for="(reward, ri) in lotteryResult.rewards" :key="ri" style="position:relative; display:inline-block;">
                <img class="gb-prize-icon" :src="reward.iconSrc" style="object-fit:contain" />
                <div v-if="reward.showBonusBadge" class="gb-bonus-badge">{{reward.value}}</div>
              </div>
            </div>
            <span class="gb-prize-text">{{lotteryResult.displayName}}</span>
          </div>
          <button class="gb-btn" @click="onCloseLottery" style="background: #999;">
            <span>{{ t('map.close') }}</span>
          </button>
        </template>
      </div>
    </div>
  </div>

</div>
  `,

  data() {
    return {
      IMG: IMG,
      islands: [],
      totalStars: 0, // 保留用于内部计算
      scrollTarget: '',
      minScrollTop: 0,
      mapDragging: false,
      mapDragStartY: 0,
      mapDragStartScrollTop: 0,
      mapDragMoved: false,
      showLottery: false,
      showShellExchange: false,
      exchangeCount: 1,
      lotteryIsland: 0,
      lotteryState: 'box', // 'box' | 'opening' | 'prize'
      lotteryResult: null,
      confettiPieces: [],
      prizeLabels: ['🐚 ×2', t('map.label_place'), t('map.label_hint'), '🐚 ×3', t('map.label_30m'), t('map.label_1h')],
    };
  },

  mounted() {
    this.buildIslands();
  },

  methods: {
    onBack() {
      Router.navigateTo('home');
    },

    // 页面重新可见时调用（由路由系统触发）
    onPageShow() {
      this.buildIslands();
    },

    buildIslands(skipScroll) {
      const currentLevel = appState.currentLevel;
      const levelStars = appState.levelStars || {};

      // 确保 claimedGifts 是数组（防止历史存档错误数据）
      if (!Array.isArray(appState.claimedGifts)) {
        appState.claimedGifts = [];
      }
      const claimedGifts = appState.claimedGifts;
      const LPI = 20;

      const ISLAND_COUNT = Math.max(100, Math.ceil(currentLevel / LPI) + 2);
      const islands = [];

      // 当前所在岛屿
      const curIsland = Math.min(Math.ceil(currentLevel / LPI), ISLAND_COUNT);
      // 当前岛上方只渲染下一座未开启岛，下方保留全部已开启岛供玩家回看。
      const renderStart = 1;
      const renderEnd = Math.min(ISLAND_COUNT, curIsland + 1);

      for (let idx = renderStart; idx <= renderEnd; idx++) {
        const i = idx - 1;
        const start = i * LPI + 1;
        const end = start + LPI - 1;
        const unlocked = currentLevel >= start;

        // 路径坐标：3套模板循环复用
        const pathKey = ((idx - 1) % 3) + 1;
        const path = ISLAND_PATHS[pathKey];

        // 底图和主题：24岛循环（1-12原版 + 13-24镜像），25起重新循环
        const cyclePos = ((idx - 1) % 24);        // 0-23
        const baseIdx = (cyclePos % 12);            // 0-11 对应 island_1~12
        const mirrored = cyclePos >= 12;            // 13-24岛镜像
        const BG_IMAGES = [IMG.island_1, IMG.island_2, IMG.island_3, IMG.island_4, IMG.island_5, IMG.island_6, IMG.island_7, IMG.island_8, IMG.island_9, IMG.island_10, IMG.island_11, IMG.island_12];
        const THEMES = ['tropical', 'snow', 'sky', 'desert', 'coral', 'starry', 'sakura', 'volcano', 'sunset', 'mushroom', 'pirate', 'candy'];
        const bgImage = BG_IMAGES[baseIdx];
        const theme = THEMES[baseIdx];

        let perfCnt = 0;
        const nodes = [];

        // 特殊处理第1岛：增加第0关 (教程关)
        if (idx === 1) {
          let status = 'passed';
          if (0 === currentLevel) status = 'current'; // 一般不会出现，currentLevel从1开始
          // 0关的坐标稍微往左下一点，作为起点
          nodes.push({ level: 0, stars: 0, status, x: 10, y: 92 });
        }

        for (let n = 0; n < LPI; n++) {
          const lv = start + n;
          const st = levelStars[lv] || 0;
          let status = 'locked';
          if (lv < currentLevel) status = st >= 3 ? 'perfect' : 'passed';
          else if (lv === currentLevel) status = 'current';
          if (st >= 3) perfCnt++;
          const nx = mirrored ? (100 - path[n].x) : path[n].x;
          nodes.push({ level: lv, stars: st, status, x: nx, y: path[n].y });
        }

        // 路径点
        const trails = [];
        for (let n = 0; n < nodes.length - 1; n++) {
          for (let t = 1; t <= 2; t++) {
            trails.push({
              x: nodes[n].x + (nodes[n+1].x - nodes[n].x) * t / 3,
              y: nodes[n].y + (nodes[n+1].y - nodes[n].y) * t / 3,
            });
          }
        }

        islands.push({
          index: idx, startLevel: start, endLevel: end, unlocked,
          nodes, trails, perfectCount: perfCnt,
          allPerfect: perfCnt === LPI,
          giftClaimed: claimedGifts.includes(idx),
          bgImage, theme, mirrored,
        });
      }

      islands.reverse();
      this.islands = islands;
      this.totalStars = appState.totalStars || 0;
      this.scrollTarget = 'island-' + curIsland;

      // 下一座未开启岛只露出下半部分；该位置同时是允许向上滚动的边界。
      if (!skipScroll) {
        this.$nextTick(() => {
          this.setMapStartPosition(curIsland);
          setTimeout(() => { this.setMapStartPosition(curIsland); }, 300);
          setTimeout(() => { this.setMapStartPosition(curIsland); }, 800);
        });
      }
    },

    setMapStartPosition(curIsland) {
      const scrollView = this.$refs.scrollView;
      const currentRef = this.$refs['island-' + curIsland];
      const nextRef = this.$refs['island-' + (curIsland + 1)];
      const currentIsland = Array.isArray(currentRef) ? currentRef[0] : currentRef;
      const nextIsland = Array.isArray(nextRef) ? nextRef[0] : nextRef;
      if (!scrollView || !currentIsland || !nextIsland) return;

      const topBar = scrollView.querySelector('.map-top-bar');
      const topBarHeight = topBar ? topBar.offsetHeight : 0;
      this.minScrollTop = Math.max(0, nextIsland.offsetTop + nextIsland.offsetHeight / 2 - topBarHeight);

      const visibleHeight = scrollView.clientHeight - topBarHeight;
      const centeredScrollTop = currentIsland.offsetTop + currentIsland.offsetHeight / 2 - topBarHeight - visibleHeight / 2;
      scrollView.scrollTop = Math.max(this.minScrollTop, centeredScrollTop);
    },

    onMapScroll() {
      const scrollView = this.$refs.scrollView;
      if (scrollView && scrollView.scrollTop < this.minScrollTop) {
        scrollView.scrollTop = this.minScrollTop;
      }
    },

    onMapPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.mapDragging = true;
      this.mapDragMoved = false;
      this.mapDragStartY = e.clientY;
      this.mapDragStartScrollTop = this.$refs.scrollView.scrollTop;
    },

    onMapPointerMove(e) {
      if (!this.mapDragging) return;
      const dy = e.clientY - this.mapDragStartY;
      if (Math.abs(dy) > 4) this.mapDragMoved = true;
      this.$refs.scrollView.scrollTop = Math.max(this.minScrollTop, this.mapDragStartScrollTop - dy);
      if (this.mapDragMoved) e.preventDefault();
    },

    onMapPointerUp() {
      if (!this.mapDragging) return;
      this.mapDragging = false;
    },

    onMapClick(e) {
      if (this.mapDragMoved) {
        e.preventDefault();
        e.stopPropagation();
        this.mapDragMoved = false;
      }
    },

    onTapLevel(lv) {
      const cur = appState.currentLevel;
      if (lv > cur) { Toast.show(t('map.not_unlocked'), 'none'); return; }

      // 普通关卡每次进入都需要消耗贝壳；没有无限体力时禁止免费进入。
      const isInfinitePlay = appState.infinitePlayEndTime && appState.infinitePlayEndTime > Date.now();
      if (lv > 0 && !isInfinitePlay && appState.shells <= 0 && (appState.bonusShells || 0) <= 0) {
        this.showShellExchange = true;
        this.exchangeCount = 1;
        return;
      }

      // 0关和1关包含教程，不弹刷星提示，直接进入
      if (lv === 0 || lv === 1 || lv === cur) {
        Router.navigateTo('game', { level: lv });
        return;
      }

      const st = appState.levelStars[lv] || 0;
      Modal.show({
        title: t('map.replay_level', {level: lv}),
        content: t('map.replay_hint', {stars: st}),
        confirmText: t('map.replay'),
        cancelText: t('common.cancel'),
      }).then(res => {
        if (res.confirm) Router.navigateTo('game', { level: lv });
      });
    },

    onOpenGift(idx) {
      const is = this.islands.find(i => i.index === idx);
      if (!is || !is.allPerfect) { Toast.show(t('map.not_all_perfect'), 'none'); return; }

      // 如果已领取，显示历史奖励（只能查看，不能重复领取）
      if (is.giftClaimed) {
        const claimedPrize = appState.claimedGiftHistory && appState.claimedGiftHistory[idx];
        if (claimedPrize) {
          this.showLottery = true;
          this.lotteryIsland = idx;
          const prizeIndex = typeof claimedPrize === 'object' ? claimedPrize.prizeIndex : claimedPrize;
          const skinKey = typeof claimedPrize === 'object' ? claimedPrize.skinKey : appState.currentSkin;
          this.lotteryState = 'claimed'; // 新状态：已领取（查看模式）
          this.lotteryResult = this.buildLotteryResult(prizeIndex, skinKey);
        } else {
          Toast.show(t('map.already_claimed'), 'none');
        }
        return;
      }

      this.showLottery = true;
      this.lotteryIsland = idx;
      const pendingPrize = appState.pendingGifts && appState.pendingGifts[idx];
      if (pendingPrize !== undefined) {
        const prizeIndex = typeof pendingPrize === 'object' ? pendingPrize.prizeIndex : pendingPrize;
        const skinKey = typeof pendingPrize === 'object' ? pendingPrize.skinKey : appState.currentSkin;
        this.lotteryState = 'prize';
        this.lotteryResult = this.buildLotteryResult(prizeIndex, skinKey);
      } else {
        this.lotteryState = 'box';
        this.lotteryResult = null;
      }
    },

    buildLotteryResult(prizeIndex, skinKey) {
      skinKey = skinKey || appState.currentSkin || 'crab';
      const skin = appState.skins[skinKey];
      const rewards = PRIZES[prizeIndex].map(item => {
        const reward = Object.assign({}, item);
        reward.iconSrc = reward.icon === 'skin' ? skin.icon : IMG[reward.icon];
        reward.displayName = reward.icon === 'skin'
          ? t('map.prize_place_skin', {skinName: t(skin.nameKey)})
          : t(reward.name);
        // 岛屿满星的贝壳奖励统一显示红色徽章（视为 bonusShells）
        reward.showBonusBadge = reward.field === 'shells';
        return reward;
      });
      return {
        rewards,
        iconSrc: rewards[0].iconSrc,
        displayName: rewards.map(reward => reward.displayName).join(' + '),
      };
    },

    onOpenBox() {
      if (this.lotteryState === 'prize' || this.lotteryState === 'opening') return;

      // 首次开箱时随机抽取并立即保存结果，关闭后只能继续领取，不能重抽。
      const pi = Math.floor(Math.random() * PRIZES.length);
      if (!appState.pendingGifts) appState.pendingGifts = {};
      const skinKey = appState.currentSkin || 'crab';
      appState.pendingGifts[this.lotteryIsland] = { prizeIndex: pi, skinKey };
      saveGameData();
      const result = this.buildLotteryResult(pi, skinKey);

      // 播放抖动动画
      this.lotteryState = 'opening';

      // 简单模拟1.5秒的开盒动画以增强仪式感
      setTimeout(() => {
        // 触感反馈 + 音效
        vibrateShort();
        AudioManager.playSFX('win');
        AudioManager.playCelebrate();
        this.confettiPieces = generateConfetti(45);
        this.lotteryState = 'prize';
        this.lotteryResult = result;
      }, 1200);
    },

    onClaimPrize() {
      const pr = this.lotteryResult;
      if (!pr) return;

      const now = Date.now();
      const baseTime = Math.max(now, appState.infinitePlayEndTime || 0);
      pr.rewards.forEach(reward => {
        if (reward.field && reward.value) {
          // 岛屿满星的贝壳奖励统一加到 bonusShells
          if (reward.field === 'shells') {
            appState.bonusShells = (appState.bonusShells || 0) + reward.value;
          } else {
            appState[reward.field] = (appState[reward.field] || 0) + reward.value;
          }
        } else if (reward.type === 'infinite30') {
          appState.infinitePlayEndTime = baseTime + 30 * 60 * 1000;
        } else if (reward.type === 'infinite60') {
          appState.infinitePlayEndTime = baseTime + 60 * 60 * 1000;
        }
      });
      const idx = this.lotteryIsland;

      // 确保 claimedGifts 是数组
      if (!Array.isArray(appState.claimedGifts)) {
        appState.claimedGifts = [];
      }
      if (!appState.claimedGifts.includes(idx)) appState.claimedGifts.push(idx);

      // 保存奖励历史到 claimedGiftHistory，以便用户之后可以查看
      if (!appState.claimedGiftHistory) appState.claimedGiftHistory = {};
      const pendingPrize = appState.pendingGifts && appState.pendingGifts[idx];
      if (pendingPrize) {
        appState.claimedGiftHistory[idx] = pendingPrize;
      }

      if (appState.pendingGifts) delete appState.pendingGifts[idx];
      saveGameData();

      Toast.show(t('map.claim_success'), 'success');
      this.showLottery = false;
      this.buildIslands(true);

      // 停留在刚领取礼物的岛屿
      this.$nextTick(() => {
        const el = this.$refs['island-' + idx];
        const target = Array.isArray(el) ? el[0] : el;
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({ behavior: 'instant', block: 'center' });
          }, 100);
        }
      });
    },

    onCloseLottery() {
      if (this.lotteryState !== 'opening') {
        this.showLottery = false;
      }
    },

    onCloseShellExchange() {
      this.showShellExchange = false;
    },

    onShellMinus() {
      if (this.exchangeCount > 1) this.exchangeCount--;
    },

    onShellPlus() {
      const maxBuy = Math.floor(appState.coins / 20);
      const maxExt = appState.maxShells - appState.shells;
      const limit = Math.min(maxBuy, Math.max(maxExt, 1), 8);
      if (this.exchangeCount < limit) this.exchangeCount++;
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
      this.showShellExchange = false;
      this.buildIslands(true);
      Toast.show(t('home.reward_shells', {count: count}), 'success');
    },

    preventBubble() {},
  },
};
