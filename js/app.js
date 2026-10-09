/**
 * 全局状态管理（替代微信小程序的 getApp().globalData）
 * 使用 Vue.reactive() 实现响应式
 */

const IMG_BASE = 'assets/images/';

// 图片资源路径常量（替代 cloudRes.js）
const IMG = {
  // 通用 UI
  ad_icon_clean:   IMG_BASE + 'ad_icon_clean.png',
  box:             IMG_BASE + 'box.png',
  btn_map:         IMG_BASE + 'btn_map-3.png?v=4',
  btn_skin:        IMG_BASE + 'btn_skin-3.png?v=4',
  calendar:        IMG_BASE + 'calendar.png',
  calendar_2:      IMG_BASE + 'calendar_2.png',
  check:           IMG_BASE + 'check.png',
  clear:           IMG_BASE + 'clear.png',
  coin:            IMG_BASE + 'coin.png',
  face_lose:       IMG_BASE + 'face_lose.png',
  gear:            IMG_BASE + 'gear.png',
  gift:            IMG_BASE + 'gift.png',
  heart_active:    IMG_BASE + 'heart_active.png',
  heart_empty:     IMG_BASE + 'heart_empty.png',
  hint:            IMG_BASE + 'hint.png',
  home:            IMG_BASE + 'home.png',
  infinite:        IMG_BASE + 'infinite.png',
  lock:            IMG_BASE + 'lock.png',
  logo:            IMG_BASE + 'logo.png',
  moon:            IMG_BASE + 'moon.png',
  music:           IMG_BASE + 'music.png',
  shell:           IMG_BASE + 'shell.png',
  sound:           IMG_BASE + 'sound.png',
  star:            IMG_BASE + 'star.png',
  tap_2:           IMG_BASE + 'tap_2.png',
  vibrate:         IMG_BASE + 'vibrate.png',
  share_bg:        IMG_BASE + 'share_bg.png',
  share_filled:    IMG_BASE + 'share_filled.svg',
  tap_glove_back:  IMG_BASE + 'tap_glove_back.svg',

  // 地图背景
  island_1:        IMG_BASE + 'island_1.png',
  island_2:        IMG_BASE + 'island_2.png',
  island_3:        IMG_BASE + 'island_3.png',
  island_4:        IMG_BASE + 'island_4.png',
  island_5:        IMG_BASE + 'island_5.png',
  island_6:        IMG_BASE + 'island_6.png',
  island_7:        IMG_BASE + 'island_7.png',
  island_8:        IMG_BASE + 'island_8.png',
  island_9:        IMG_BASE + 'island_9.png',
  island_10:       IMG_BASE + 'island_10.png',
  island_11:       IMG_BASE + 'island_11.png',
  island_12:       IMG_BASE + 'island_12.png',

  // 螃蟹皮肤
  crab:            IMG_BASE + 'crab.png',
  crab_walk_1:     IMG_BASE + 'crab_walk_1.png',
  crab_walk_2:     IMG_BASE + 'crab_walk_2.png',
  crab_fight:      IMG_BASE + 'crab_fight.png',

  // 小猪皮肤
  pig:             IMG_BASE + 'pig.png',
  pig_rolling:     IMG_BASE + 'pig_rolling.png',
  pig_fight:       IMG_BASE + 'pig_fight.png',

  // 猫头鹰皮肤
  owl:             IMG_BASE + 'owl.png',
  owl_fly:         IMG_BASE + 'owl_fly.png',
  owl_fight:       IMG_BASE + 'owl_fight.png',

  // 章鱼皮肤
  octopus:         IMG_BASE + 'octopus.png',
  octopus_swim:    IMG_BASE + 'octopus_swim.png',
  octopus_fight:   IMG_BASE + 'octopus_fight.png',

  // 松鼠皮肤
  squirrel:        IMG_BASE + 'squirrel.png',
  squirrel_squat:  IMG_BASE + 'squirrel_squat.png',
  squirrel_fight:  IMG_BASE + 'squirrel_fight.png',

  // 鹦鹉皮肤
  parrot:          IMG_BASE + 'parrot.png',
  parrot_talk:     IMG_BASE + 'parrot_talk.png',
  parrot_fight:    IMG_BASE + 'parrot_fight.png',

  // 海龟皮肤
  turtle:          IMG_BASE + 'turtle.png',
  turtle_swim_1:   IMG_BASE + 'turtle_swim_1.png',
  turtle_swim_2:   IMG_BASE + 'turtle_swim_2.png',
  turtle_fight:    IMG_BASE + 'turtle_fight.png',

  // 恐龙皮肤
  dino:            IMG_BASE + 'dino.png',
  dino_fall:       IMG_BASE + 'dino_fall.png',
  dino_fight:      IMG_BASE + 'dino_fight.png',

  // 凤凰皮肤
  phoenix:         IMG_BASE + 'phoenix.png',
  phoenix_glide:   IMG_BASE + 'phoenix_glide.png',
  phoenix_flap:    IMG_BASE + 'phoenix_flap.png',
  phoenix_fight:   IMG_BASE + 'phoenix_fight.png',
};

// 全局状态（响应式）
const appState = Vue.reactive({
  // 玩家数据
  tutorialDone: false,
  currentLevel: 1,
  totalStars: 0,
  coins: 0,
  shells: 6,
  maxShells: 6,
  bonusShells: 0,
  currentSkin: 'crab',
  unlockedSkins: ['crab'],
  pigAdWatched: 0,
  levelStars: {},
  claimedGifts: [],
  pendingGifts: {},
  claimedGiftHistory: {}, // 保存已领取礼物的历史记录
  placeOneCount: 0,
  hintCount: 0,
  dailyPlayedDate: '',
  survivalPlayedDate: '',
  survivalPlayedCount: 0,
  survivalMaxCrabsFound: 0,
  checkInCount: 1,
  lastCheckInDate: '',
  infinitePlayEndTime: 0,
  vibrateOn: true,

  // 全局皮肤配置
  skins: {
    'crab': {
      name: 'crab', nameKey: 'skin.crab.name', icon: IMG.crab, unlockType: 'free', unlockLevel: 0, price: 0,
      failTextKey: 'skin.crab.failText',
      dailyImage: IMG.crab_walk_1, dailyAnimationType: 'walk', survivalImage: IMG.crab_fight
    },
    'pig': {
      name: 'pig', nameKey: 'skin.pig.name', icon: IMG.pig, unlockType: 'ad', unlockLevel: 0, price: 300, adRequired: 3,
      failTextKey: 'skin.pig.failText',
      dailyImage: IMG.pig_rolling, dailyAnimationType: 'roll', survivalImage: IMG.pig_fight
    },
    'owl': {
      name: 'owl', nameKey: 'skin.owl.name', icon: IMG.owl, unlockType: 'coins', unlockLevel: 100, price: 400,
      failTextKey: 'skin.owl.failText',
      dailyImage: IMG.owl, dailyImage2: IMG.owl_fly, dailyAnimationType: 'fly', survivalImage: IMG.owl_fight
    },
    'octopus': {
      name: 'octopus', nameKey: 'skin.octopus.name', icon: IMG.octopus, unlockType: 'coins', unlockLevel: 200, price: 500,
      failTextKey: 'skin.octopus.failText',
      dailyImage: IMG.octopus, dailyImage2: IMG.octopus_swim, dailyAnimationType: 'swim', survivalImage: IMG.octopus_fight
    },
    'squirrel': {
      name: 'squirrel', nameKey: 'skin.squirrel.name', icon: IMG.squirrel, unlockType: 'coins', unlockLevel: 300, price: 600,
      failTextKey: 'skin.squirrel.failText',
      dailyImage: IMG.squirrel_squat, dailyImage2: IMG.squirrel, dailyAnimationType: 'hop', survivalImage: IMG.squirrel_fight
    },
    'parrot': {
      name: 'parrot', nameKey: 'skin.parrot.name', icon: IMG.parrot, unlockType: 'coins', unlockLevel: 400, price: 700,
      failTextKey: 'skin.parrot.failText',
      dailyImage: IMG.parrot, dailyImage2: IMG.parrot_talk, dailyAnimationType: 'chirp', survivalImage: IMG.parrot_fight
    },
    'turtle': {
      name: 'turtle', nameKey: 'skin.turtle.name', icon: IMG.turtle, unlockType: 'coins', unlockLevel: 500, price: 800,
      failTextKey: 'skin.turtle.failText',
      dailyImage: IMG.turtle_swim_1, dailyImage2: IMG.turtle_swim_2, dailyAnimationType: 'swim', survivalImage: IMG.turtle_fight
    },
    'dino': {
      name: 'dino', nameKey: 'skin.dino.name', icon: IMG.dino, unlockType: 'coins', unlockLevel: 700, price: 1000,
      failTextKey: 'skin.dino.failText',
      dailyImage: IMG.dino, dailyImage2: IMG.dino_fall, dailyAnimationType: 'stumble', survivalImage: IMG.dino_fight
    },
    'phoenix': {
      name: 'phoenix', nameKey: 'skin.phoenix.name', icon: IMG.phoenix, unlockType: 'coins', unlockLevel: 1000, requireAllStars: true, price: 1500,
      failTextKey: 'skin.phoenix.failText',
      dailyImage: IMG.phoenix_glide, dailyImage2: IMG.phoenix_flap, dailyAnimationType: 'soar-flap', survivalImage: IMG.phoenix_fight
    }
  },
});

// ==================== 存档系统 ====================

function loadGameData() {
  try {
    const raw = localStorage.getItem('gameData');
    if (raw) {
      const data = JSON.parse(raw);

      // 修正 claimedGifts 数据类型（历史存档可能错误地保存为对象）
      if (data.claimedGifts && !Array.isArray(data.claimedGifts)) {
        const claimed = data.claimedGifts;
        const fixedArray = [];
        for (let key in claimed) {
          const idx = parseInt(key);
          if (!isNaN(idx) && !fixedArray.includes(idx)) {
            fixedArray.push(idx);
          }
        }
        data.claimedGifts = fixedArray;
      }

      if (!data.claimedGifts) {
        data.claimedGifts = [];
      }

      Object.assign(appState, data);

      // Vue.reactive 数组修复：使用 splice + push 而非赋值
      if (!Array.isArray(appState.claimedGifts)) {
        const fixedArray = Array.isArray(data.claimedGifts) ? data.claimedGifts : [];
        if (typeof appState.claimedGifts.splice === 'function') {
          appState.claimedGifts.splice(0, appState.claimedGifts.length);
          appState.claimedGifts.push(...fixedArray);
        } else {
          appState.claimedGifts = fixedArray;
        }
      }
    }
  } catch (e) {
    console.error('读取存档失败', e);
  }
}

function saveGameData() {
  try {
    // 确保 claimedGifts 是数组
    if (!Array.isArray(appState.claimedGifts)) {
      appState.claimedGifts = [];
    }

    const data = {
      currentLevel: appState.currentLevel,
      tutorialDone: appState.tutorialDone,
      totalStars: appState.totalStars,
      coins: appState.coins,
      shells: appState.shells,
      currentSkin: appState.currentSkin,
      unlockedSkins: appState.unlockedSkins,
      pigAdWatched: appState.pigAdWatched,
      levelStars: appState.levelStars,
      claimedGifts: appState.claimedGifts,
      pendingGifts: appState.pendingGifts,
      claimedGiftHistory: appState.claimedGiftHistory || {},
      placeOneCount: appState.placeOneCount,
      hintCount: appState.hintCount,
      dailyPlayedDate: appState.dailyPlayedDate,
      survivalPlayedDate: appState.survivalPlayedDate,
      survivalPlayedCount: appState.survivalPlayedCount,
      survivalMaxCrabsFound: appState.survivalMaxCrabsFound,
      checkInCount: appState.checkInCount,
      lastCheckInDate: appState.lastCheckInDate,
      infinitePlayEndTime: appState.infinitePlayEndTime,
      starterGiftGiven: appState.starterGiftGiven,
      bonusShells: appState.bonusShells || 0,
      lastLoginDate: appState.lastLoginDate,
    };
    localStorage.setItem('gameData', JSON.stringify(data));
  } catch (e) {
    console.error('保存存档失败', e);
  }
}

// 贝壳恢复计时器（每秒检查，支持倒计时显示）
let _shellRecoveryTimer = null;
let _shellRecoveryStart = Date.now();
function startShellRecovery() {
  if (_shellRecoveryTimer) clearInterval(_shellRecoveryTimer);
  _shellRecoveryStart = Date.now();
  _shellRecoveryTimer = setInterval(() => {
    if (appState.shells < appState.maxShells) {
      if (Date.now() - _shellRecoveryStart >= 60000) {
        appState.shells++;
        saveGameData();
        _shellRecoveryStart = Date.now();
      }
    } else {
      // 满格时持续重置起点，消耗后从那一刻开始倒计时
      _shellRecoveryStart = Date.now();
    }
  }, 1000);
}
/** 获取下一个贝壳恢复的剩余秒数（满格返回 0） */
function getShellRecoveryRemaining() {
  if (appState.shells >= appState.maxShells) return 0;
  const elapsed = Date.now() - _shellRecoveryStart;
  return Math.max(0, Math.ceil((60000 - elapsed) / 1000));
}

// ==================== 应用初始化 ====================

function initApp() {
  loadGameData();

  saveGameData();

  // 同步震动开关
  const vibrateStored = localStorage.getItem('audioVibrateOn');
  if (vibrateStored !== null) appState.vibrateOn = vibrateStored === 'true';
  startShellRecovery();
  AudioManager.init();
  console.log('[App] 初始化完成');
}

// 页面可见性变化处理（替代小程序 onHide/onShow）
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    AudioManager.onHide();
  } else {
    AudioManager.onShow();
  }
});

// 全局禁用浏览器后退（防止右滑/物理返回键退出游戏）
history.pushState(null, '', location.href);
window.addEventListener('popstate', () => {
  history.pushState(null, '', location.href);
});

// 震动辅助函数
function vibrateShort() {
  if (appState.vibrateOn !== false && navigator.vibrate) {
    navigator.vibrate(50);
  }
}

// 全局随机彩纸生成函数
function generateConfetti(count) {
  const colors = ['#FF6B6B','#FFE57F','#4FC3F7','#A8D86E','#FF8E53','#CE93D8','#FF4081','#69F0AE','#FDD835','#7C4DFF'];
  const pieces = [];
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = (Math.random() * 100).toFixed(1) + '%';
    const fallDur = (3.5 + Math.random() * 3).toFixed(2) + 's';
    const swayDur = (1.2 + Math.random() * 2).toFixed(2) + 's';
    const delay = (Math.random() * 3).toFixed(2) + 's';
    const sway = ((Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 12)).toFixed(1) + 'vw';
    const isRound = Math.random() > 0.6;
    const isRibbon = Math.random() > 0.7;
    let finalW, finalH, borderR = '0.53vw';
    if (isRound) {
      const sz = (1.5 + Math.random() * 3.5).toFixed(2) + 'vw';
      finalW = sz; finalH = sz; borderR = '50%';
    } else if (isRibbon) {
      finalW = (0.8 + Math.random() * 1).toFixed(2) + 'vw';
      finalH = (3 + Math.random() * 3).toFixed(2) + 'vw';
    } else {
      finalW = (1.5 + Math.random() * 3).toFixed(2) + 'vw';
      finalH = (1.5 + Math.random() * 3).toFixed(2) + 'vw';
    }
    pieces.push({
      position: 'absolute',
      left: left,
      width: finalW,
      height: finalH,
      backgroundColor: color,
      borderRadius: borderR,
      opacity: 0,
      animation: `confetti-fall ${fallDur} ease-out ${delay} infinite, confetti-sway ${swayDur} ease-in-out ${delay} infinite`,
      '--sway': sway,
    });
  }
  return pieces;
}
