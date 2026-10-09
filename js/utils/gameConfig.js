/**
 * 看你智商藏哪 — 关卡配置
 */

// 区域配色方案（参考智商不够别点的马卡龙柔和配色）
const REGION_COLORS = [
  '#78C5E3', // 0: 天蓝 (冷色/明亮)
  '#F09541', // 1: 活力橘 (暖色/高饱和度)
  '#A8D86E', // 2: 青柠绿 (中间色/高明度)
  '#CD91D8', // 3: 紫罗兰 (冷暖交界/亮紫) - 前4色完美对比
  '#E88BAD', // 4: 粉红 (红调)
  '#506999', // 5: 深丹宁蓝 (深冷调) - 前6色完美对比
  '#F3E073', // 6: 奶油黄 (浅亮暖色)
  '#9B4F80', // 7: 李子紫 (深红紫调) - 前8色完美对比
  '#4DBEB0', // 8: 青绿 (蓝绿调)
  '#AF7E5C', // 9: 咖啡棕 (大地暗暖色) - 前10色完美对比
  '#948BCE', // 10: 鸢尾紫 (高灰度蓝紫)
  '#9BB0C1', // 11: 冷灰蓝 (冷性灰蓝) - 12色全集
];

function getRegionColorName(index) {
  return t('color.' + index);
}
const REGION_COLOR_NAMES = new Proxy([], {
  get(target, prop) {
    if (!isNaN(prop)) return getRegionColorName(Number(prop));
    if (prop === 'length') return 12;
    return Reflect.get(target, prop);
  }
});

/**
 * 根据关卡号获取关卡配置
 * @param {number} level - 关卡号（从1开始）
 * @returns {Object} { size, starsPerUnit, difficulty }
 */
function getLevelConfig(level) {
  let logicLevel = level;
  // 1000关以后循环复用 201~1000 关的成熟难度区间（含hard+双星+放松包节奏）
  if (logicLevel > 1000) {
    logicLevel = ((logicLevel - 1001) % 800) + 201;
  }

  // 教程关（第0关，特殊处理）
  if (logicLevel === 0) {
    return { size: 4, starsPerUnit: 1, difficulty: 'easy', isTutorial: true };
  }

  // 1-2关：4×4
  if (logicLevel === 1) {
    return { size: 4, starsPerUnit: 1, difficulty: 'easy' };
  }
  if (logicLevel === 2) {
    return { size: 4, starsPerUnit: 1, difficulty: 'easy' };
  }

  // 3-10关：6×6
  if (logicLevel <= 10) {
    return { size: 6, starsPerUnit: 1, difficulty: 'easy' };
  }

  // 11-20关：6×6 → 8×8 递进
  if (logicLevel <= 20) {
    if (logicLevel <= 15) {
      return { size: 6, starsPerUnit: 1, difficulty: 'normal' };
    }
    return { size: 8, starsPerUnit: 1, difficulty: 'easy' };
  }

  // 21-30关：前4关6×6，后6关8×8
  if (logicLevel <= 30) {
    if (logicLevel <= 24) return { size: 6, starsPerUnit: 1, difficulty: 'normal' };
    return { size: 8, starsPerUnit: 1, difficulty: 'normal' };
  }

  // 31-100关：6×6和8×8各连续两关循环
  if (logicLevel <= 100) {
    // 第50/75/100关为6×6 easy里程碑奖励关
    if (logicLevel === 50 || logicLevel === 75 || logicLevel === 100) {
      return { size: 6, starsPerUnit: 1, difficulty: 'easy', isMilestone: true };
    }
    // 91-100关的偶数关穿插简化版10×10
    if (logicLevel >= 91 && logicLevel % 2 === 0) {
      return { size: 10, starsPerUnit: 1, difficulty: 'easy' };
    }
    const cycle = Math.floor((logicLevel - 31) / 2) % 2;
    if (cycle === 0) return { size: 6, starsPerUnit: 1, difficulty: 'normal' };
    return { size: 8, starsPerUnit: 1, difficulty: 'normal' };
  }

  // 101-200关：6×6(1) → 8×8(3) → 10×10(4)循环
  if (logicLevel <= 200) {
    const cycle = (logicLevel - 101) % 8;
    if (cycle < 1) return { size: 6, starsPerUnit: 1, difficulty: 'normal' };
    if (cycle < 4) return { size: 8, starsPerUnit: 1, difficulty: 'normal' };
    return { size: 10, starsPerUnit: 1, difficulty: 'normal' };
  }

  // 201-1000关：6×6(1) → 8×8(3) → 10×10(6)循环
  // 每50关的第47-49关为6×6 easy放松包
  const inRelaxBlock = logicLevel % 50 >= 47;
  if (inRelaxBlock) {
    return { size: 6, starsPerUnit: 1, difficulty: 'easy', isRelax: true };
  }

  const cycle = (logicLevel - 201) % 10;
  if (cycle < 1) return { size: 6, starsPerUnit: 1, difficulty: 'hard' };
  if (cycle < 4) return { size: 8, starsPerUnit: 1, difficulty: 'hard' };
  return { size: 10, starsPerUnit: 2, difficulty: 'normal' };
}

/**
 * 获取过关奖励
 */
function getLevelReward(level, stars) {
  let logicLevel = level;
  if (logicLevel > 1000) {
    logicLevel = ((logicLevel - 1001) % 800) + 201;
  }

  const base = { coins: 2, shells: 0 };

  // 基础金币随特定关卡阶段提升
  if (level >= 400) {
    base.coins = 4;
  } else if (level >= 300) {
    base.coins = 3;
  }

  // 里程碑关卡双倍金币
  if (logicLevel === 50 || logicLevel === 75 || logicLevel === 100) {
    base.coins *= 2;
  }

  // 放松包双倍金币
  if (logicLevel > 200 && (logicLevel % 50 >= 47)) {
    base.coins *= 2;
  }

  return base;
}

/**
 * 生存模式总关数：第15关通关后强制结束
 */
const SURVIVAL_TOTAL_ROUNDS = 15;

/**
 * 生存模式里程碑节点（进度条上显示数字的关卡）
 */
const SURVIVAL_MILESTONES = [3, 5, 7, 9, 10];

/**
 * 获取生存模式第 round 关的配置
 * @param {number} round - 当前关数 (1-15)
 * @returns {Object} { size, starsPerUnit, difficulty }
 */
function getSurvivalRoundConfig(round) {
  if (round <= 2) return { size: 6, starsPerUnit: 1, difficulty: 'normal' };
  if (round <= 6) return { size: 8, starsPerUnit: 1, difficulty: 'normal' };
  if (round === 7) return { size: 10, starsPerUnit: 1, difficulty: 'normal' };
  if (round === 8) return { size: 10, starsPerUnit: 1, difficulty: 'hard' };
  if (round === 9) return { size: 12, starsPerUnit: 1, difficulty: 'normal' };
  if (round === 10) return { size: 12, starsPerUnit: 1, difficulty: 'hard' };
  // 11关以上：全部 12×12 hard
  return { size: 12, starsPerUnit: 1, difficulty: 'hard' };
}

window.GameConfig = {
  REGION_COLORS,
  REGION_COLOR_NAMES,
  getLevelConfig,
  getLevelReward,
  SURVIVAL_TOTAL_ROUNDS,
  SURVIVAL_MILESTONES,
  getSurvivalRoundConfig,
};
