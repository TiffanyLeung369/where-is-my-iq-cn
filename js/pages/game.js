/**
 * Game 页面 — Vue 3 组件
 * 从微信小程序 pages/game/game.wxml + game.js 转换而来
 */

function rotatePuzzleMatrix(matrix, turns) {
  let result = matrix.map(row => [...row]);
  for (let i = 0; i < turns; i++) {
    result = result[0].map((_, col) => result.map(row => row[col]).reverse());
  }
  return result;
}

function mirrorPuzzleMatrix(matrix) {
  return matrix.map(row => [...row].reverse());
}

function transformSurvivalPuzzle(puzzle, turns, mirrored) {
  let regions = rotatePuzzleMatrix(puzzle.regions, turns);
  let solution = rotatePuzzleMatrix(puzzle.solution, turns);
  if (mirrored) {
    regions = mirrorPuzzleMatrix(regions);
    solution = mirrorPuzzleMatrix(solution);
  }
  return { ...puzzle, regions, solution };
}

function survivalPuzzleKey(puzzle) {
  const regionMap = new Map();
  let nextRegion = 0;
  const normalizedRegions = puzzle.regions.map(row => row.map(value => {
    if (!regionMap.has(value)) regionMap.set(value, nextRegion++);
    return regionMap.get(value);
  }));
  return JSON.stringify([normalizedRegions, puzzle.solution]);
}

const GamePage = {
  template: `
<div class="page">

  <!-- 游戏主区 -->
  <div :class="['game-board-area', isTutorial ? 'tut-layout' : '']" v-if="pageReady">

    <!-- 顶部信息（普通和每日挑战共用布局） -->
    <div class="header-section" v-if="!isTutorial">

      <!-- 普通模式专用头部：3行布局 -->
      <template v-if="mode === 'normal'">
        <!-- 第一行：关卡名称居中 -->
        <div class="header-row">
          <div class="left-item"></div>
          <div class="center-item">
            <div class="level-badge">
              <span class="level-text">{{t('game.level_number', {level: level})}}</span>
            </div>
          </div>
          <div class="right-item"></div>
        </div>
        <!-- 第二行：齿轮靠左 + 红心居中 -->
        <div class="header-row normal-settings-row">
          <div class="left-item">
            <div class="gear-btn" @click="onOpenSettings">
              <img :src="IMG.gear" class="gear-icon pencil-icon" style="object-fit:contain" />
            </div>
          </div>
          <div class="center-item">
            <div class="hearts">
              <img v-for="(h, index) in maxHearts" :key="index"
                   :src="index < hearts ? IMG.heart_active : IMG.heart_empty"
                   :class="['heart', 'pencil-icon', index < hearts ? 'heart-active' : 'heart-lost']"
                   style="object-fit:contain" />
            </div>
          </div>
          <div class="right-item"></div>
        </div>
        <!-- 第三行：贝壳靠左 + 金币靠右 -->
        <div class="normal-assets-row">
          <div class="asset-item" @click="onBuyShells">
            <img class="asset-icon" :src="IMG.shell" style="object-fit:contain" />
            <span v-if="isInfinitePlay" class="infinite-energy-value"><strong>∞</strong><span>{{infiniteTimeDisplay}}</span></span>
            <span v-else class="asset-value">{{shellsDisplay}}</span>
            <div class="bonus-badge" v-if="bonusShells > 0">{{bonusShells}}</div>
            <div class="asset-plus">+</div>
          </div>
          <div class="asset-item" @click="onBuyCoins">
            <img class="asset-icon" :src="IMG.coin" style="object-fit:contain" />
            <span class="asset-value">{{coins}}</span>
            <div class="asset-plus">+</div>
          </div>
        </div>
      </template>

      <!-- 每日挑战 / 生存模式头部：保持原布局 -->
      <template v-if="mode === 'daily' || mode === 'survival'">
        <!-- 第一行：齿轮 + 标题居中 -->
        <div :class="['header-row', mode === 'daily' ? 'daily-settings-row' : 'survival-settings-row']">
          <div class="left-item">
            <div class="gear-btn" @click="onOpenSettings">
              <img :src="IMG.gear" class="gear-icon pencil-icon" style="object-fit:contain" />
            </div>
          </div>
          <div class="center-item">
            <div class="daily-title-badge" v-if="mode === 'daily'">
              <span class="daily-title-text">{{t('game.daily_challenge')}}</span>
            </div>
            <div class="survival-title-badge" v-if="mode === 'survival'">
              <span class="survival-title-text">{{t('game.survival_round', {round: survivalRound})}}</span>
            </div>
          </div>
          <div class="right-item"></div>
        </div>
        <!-- 第二行：红心居中 -->
        <div class="header-row">
          <div class="left-item"></div>
          <div class="center-item">
            <div class="hearts">
              <img v-for="(h, index) in maxHearts" :key="index"
                   :src="index < hearts ? IMG.heart_active : IMG.heart_empty"
                   :class="['heart', 'pencil-icon', index < hearts ? 'heart-active' : 'heart-lost']"
                   style="object-fit:contain" />
            </div>
          </div>
          <div class="right-item"></div>
        </div>
        <!-- 第三行：金币靠左 + 倒计时靠右 -->
        <div :class="mode === 'daily' ? 'daily-assets-row' : 'challenge-assets-row'">
          <div class="asset-item" @click="onBuyCoins">
            <img class="asset-icon" :src="IMG.coin" style="object-fit:contain" />
            <span class="asset-value">{{coins}}</span>
            <div class="asset-plus">+</div>
          </div>
          <div :class="['daily-timer', timeRemaining <= 30 ? 'timer-urgent' : '']">
            <span class="timer-text">⏳{{timeRemaining}}s</span>
            <div :class="['time-bonus-flytext', showTimeBonus ? 'fly-up' : '', timeBonusType]" v-if="showTimeBonus">
              {{timeBonusText}}
            </div>
          </div>
        </div>
      </template>

      <!-- 生存模式里程碑进度 -->
      <div class="survival-progress" v-if="mode === 'survival'">
        <div class="survival-track">
          <div v-for="segment in survivalProgressBase" :key="segment"
               :class="['survival-segment', survivalRound > segment ? 'passed' : '']"></div>
        </div>
        <div v-for="item in survivalMilestones" :key="item"
             :class="['survival-node', survivalRound > item ? 'passed' : '']"
             :style="{left: ((item - 1) / (survivalProgressBase - 1) * 100) + '%'}">
          <div class="survival-node-dot">
            <span v-if="survivalRound > item">✓</span>
            <span v-else>{{item}}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- 规则提示 -->
    <div class="rule-bar" v-if="showRuleHint">
      <div :class="['typewriter-mask', ruleAnimActive ? 'typing-active' : '']" @animationend="onTypewriterEnd">
      <div class="rule-text">{{ ruleMainText }}</div>
      <div class="rule-text-sub">{{ ruleSubText }}</div>
      </div>
    </div>

    <!-- 网格 + 教程浮动层的容器 -->
    <div class="grid-wrapper">

      <!-- top tutorial text -->
      <div class="tut-top-abs" v-if="isTutorial && tutTextNodes">
        <div class="tut-text-box-flow top-flow animate-dropIn">
          <span v-html="renderRichText(tutTextNodes)"></span>
        </div>
      </div>

      <!-- 网格 -->
      <div :class="['grid', boardAnimClass]" id="game-grid"
           @pointerdown="onGridPointerStart"
           @pointermove.prevent="onGridPointerMove"
           @pointerup="onGridPointerEnd"
           @pointercancel="onGridPointerEnd">
        <div v-for="(row, rowIdx) in gridData" :key="rowIdx" class="grid-row">
          <div v-for="(cell, colIdx) in row" :key="colIdx"
               :class="['grid-cell', cell.state, cell.borderClasses, cell.isHintPulse ? 'hint-pulsing' : '', cell.isHintContext ? 'hint-context' : '']"
               :style="{width: cellSizeVw, height: cellSizeVw, backgroundColor: cell.color, animationDelay: cell.animDelay + 's'}"
               @click="onCellTap(rowIdx, colIdx)">

            <!-- 正确标记 -->
            <div class="cell-content" v-if="cell.state === 'correct'">
              <div class="mini-burst" v-if="cell.isWinningDance">
                <div class="burst-p p1"></div><div class="burst-p p2"></div><div class="burst-p p3"></div><div class="burst-p p4"></div>
                <div class="burst-p p5"></div><div class="burst-p p6"></div><div class="burst-p p7"></div><div class="burst-p p8"></div>
              </div>
              <div :class="['crab-container', cell.isWinningDance ? 'animate-win-jump' : 'animate-dropIn']">
                <img class="crab-img animate-idle" :src="skinData.icon" style="object-fit:contain" />
              </div>
            </div>

            <!-- 错误标记：碎心动画 -->
            <div class="cell-content" v-else-if="cell.state === 'wrong-anim'">
              <img :src="IMG.heart_empty" class="cell-emoji pencil-icon animate-shake" style="object-fit:contain" />
            </div>

            <!-- 错误标记：红色胖叉 -->
            <div class="cell-content" v-else-if="cell.state === 'wrong'">
              <div class="chubby-cross red animate-dropIn"></div>
            </div>

            <!-- X 排除标记：白色胖叉 -->
            <div class="cell-content" v-else-if="cell.state === 'marked'">
              <div class="chubby-cross white"></div>
            </div>

          </div>
        </div>
      </div>

      <!-- 教程引导：手指 + 光圈浮动层 -->
      <div class="tut-float-layer" v-if="tutShowFingerAnim && tutFingerPos"
           :style="tutFingerStyle">
        <div class="tut-circle"></div>
        <div class="tut-finger">
          <img class="tut-finger-img" :src="IMG.tap_2" style="object-fit:contain" />
        </div>
      </div>

      <!-- 教程"明白了"按钮浮动层 -->
      <div class="tut-mid-overlay" v-if="tutShowConfirmBtn" :style="tutMidStyle">
        <div class="tut-confirm-btn pulse-hint-btn" @click="onTutConfirm">
          <span>{{t('game.tutorial_got_it')}}</span>
        </div>
        <div class="tut-confirm-finger">
          <img :src="IMG.tap_2" style="object-fit:contain" class="tut-confirm-finger-img" />
        </div>
      </div>

      <!-- 教程操作提示文字浮动层 -->
      <div class="tut-mid-overlay" v-if="isTutorial && !tutShowConfirmBtn && tutTextBottomNodes && (tutStep === 4 || tutStep === 5)"
           :style="tutMidStyle">
        <div class="tut-mid-text-box">
          <span v-html="renderRichText(tutTextBottomNodes)"></span>
        </div>
      </div>

      <div class="tut-bottom-abs" v-if="isTutorial && !tutShowConfirmBtn && (tutStep === 6 || tutStep === 7) && tutTextBottomNodes">
        <div class="tut-text-box-flow bottom-flow animate-riseUp">
          <span v-html="renderRichText(tutTextBottomNodes)"></span>
        </div>
      </div>
    </div>

    <!-- 进度指示 -->
    <div class="progress-bar" v-if="!isTutorial">
      <span class="progress-text">{{t('game.progress_found', {found: foundCount, total: totalStars, skinName: t(skinData.nameKey)})}}</span>
      <div class="progress-track">
        <div class="progress-fill" :style="{width: progressPercent + '%'}"></div>
      </div>
    </div>

  </div>

  <div class="bottom-area" v-if="pageReady">
    <!-- 局内提示沉浸面板 -->
    <div class="hint-panel-overlay animate-riseUp" v-if="activeHint">
      <div class="hint-text-area">
        <span class="hint-reason-text">{{activeHint.text}}</span>
      </div>
      <div class="hint-action-btn pulse-hint-btn" @click="onApplyHint">
        <span>{{activeHint.btnText}}</span>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div class="bottom-bar" v-if="!isTutorial">
      <div class="tool-btn" @click="onPlaceOne">
        <img :src="skinData.icon" class="tool-icon" style="object-fit:contain" />
        <span class="tool-name">{{t('game.tool_place_one')}}</span>
        <span class="tool-count">{{placeOneCount}}</span>
        <div class="tool-plus" @click.stop="onOpenBuyPlaceOne">+</div>
      </div>
      <div class="tool-btn" @click="onHint">
        <img :src="IMG.hint" class="tool-icon pencil-icon" style="object-fit:contain" />
        <span class="tool-name">{{t('game.tool_hint')}}</span>
        <span class="tool-count">{{hintCount}}</span>
        <div class="tool-plus" @click.stop="buyHintCount=1;showBuyHint=true">+</div>
      </div>
      <div class="tool-btn" @click="onClearAll">
        <img :src="IMG.clear" class="tool-icon pencil-icon" style="object-fit:contain" />
        <span class="tool-name">{{t('game.tool_clear')}}</span>
        <span class="tool-count"></span>
      </div>
    </div>
  </div>

  <!-- 教程 UI 悬浮层 -->
  <div class="tut-overlay" v-if="isTutorial">
    <div class="tut-arrow-hint" v-if="showTutArrowHint">
      <div class="arrow-bounce">⬇</div>
    </div>
  </div>

  <!-- ========== 设置弹窗 ========== -->
  <div class="modal-overlay" v-if="showSettings" @click="onCloseSettings">
    <div class="settings-card" @click.stop="preventBubble">
      <span class="settings-title">{{t('game.settings_title')}}</span>
      <div class="settings-item">
        <img :src="IMG.music" class="settings-icon pencil-icon" style="object-fit:contain" />
        <span class="settings-label">{{t('game.settings_music')}}</span>
        <input type="checkbox" class="switch-input" :checked="musicOn" @change="onToggleMusic" />
      </div>
      <div class="settings-item">
        <img :src="IMG.sound" class="settings-icon pencil-icon" style="object-fit:contain" />
        <span class="settings-label">{{t('game.settings_sound')}}</span>
        <input type="checkbox" class="switch-input" :checked="soundOn" @change="onToggleSound" />
      </div>
      <div class="settings-item">
        <img :src="IMG.vibrate" class="settings-icon pencil-icon" style="object-fit:contain" />
        <span class="settings-label">{{t('game.settings_vibrate')}}</span>
        <input type="checkbox" class="switch-input" :checked="vibrateOn" @change="onToggleVibrate" />
      </div>
      <div style="display:flex;gap:3vw;width:100%;margin-top:4.8vw;">
        <div class="settings-continue-btn" @click="onCloseSettings" style="flex:1;">
          <span class="settings-continue-text">{{t('game.continue_game')}}</span>
        </div>
        <div class="settings-exit-btn" @click="onExitGame" style="flex:1;">
          <span class="settings-exit-text">{{t('game.exit_level')}}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ========== 过关/失败弹窗 ========== -->
  <div class="modal-overlay" v-if="showResult" @click="preventBubble">
    <div class="modal-card animate-bounceIn" v-if="!(isWin && (mode === 'daily' || mode === 'survival'))">

      <!-- ========== 胜利 ========== -->
      <div v-if="isWin">

        <!-- 全屏飘落大彩纸 -->
        <div class="confetti-container">
          <div v-for="(cp, idx) in confettiPieces" :key="'c'+idx" class="confetti-piece" :style="cp"></div>
        </div>

        <!-- 礼炮 -->
        <div class="cannon-container">
          <div v-for="i in 12" :key="'cl'+i" :class="'cannon-particle cp-l'+i"></div>
          <div v-for="i in 12" :key="'cr'+i" :class="'cannon-particle cp-r'+i"></div>
        </div>

        <!-- 庆祝文字 -->
        <div class="celebrate-text">{{t('game.win_text')}}</div>

        <!-- 当前皮肤动物跳舞庆祝 -->
        <div class="celebrate-animal">
          <template v-if="skinData.dailyAnimationType === 'walk'">
            <div class="logo-crab-dance" style="width:100%;height:100%;">
              <img class="logo-frame-1" :src="skinData.dailyImage" style="object-fit:contain" />
              <img class="logo-frame-2" :src="IMG.crab_walk_2" style="object-fit:contain" />
            </div>
          </template>
          <template v-else-if="skinData.dailyAnimationType === 'fly'">
            <div class="animate-fly" style="width:100%;height:100%;">
              <div class="animate-fly-bounce" style="width:100%;height:100%;">
                <img class="walk-frame-1" :src="skinData.dailyImage" style="object-fit:contain" />
                <img class="walk-frame-2" :src="skinData.dailyImage2" style="object-fit:contain" />
              </div>
            </div>
          </template>
          <template v-else-if="skinData.dailyAnimationType === 'swim'">
            <div class="animate-swim" style="width:100%;height:100%;">
              <div class="animate-swim-bounce" style="width:100%;height:100%;">
                <img class="swim-frame-squat" :src="skinData.dailyImage" style="object-fit:contain" />
                <img class="swim-frame-fly" :src="skinData.dailyImage2" style="object-fit:contain" />
              </div>
            </div>
          </template>
          <template v-else-if="skinData.dailyAnimationType === 'stumble'">
            <div class="animate-stumble" style="width:100%;height:100%;">
              <img class="stumble-frame-walk" :src="skinData.dailyImage" style="object-fit:contain" />
              <img class="stumble-frame-fall" :src="skinData.dailyImage2" style="object-fit:contain" />
            </div>
          </template>
          <template v-else-if="skinData.dailyAnimationType === 'soar-flap'">
            <div class="animate-soar" style="width:100%;height:100%;">
              <div class="soar-wave" style="width:100%;height:100%;">
                <img class="soar-frame-up" :src="skinData.dailyImage" style="object-fit:contain" />
                <img class="soar-frame-down" :src="skinData.dailyImage2" style="object-fit:contain" />
              </div>
            </div>
          </template>
          <template v-else-if="skinData.dailyAnimationType === 'hop'">
            <div class="animate-hop" style="width:100%;height:100%;">
              <div class="hop-bounce" style="width:100%;height:100%;">
                <img class="hop-frame-squat" :src="skinData.dailyImage" style="object-fit:contain" />
                <img class="hop-frame-jump" :src="skinData.dailyImage2" style="object-fit:contain" />
              </div>
            </div>
          </template>
          <template v-else-if="skinData.dailyAnimationType === 'chirp'">
            <div class="animate-chirp" style="width:100%;height:100%;">
              <div class="chirp-sway" style="width:100%;height:100%;">
                <img class="chirp-frame-closed" :src="skinData.dailyImage" style="object-fit:contain" />
                <img class="chirp-frame-open" :src="skinData.dailyImage2" style="object-fit:contain" />
              </div>
            </div>
          </template>
          <template v-else>
            <img class="animate-roll" style="width:100%;height:100%;object-fit:contain;" :src="skinData.dailyImage" />
          </template>
        </div>

        <!-- 生存模式胜利结算 -->
        <template v-if="mode === 'survival'">
          <div class="survival-win-badge">
            <span class="survival-win-text">{{t('game.survival_all_passed')}}</span>
          </div>
          <div class="daily-reward-row">
            <div class="daily-reward-item">
              <img :src="IMG.coin" style="width:6.667vw;height:6.667vw;" />
              <span class="daily-reward-text">+{{rewardCoins}}</span>
            </div>
            <div class="daily-reward-item">
              <img :src="IMG.shell" style="width:6.667vw;height:6.667vw;" />
              <span class="daily-reward-text">+{{survivalRewardShells}}</span>
            </div>
          </div>
          <div class="win-actions-row">
            <button class="btn-home-icon" @click="onGoHome">
              <img :src="IMG.home" style="width:13.333vw;height:13.333vw;" />
            </button>
            <button class="btn-ad-boost-short pulse-wrapper" @click="onWatchAdBoost" v-if="!adBoosted">
              <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner pulse-corner" style="object-fit:contain" />
              <div style="display:flex;align-items:center;justify-content:center;">
                <img :src="IMG.coin" style="width:6.933vw;height:6.933vw;margin-right:1.6vw;" />
                <span style="color:#fff;font-weight:800;font-size:5.6vw;">× 5</span>
              </div>
            </button>
            <div class="ad-boosted-tag-short" v-if="adBoosted">
              <img :src="IMG.check" style="width:4.8vw;height:4.8vw;margin-right:1.067vw;vertical-align:middle;" />
              <span>{{t('game.ad_boosted')}}</span>
            </div>
          </div>
        </template>

        <!-- 普通模式胜利结算 -->
        <template v-else>
          <div class="reward-row" style="margin-top:1.333vw;margin-bottom:4vw;position:relative;">
            <img :src="IMG.coin" style="width:6.667vw;height:6.667vw;display:inline-block;vertical-align:middle;" />
            <span class="reward-text"> +{{adBoosted ? boostedCoins : rewardCoins}} </span>
            <div class="flying-coins" v-if="showFlyingCoins">
              <img v-for="fc in flyingCoinsArray" :key="fc" class="fly-coin" :style="{animationDelay: fc * 0.1 + 's'}" :src="IMG.coin" style="object-fit:contain" />
            </div>
          </div>
          <div class="win-actions-row" v-if="!(isTutorial || (mode === 'normal' && level === 1))">
            <button class="btn-home-icon" @click="onGoHome">
              <img :src="IMG.home" style="width:13.333vw;height:13.333vw;" />
            </button>
            <button class="btn-ad-boost-short pulse-wrapper" @click="onWatchAdBoost" v-if="isFirstClear && !adBoosted">
              <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner pulse-corner" style="object-fit:contain" />
              <div style="display:flex;align-items:center;justify-content:center;">
                <img :src="IMG.coin" style="width:6.933vw;height:6.933vw;margin-right:1.6vw;" />
                <span style="color:#fff;font-weight:800;font-size:5.6vw;">× 5</span>
              </div>
            </button>
            <div class="ad-boosted-tag-short" v-if="isFirstClear && adBoosted">
              <img :src="IMG.check" style="width:4.8vw;height:4.8vw;margin-right:1.067vw;vertical-align:middle;" />
              <span>{{t('game.ad_boosted')}}</span>
            </div>
          </div>
          <div class="win-bottom-actions">
            <button class="btn-share-icon" @click="share" v-if="!(isTutorial || (mode === 'normal' && level === 1))">
              <img :src="IMG.share_filled" style="width:8vw;height:8vw;" />
            </button>
            <button class="btn-next-level-short animate-pulse-btn" @click="onNextLevel" :style="(isTutorial || (mode === 'normal' && level === 1)) ? 'width:100%' : ''">
              <span>{{t('game.next_level')}}</span>
            </button>
          </div>
        </template>
      </div>

      <!-- ========== 失败 ========== -->
      <div v-else>
        <img class="result-emoji pencil-icon" :src="IMG.face_lose" style="object-fit:contain" />
        <span class="result-title">{{t('game.challenge_failed')}}</span>
        <span class="result-desc" v-if="mode === 'daily'">{{t('game.fail_daily')}}</span>
        <span class="result-desc" v-else-if="mode === 'normal'">{{t(skinData.failTextKey)}}</span>
        <span class="result-desc" v-else>{{t(skinData.failTextKey)}}</span>

        <div class="result-desc" v-if="mode === 'normal' || mode === 'daily'" style="margin-top:-2.133vw;margin-bottom:3.2vw;color:#FF6B6B;font-weight:bold;">
          {{t('game.fail_remaining', {count: totalStars - foundCount})}}
        </div>

        <div class="daily-r5-reward" v-if="mode === 'daily' && dailyFailRewardShells > 0" style="margin-top:1vw;margin-bottom:2vw;">
          <div class="r5-reward-box"><img :src="IMG.shell" class="r5-icon" style="object-fit:contain" /><span class="r5-txt cyan">+{{dailyFailRewardShells}}</span></div>
        </div>

        <div class="modal-buttons">
          <button class="btn-secondary" @click="onGoHome"><span>{{t('game.home')}}</span></button>

          <!-- 每日挑战失败 -->
          <template v-if="mode === 'daily'">
            <button class="btn-primary pulse-wrapper" @click="onDailyRevive" v-if="!dailyRevived">
              <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner pulse-corner" style="object-fit:contain" />
              <span style="font-size:5.067vw;letter-spacing:0.533vw;">{{t('game.revive')}}</span>
            </button>
            <button class="btn-primary pulse-wrapper" @click="onDailyRetry" v-if="dailyRevived">
              <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner pulse-corner" style="object-fit:contain" />
              <span style="font-size:5.067vw;letter-spacing:0.533vw;">{{t('game.retry')}}</span>
            </button>
          </template>

          <!-- 普通模式失败 -->
          <template v-if="mode === 'normal'">
            <button class="btn-primary" @click="onShareNormalRevive" v-if="canShareRevive">
              <img :src="IMG.share_filled" class="btn-icon" style="object-fit:contain" />
              <span>{{t('game.share_revive', {round: 1 - shareReviveRoundCount, daily: 4 - shareReviveDailyCount})}}</span>
            </button>
            <button class="btn-primary pulse-wrapper" @click="onNormalRevive">
              <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner pulse-corner" style="object-fit:contain" />
              <span style="font-size:5.067vw;letter-spacing:0.533vw;">{{t('game.watch_ad_revive')}}</span>
            </button>
            <button class="btn-primary" @click="onRetry">
              <div style="display:flex;align-items:center;justify-content:center;gap:1.067vw;">
                <span style="font-size:5.067vw;letter-spacing:0.533vw;">{{t('game.retry')}}</span>
                <img :src="IMG.shell" style="width:5.333vw;height:5.333vw;" />
                <span style="font-size:4.533vw;font-weight:bold;">-1</span>
              </div>
            </button>
          </template>
        </div>
      </div>

    </div>

    <!-- ========== 每日挑战成功 - 满屏沉浸 ========== -->
    <div class="daily-result-page animate-fadeIn" v-if="isWin && mode === 'daily'">
      <div class="daily-top-row">
        <div class="daily-r1-home" @click="onGoHome">
          <img :src="IMG.home" style="width:11.2vw;height:11.2vw;" />
        </div>
        <div class="asset-item" @click="onBuyShells">
          <img class="asset-icon" :src="IMG.shell" style="object-fit:contain" />
          <span v-if="isInfinitePlay" class="infinite-energy-value"><strong>∞</strong><span>{{infiniteTimeDisplay}}</span></span>
            <span v-else class="asset-value">{{shellsDisplay}}</span>
          <div class="bonus-badge" v-if="bonusShells > 0">{{bonusShells}}</div>
          <div class="asset-plus">+</div>
        </div>
      </div>
      <div class="daily-r3-title text-shadow"><span>{{t('game.daily_success')}}</span></div>

      <div class="daily-r4-anim">
        <!-- 彩纸 -->
        <div class="confetti-container">
          <div v-for="(cp, idx) in confettiPieces" :key="'dc'+idx" class="confetti-piece" :style="cp"></div>
        </div>
        <!-- 礼炮 -->
        <div class="cannon-container">
          <div v-for="i in 12" :key="'dcl'+i" :class="'cannon-particle cp-l'+i"></div>
          <div v-for="i in 12" :key="'dcr'+i" :class="'cannon-particle cp-r'+i"></div>
        </div>

        <!-- 皮肤动物跳舞 -->
        <div class="celebrate-animal" style="width:34.667vw;height:34.667vw;">
          <template v-if="skinData.dailyAnimationType === 'walk'">
            <div class="logo-crab-dance" style="width:100%;height:100%;"><img class="logo-frame-1" :src="skinData.dailyImage" style="object-fit:contain" /><img class="logo-frame-2" :src="IMG.crab_walk_2" style="object-fit:contain" /></div>
          </template>
          <template v-else-if="skinData.dailyAnimationType === 'fly'">
            <div class="animate-fly" style="width:100%;height:100%;"><div class="animate-fly-bounce" style="width:100%;height:100%;"><img class="walk-frame-1" :src="skinData.dailyImage" style="object-fit:contain" /><img class="walk-frame-2" :src="skinData.dailyImage2" style="object-fit:contain" /></div></div>
          </template>
          <template v-else-if="skinData.dailyAnimationType === 'swim'">
            <div class="animate-swim" style="width:100%;height:100%;"><div class="animate-swim-bounce" style="width:100%;height:100%;"><img class="swim-frame-squat" :src="skinData.dailyImage" style="object-fit:contain" /><img class="swim-frame-fly" :src="skinData.dailyImage2" style="object-fit:contain" /></div></div>
          </template>
          <template v-else-if="skinData.dailyAnimationType === 'stumble'">
            <div class="animate-stumble" style="width:100%;height:100%;"><img class="stumble-frame-walk" :src="skinData.dailyImage" style="object-fit:contain" /><img class="stumble-frame-fall" :src="skinData.dailyImage2" style="object-fit:contain" /></div>
          </template>
          <template v-else-if="skinData.dailyAnimationType === 'soar-flap'">
            <div class="animate-soar" style="width:100%;height:100%;"><div class="soar-wave" style="width:100%;height:100%;"><img class="soar-frame-up" :src="skinData.dailyImage" style="object-fit:contain" /><img class="soar-frame-down" :src="skinData.dailyImage2" style="object-fit:contain" /></div></div>
          </template>
          <template v-else-if="skinData.dailyAnimationType === 'hop'">
            <div class="animate-hop" style="width:100%;height:100%;"><div class="hop-bounce" style="width:100%;height:100%;"><img class="hop-frame-squat" :src="skinData.dailyImage" style="object-fit:contain" /><img class="hop-frame-jump" :src="skinData.dailyImage2" style="object-fit:contain" /></div></div>
          </template>
          <template v-else-if="skinData.dailyAnimationType === 'chirp'">
            <div class="animate-chirp" style="width:100%;height:100%;"><div class="chirp-sway" style="width:100%;height:100%;"><img class="chirp-frame-closed" :src="skinData.dailyImage" style="object-fit:contain" /><img class="chirp-frame-open" :src="skinData.dailyImage2" style="object-fit:contain" /></div></div>
          </template>
          <template v-else>
            <img class="animate-roll" style="width:100%;height:100%;object-fit:contain;" :src="skinData.dailyImage" />
          </template>
        </div>
      </div>

      <div class="daily-r5-reward">
        <div class="r5-reward-box"><img :src="IMG.coin" class="r5-icon" style="object-fit:contain" /><span class="r5-txt yellow">+10</span></div>
        <div class="r5-reward-box" style="margin-left:5.333vw;"><img :src="IMG.shell" class="r5-icon" style="object-fit:contain" /><span class="r5-txt cyan">+{{dailyRewardShells}}</span></div>
      </div>
      <div class="daily-r6-time">
        <span style="color:rgba(44,95,124,0.8);align-self:flex-end;padding-bottom:0.8vw;font-size:4vw;">{{t('game.time_spent')}}</span>
        <span style="font-size:7.467vw;color:#FF6B6B;">{{dailyTimeText}}</span>
      </div>
      <div class="daily-r7-rank">
        <span>{{t('game.daily_rank', {rank: dailyRank})}}</span>
      </div>

      <button class="daily-r8-ad-btn animate-pulse-btn" @click="onWatchDailyAd" v-if="!adBoosted">
        <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner pulse-corner" style="object-fit:contain" />
        <div class="r8-ad-inner"><span class="r8-btn-txt">{{t('game.double_stamina')}}</span><span class="r8-btn-sub">{{t('game.double_stamina_sub')}}</span></div>
      </button>
      <div class="daily-r8-boosted" v-if="adBoosted">
        <img class="pencil-icon" :src="IMG.check" style="width:3.733vw;height:3.733vw;margin-right:1.067vw;vertical-align:middle;" />
        <span>{{t('game.stamina_doubled')}}</span>
      </div>

      <div class="win-bottom-actions" style="width:74.667vw;margin:5.333vw auto 3.2vw auto;padding:0;">
        <button class="btn-share-icon" @click="share"><img :src="IMG.share_filled" style="width:8vw;height:8vw;" /></button>
        <button class="btn-next-level-short" @click="onGoHome"><span>{{t('game.continue_playing')}}</span></button>
      </div>

      <div class="daily-r10-streak">
        <div class="streak-laurel streak-laurel-l">❦</div>
        <div class="streak-center">
          <span class="streak-label">{{t('game.streak_label')}}</span>
          <span class="rank-hl">{{dailyConsecutiveDays}}</span>
          <span class="streak-label">{{t('game.streak_days')}}</span>
        </div>
        <div class="streak-laurel streak-laurel-r">❦</div>
      </div>
    </div>

    <!-- ========== 生存模式结算 ========== -->
    <div class="daily-result-page animate-fadeIn" v-if="showResult && mode === 'survival'">
      <div class="daily-top-row">
        <div class="daily-r1-home" @click="onGoHome"><img :src="IMG.home" style="width:11.2vw;height:11.2vw;" /></div>
        <div class="asset-item" @click="onBuyShells">
          <img class="asset-icon" :src="IMG.shell" style="object-fit:contain" />
          <span v-if="isInfinitePlay" class="infinite-energy-value"><strong>∞</strong><span>{{infiniteTimeDisplay}}</span></span>
            <span v-else class="asset-value">{{shellsDisplay}}</span>
          <div class="bonus-badge" v-if="bonusShells > 0">{{bonusShells}}</div>
          <div class="asset-plus">+</div>
        </div>
      </div>

      <template v-if="isWin">
        <!-- 通关版本 -->
        <div class="confetti-container">
          <div v-for="(cp, idx) in confettiPieces" :key="'sc'+idx" class="confetti-piece" :style="cp"></div>
        </div>
        <div class="survival-record survival-complete-record glow-gold">
          <span>{{t(survivalSettlementType === 'beyond_ten' ? 'game.survival_beyond_ten' : 'game.survival_complete')}}</span>
        </div>
        <div class="survival-title survival-complete-title">
          <template v-if="survivalSettlementType === 'beyond_ten'">
            <span>{{t('game.survival_beyond_ten_text')}}</span>
          </template>
          <template v-else>
            <span>{{t('game.survival_complete_before')}}</span>
            <span class="red-text survival-round-number">{{survivalTotalRounds}}</span>
            <span>{{t('game.survival_complete_after')}}</span>
          </template>
        </div>
        <div class="survival-crabs"><img class="small-crab-icon" :src="skinData.icon" style="object-fit:contain" /><span>{{t('game.survival_found', {count: survivalCrabsFound, skinName: t(skinData.nameKey)})}}</span></div>
        <div class="survival-time"><span>{{t('game.time_spent')}}</span><span class="red-text">{{survivalTimeText}}</span></div>
        <div class="daily-r5-reward" style="margin-top:5.333vw;margin-bottom:5.333vw;">
          <div class="r5-reward-box"><img :src="IMG.coin" class="r5-icon" style="object-fit:contain" /><span class="r5-txt yellow">+20</span></div>
          <div class="r5-reward-box" style="margin-left:5.333vw;"><img :src="IMG.shell" class="r5-icon" style="object-fit:contain" /><span class="r5-txt cyan">+4</span></div>
        </div>
        <div class="win-bottom-actions" style="width:77.333vw;margin:0 auto 3.2vw auto;padding:0;">
          <button class="btn-share-icon" @click="share"><img :src="IMG.share_filled" style="width:8vw;height:8vw;" /></button>
          <button class="btn-ad-boost-short animate-pulse-btn" @click="onSurvivalDoubleRewards" v-if="!survivalRewardDoubled && survivalRewardShells > 0" style="flex:1;margin:0;background:linear-gradient(135deg,#4A90E2,#9E58FF);">
            <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner pulse-corner" style="object-fit:contain" />
            <span style="font-size:5.067vw;color:#fff;font-weight:800;">{{t('game.double_stamina')}}</span>
          </button>
          <button class="btn-ad-boost-short" v-if="survivalRewardDoubled" style="flex:1;margin:0;background:rgba(74,144,226,0.5);">
            <img :src="IMG.check" style="width:4.8vw;height:4.8vw;margin-right:1.067vw;" /><span>{{t('game.already_doubled')}}</span>
          </button>
        </div>
        <div class="win-bottom-actions" style="width:77.333vw;margin:0 auto;padding:0;">
          <button class="btn-next-level-short animate-pulse-btn" @click="onGoHome" style="width:100%;margin:0;">
            <span>{{t('game.continue_playing')}}</span>
          </button>
        </div>
      </template>

      <template v-else>
        <!-- 没通关版本：只显示是否超过10关，不暴露最终关数 -->
        <div class="survival-title">
          <span>{{t(survivalRound > 10 ? 'game.survival_beyond_ten_failed' : 'game.survival_not_reached')}}</span>
        </div>
        <div class="survival-record glow-silver"><span>{{t('game.level_settlement')}}</span></div>
        <div class="survival-crabs"><img class="small-crab-icon" :src="skinData.icon" style="object-fit:contain" /><span>{{t('game.survival_found', {count: survivalCrabsFound, skinName: t(skinData.nameKey)})}}</span></div>
        <div class="survival-stat-text"><span>{{t('game.survival_rounds', {round: survivalRound})}}</span></div>
        <div class="survival-stat-text"><span>{{t('game.time_spent')}}</span><span class="red-text">{{survivalTimeText}}</span></div>
        <div class="daily-r5-reward" style="margin-top:5.333vw;margin-bottom:5.333vw;" v-if="survivalRewardShells > 0">
          <div class="r5-reward-box"><img :src="IMG.shell" class="r5-icon" style="object-fit:contain" /><span class="r5-txt cyan">+{{survivalRewardShells}}</span></div>
        </div>
        <div style="width:74.667vw;margin-bottom:3.2vw;" v-if="!survivalRevived">
          <button class="daily-r8-ad-btn animate-pulse-btn" @click="onSurvivalRevive" style="width:100%;background:linear-gradient(135deg,#10B981,#34D399);">
            <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner" style="object-fit:contain" />
            <div class="r8-ad-inner"><span class="r8-btn-txt" style="font-size:5.067vw;">{{t('game.revive_continue')}}</span><span class="r8-btn-sub">{{t('game.revive_sub')}}</span></div>
          </button>
        </div>
        <div style="width:74.667vw;margin-bottom:3.2vw;">
          <button class="daily-r8-ad-btn animate-pulse-btn" @click="onSurvivalRetryFree" style="width:100%;">
            <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner" style="object-fit:contain" v-if="!survivalHasFreeRemain" />
            <div class="r8-ad-inner"><span class="r8-btn-txt" style="font-size:5.067vw;">{{t('game.restart_challenge')}}</span><span class="r8-btn-sub">{{t('game.restart_sub')}}</span></div>
          </button>
        </div>
        <div style="width:74.667vw;margin-bottom:3.2vw;">
          <button class="daily-r8-ad-btn animate-pulse-btn" @click="onSurvivalDoubleRewards" v-if="!survivalRewardDoubled && survivalRewardShells > 0" style="width:100%;">
            <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner" style="object-fit:contain" />
            <div class="r8-ad-inner"><span class="r8-btn-txt" style="font-size:5.067vw;">{{t('game.double_stamina')}}</span><span class="r8-btn-sub">{{t('game.double_stamina_sub')}}</span></div>
          </button>
          <div class="daily-r8-boosted" v-if="survivalRewardDoubled" style="justify-content:center;">
            <img :src="IMG.check" style="width:3.733vw;height:3.733vw;margin-right:1.067vw;vertical-align:middle;" /><span>{{t('game.ad_boosted')}}</span>
          </div>
        </div>
      </template>
    </div>

  </div>

  <!-- ========== 道具消耗/获得动画浮层 ========== -->
  <div class="reward-anim-overlay" v-if="showRewardAnim">
    <div class="reward-anim-center">
      <div class="reward-anim-icons">
        <img class="reward-anim-icon" v-for="(ic, idx) in rewardAnimIcons" :key="idx" :src="ic" style="object-fit:contain" />
      </div>
      <span class="reward-anim-text">{{rewardAnimText}}</span>
    </div>
    <div class="reward-particles">
      <img v-for="p in rewardAnimParticles" :key="p.id"
           :class="'reward-particle rp-' + p.id"
           :style="{animationDelay: p.delay + 's'}"
           :src="rewardAnimIcon" style="object-fit:contain" />
    </div>
  </div>

  <!-- ========== 购买「放一只」弹窗 ========== -->
  <div class="modal-overlay" v-if="showBuyPlaceOne" @click="showBuyPlaceOne = false">
    <div class="exchange-card" @click.stop>
      <span class="exchange-title">{{t('game.buy_place_title')}}</span>
      <div class="exchange-rate">
        <img class="exchange-icon" :src="IMG.coin" style="object-fit:contain" />
        <span class="exchange-text">50 = </span>
        <img class="exchange-icon" :src="skinData.icon" style="object-fit:contain" />
        <span class="exchange-text">1</span>
      </div>
      <div class="exchange-row">
        <span class="exchange-label">{{t('game.buy_quantity')}}</span>
        <div class="exchange-stepper">
          <div class="stepper-btn" @click="buyPlaceOneCount > 1 && buyPlaceOneCount--">-</div>
          <span class="stepper-value">{{buyPlaceOneCount}}</span>
          <div class="stepper-btn" @click="onBuyPlaceOnePlus">+</div>
        </div>
      </div>
      <span class="exchange-cost">{{t('game.cost_coins', {cost: buyPlaceOneCount * 50})}}</span>
      <div class="exchange-btn" @click="onConfirmBuyPlaceOne">{{t('game.confirm_purchase')}}</div>
      <div class="exchange-btn" :style="{marginTop: '2vw', background: 'linear-gradient(135deg,#4A90E2,#9E58FF)', opacity: placeOneAdRemain > 0 ? 1 : 0.55, pointerEvents: placeOneAdRemain > 0 ? 'auto' : 'none'}" @click="onWatchAdForPlaceOne">
        <img :src="IMG.ad_icon_clean" style="width:5vw;height:5vw;margin-right:1.5vw;vertical-align:middle;object-fit:contain" />
        <span>{{placeOneAdRemain > 0 ? t('game.watch_ad_place_one') : t('game.daily_limit')}}</span>
      </div>
      <span class="coin-ad-footer">{{t('game.place_one_daily_remaining', {remain: placeOneAdRemain})}}</span>
    </div>
  </div>

  <!-- ========== 购买「提示」弹窗 ========== -->
  <div class="modal-overlay" v-if="showBuyHint" @click="showBuyHint = false">
    <div class="exchange-card" @click.stop>
      <span class="exchange-title">{{t('game.buy_hint_title')}}</span>
      <div class="exchange-rate">
        <img class="exchange-icon" :src="IMG.coin" style="object-fit:contain" />
        <span class="exchange-text">30 = </span>
        <img class="exchange-icon" :src="IMG.hint" style="object-fit:contain" />
        <span class="exchange-text">1</span>
      </div>
      <div class="exchange-row">
        <span class="exchange-label">{{t('game.buy_quantity')}}</span>
        <div class="exchange-stepper">
          <div class="stepper-btn" @click="buyHintCount > 1 && buyHintCount--">-</div>
          <span class="stepper-value">{{buyHintCount}}</span>
          <div class="stepper-btn" @click="onBuyHintPlus">+</div>
        </div>
      </div>
      <span class="exchange-cost">{{t('game.cost_coins', {cost: buyHintCount * 30})}}</span>
      <div class="exchange-btn" @click="onConfirmBuyHint">{{t('game.confirm_purchase')}}</div>
      <div class="exchange-btn" style="margin-top:2vw;background:linear-gradient(135deg,#4A90E2,#9E58FF);" @click="onShareForHint" v-if="canShareHint">
        <img :src="IMG.share_filled" style="width:5vw;height:5vw;margin-right:1.5vw;vertical-align:middle;object-fit:contain" />
        <span>{{t('game.share_hint', {daily: 2 - shareHintDailyCount})}}</span>
      </div>
      <div class="exchange-btn" style="margin-top:2vw;background:linear-gradient(135deg,#4A90E2,#9E58FF);" @click="onWatchAdForHint">
        <img :src="IMG.ad_icon_clean" style="width:5vw;height:5vw;margin-right:1.5vw;vertical-align:middle;object-fit:contain" />
        <span>{{t('game.watch_ad_hint')}}</span>
      </div>
    </div>
  </div>

  <!-- ========== 赚金币弹窗 ========== -->
  <div class="modal-overlay" v-if="showCoinAd" @click="onCloseCoinAd">
    <div class="exchange-card recharge-card" @click.stop="preventBubble">
      <span class="exchange-title">{{t('game.earn_coins')}}</span>
      <div class="coin-ad-banner">
        <div class="coin-ad-icons">
          <img :src="IMG.coin" class="coin-ad-coin-icon" style="object-fit:contain" />
          <span class="coin-ad-amount">+30</span>
        </div>
        <span class="coin-ad-desc">{{t('game.earn_coins_desc')}}</span>
      </div>
      <div class="coin-ad-btn-wrapper">
        <button class="coin-ad-btn pulse-wrapper" @click="onWatchCoinAd" :disabled="coinAdRemain <= 0">
          <img :src="IMG.ad_icon_clean" class="btn-ad-icon-corner pulse-corner" style="object-fit:contain" />
          <span>{{coinAdRemain > 0 ? t('game.watch_ad_earn') : t('game.daily_limit')}}</span>
        </button>
      </div>
      <span class="coin-ad-footer">{{t('game.daily_remaining', {remain: coinAdRemain})}}</span>
    </div>
  </div>

  <!-- ========== 金币兑换贝壳弹窗 ========== -->
  <div class="modal-overlay" v-if="showShellExchange" @click="onCloseShellExchange">
    <div class="exchange-card" @click.stop="preventBubble">
      <span class="exchange-title">{{t('game.exchange_title')}}</span>
      <div class="exchange-rate">
        <img class="exchange-icon" :src="IMG.coin" style="object-fit:contain" />
        <span class="exchange-text">20 = </span>
        <img class="exchange-icon" :src="IMG.shell" style="object-fit:contain" />
        <span class="exchange-text">1</span>
      </div>
      <div class="exchange-row">
        <span class="exchange-label">{{t('game.buy_quantity')}}</span>
        <div class="exchange-stepper">
          <div class="stepper-btn" @click="onShellMinus">-</div>
          <span class="stepper-value">{{exchangeCount}}</span>
          <div class="stepper-btn" @click="onShellPlus">+</div>
        </div>
      </div>
      <span class="exchange-cost">{{t('game.cost_coins', {cost: exchangeCount * 20})}}</span>
      <div class="exchange-btn" @click="onConfirmExchange">{{t('game.confirm_exchange')}}</div>
    </div>
  </div>

</div>
  `,

  data() {
    return {
      // 图片资源常量引用
      IMG: IMG,

      // 游戏模式: 'normal' | 'daily' | 'survival'
      mode: 'normal',
      // 教程专用
      isTutorial: false,
      tutStep: 0,
      tutHighlightCells: [],
      tutTextNodes: null,
      tutTextBottomNodes: null,
      tutShowConfirmBtn: false,
      tutShowFingerAnim: false,
      tutFingerPos: null,
      showTutArrowHint: false,

      // 关卡信息
      level: 1,
      size: 6,
      starsPerUnit: 1,
      totalStars: 0,
      foundCount: 0,
      progressPercent: 0,

      // 生命
      hearts: 3,
      maxHearts: 3,
      errors: 0,

      // 网格数据
      gridData: [],
      cellSize: 0,
      pageReady: false,

      // 金币
      coins: 0,

      // 道具
      placeOneCount: 0,
      hintCount: 0,

      // 交互提示
      showRuleHint: true,
      ruleAnimActive: false,
      showResult: false,
      isWin: false,
      starRating: 0,
      rewardCoins: 0,

      // 广告翻倍
      adBoosted: false,
      boostedCoins: 0,
      isFirstClear: false,

      // 每日挑战专用
      timeRemaining: 180,
      maxTime: 180,
      timeBonusText: '',
      timeBonusType: '',
      showTimeBonus: false,
      dailyRank: 0,
      dailyRevived: false,
      dailyRewardShells: 2,
      dailyFailRewardShells: 0,
      dailyDate: '',
      dailyStartTs: 0,
      dailyTimeText: '',
      dailyConsecutiveDays: 1,
      shells: 0,
      maxShells: 0,
      shellsDisplay: '6/6',
      isInfinitePlay: false,
      infiniteTimeDisplay: '00:00',
      bonusShells: 0,

      // 生存模式专用
      survivalRound: 1,
      survivalTotalRounds: GameConfig.SURVIVAL_TOTAL_ROUNDS,
      survivalMilestones: GameConfig.SURVIVAL_MILESTONES,
      survivalRevived: false,
      survivalRewardCoins: 20,
      survivalRewardShells: 4,
      survivalCrabsFound: 0,
      survivalRewardDoubled: false,
      survivalReviveContinued: false,
      isNewSurvivalRecord: false,
      survivalTimeText: '',
      survivalSettlementType: '',
      _survivalRewardGranted: false,
      _survivalPuzzleKeys: [],

      // 设置弹窗
      showSettings: false,
      musicOn: true,
      soundOn: true,
      vibrateOn: true,

      // 胜利动画
      showFlyingCoins: false,
      flyingCoinsArray: [],
      confettiPieces: [],
      coinVaultPulse: false,
      showPreWinConfetti: false,

      // 普通模式分享次数
      shareReviveRoundCount: 0,
      shareReviveDailyCount: 0,
      shareHintRoundCount: 0,
      shareHintDailyCount: 0,

      // 棋盘入场动画
      boardAnimClass: '',

      // 局内提示系统
      activeHint: null,

      // 道具消耗/获得动画
      showRewardAnim: false,
      rewardAnimIcon: '',
      rewardAnimIcons: [],
      rewardAnimText: '',
      rewardAnimParticles: [],

      // 购买道具弹窗
      showBuyPlaceOne: false,
      buyPlaceOneCount: 1,
      placeOneAdRemain: 2,
      showBuyHint: false,
      buyHintCount: 1,

      // 赚金币弹窗
      showCoinAd: false,
      coinAdRemain: 5,
      // 金币兑换贝壳弹窗
      showShellExchange: false,
      exchangeCount: 1,
    };
  },

  computed: {
    // 当前皮肤数据（响应式）
    skinData() {
      const skinId = appState.currentSkin || 'crab';
      return appState.skins[skinId] || {};
    },

    ruleSkinName() {
      return t(this.skinData.nameKey || 'skin.crab.name').toLowerCase();
    },
    ruleMainText() {
      return t('game.rule_main', {skinName: this.ruleSkinName});
    },
    ruleSubText() {
      return t('game.rule_sub');
    },
    canShareRevive() {
      return this.shareReviveRoundCount < 1 && this.shareReviveDailyCount < 4;
    },
    canShareHint() {
      return this.shareHintRoundCount < 1 && this.shareHintDailyCount < 2;
    },

    // 格子尺寸（vw）
    cellSizeVw() {
      return (this.cellSize / 750 * 100) + 'vw';
    },

    // 格子间距 rpx→vw
    cellGapVw() {
      return (6 / 750 * 100) + 'vw';
    },

    // 教程手指位置的动态样式
    tutFingerStyle() {
      if (!this.tutFingerPos) return {};
      const cellVw = this.cellSize / 750 * 100;
      const gapVw = 6 / 750 * 100;
      const padVw = 8 / 750 * 100;
      return {
        top: (this.tutFingerPos.row * cellVw + this.tutFingerPos.row * gapVw + padVw) + 'vw',
        left: (this.tutFingerPos.col * cellVw + this.tutFingerPos.col * gapVw + padVw) + 'vw',
        width: cellVw + 'vw',
        height: cellVw + 'vw',
      };
    },

    // 教程中间覆盖层样式（定位到第三行）
    tutMidStyle() {
      const cellVw = this.cellSize / 750 * 100;
      const gapVw = 6 / 750 * 100;
      const padVw = 8 / 750 * 100;
      return {
        top: (2 * cellVw + 2 * gapVw + padVw) + 'vw',
        width: '100%',
        height: cellVw + 'vw',
      };
    },

    // 生存模式进度条填充宽度
    // 进度条视觉基准 = 里程碑最大值（保持原始间距）
    survivalProgressBase() {
      const ms = GameConfig.SURVIVAL_MILESTONES;
      return ms.length > 0 ? ms[ms.length - 1] : 10;
    },
    // 生存模式是否还有免费次数
    survivalHasFreeRemain() {
      const today = getLocalToday();
      let used = 0;
      if (appState.survivalPlayedDate === today) {
        used = appState.survivalPlayedCount || 0;
      }
      return used < 2;
    },
  },

  created() {
    // 初始化非响应式内部变量
    this._puzzle = null;
    this._gameOver = false;
    this._lastTapTime = 0;
    this._lastTapRow = -1;
    this._lastTapCol = -1;
    this._tapTimer = null;
    this._isSwiping = false;
    this._swipedCells = {};
    this._touchStartTime = 0;
    this._touchStartRow = 0;
    this._touchStartCol = 0;
    this._lastSwipeRow = 0;
    this._lastSwipeCol = 0;
    this._swipeAction = 'mark';
    this._gridPointerId = null;
    this._gridRect = null;
    this._rpxRatio = null;
    this._typewriterTimer = null;
    this._typewriterTimeout = null;
    this._timerInterval = null;

    this._isRealLeave = false;
    this._popstateHandler = null;
    this._survivalStartTime = 0;
    this._timeBonusTimer = null;
    this._globalGridPointerEnd = (e) => this.onGridPointerEnd(e);
  },

  mounted() {
    const params = Router.getParams() || {};
    const mode = params.mode || 'normal';
    const level = params.level !== undefined ? parseInt(params.level) : 1;

    this.mode = mode;
    this.level = level;
    this.coins = appState.coins || 0;
    this.placeOneCount = appState.placeOneCount || 0;
    this.hintCount = appState.hintCount || 0;
    this.adBoosted = false;
    this.boostedCoins = 0;
    this._resetNormalShareRoundCounts();
    this._loadNormalShareDailyCounts();
    this.musicOn = AudioManager.musicOn;
    this.soundOn = AudioManager.soundOn;
    const vibrateStored = localStorage.getItem('audioVibrateOn');
    this.vibrateOn = vibrateStored === null ? true : vibrateStored === 'true';

    if (mode === 'normal' && level > 0) {
      const now = Date.now();
      const isInfinitePlay = appState.infinitePlayEndTime && appState.infinitePlayEndTime > now;
      if (!isInfinitePlay && (appState.shells > 0 || (appState.bonusShells || 0) > 0)) {
        if ((appState.bonusShells || 0) > 0) {
          appState.bonusShells--;
        } else {
          appState.shells--;
        }
        saveGameData();
        // 延迟弹出消耗动画，等页面渲染完成
        setTimeout(() => {
          this._playRewardAnim(IMG.shell, t('game.shell_minus'), null, 2);
        }, 600);
      }
      this.shells = appState.shells;
      this.maxShells = appState.maxShells || 6;
      this.updateShellsDisplay();
      this._shellDisplayTimer = setInterval(() => { this.updateShellsDisplay(); }, 1000);
    }

    if (mode === 'daily') {
      this.initDailyChallenge();
    } else if (mode === 'survival') {
      this.initSurvival();
    } else {
      if (level == 0) {
        this.initTutorial();
      } else {
        this.initLevel(level);
      }
    }

    // 防退出机制（替代 page-container）
    history.pushState(null, '', location.href);
    this._popstateHandler = () => {
      if (!this._isRealLeave) {
        history.pushState(null, '', location.href);
      }
    };
    window.addEventListener('popstate', this._popstateHandler);
    window.addEventListener('pointerup', this._globalGridPointerEnd, true);
    window.addEventListener('pointercancel', this._globalGridPointerEnd, true);

    // 页面关闭前提醒
    window.onbeforeunload = () => t('game.confirm_exit');
  },

  beforeUnmount() {
    this.stopTimer();
    this._stopCelebrateAudio();
    if (this._typewriterTimer) clearInterval(this._typewriterTimer);
    if (this._typewriterTimeout) clearTimeout(this._typewriterTimeout);
    if (this._timeBonusTimer) clearTimeout(this._timeBonusTimer);
    if (this._tapTimer) clearTimeout(this._tapTimer);
    if (this._shellDisplayTimer) clearInterval(this._shellDisplayTimer);
    window.removeEventListener('popstate', this._popstateHandler);
    window.removeEventListener('pointerup', this._globalGridPointerEnd, true);
    window.removeEventListener('pointercancel', this._globalGridPointerEnd, true);
    window.onbeforeunload = null;
    if (this._rewardAnimTimer) clearTimeout(this._rewardAnimTimer);
    // 离开游戏页：恢复菜单 BGM
    AudioManager.playBGM('menu');
  },

  methods: {

    // ========== 普通模式分享次数 ==========
    _normalShareKey(type) {
      return `normalShare${type}_${getLocalToday()}`;
    },

    _loadNormalShareDailyCounts() {
      this.shareReviveDailyCount = parseInt(localStorage.getItem(this._normalShareKey('Revive'))) || 0;
      this.shareHintDailyCount = parseInt(localStorage.getItem(this._normalShareKey('Hint'))) || 0;
    },

    _resetNormalShareRoundCounts() {
      this.shareReviveRoundCount = 0;
      this.shareHintRoundCount = 0;
    },

    _recordNormalShare(type) {
      const key = this._normalShareKey(type);
      const count = (parseInt(localStorage.getItem(key)) || 0) + 1;
      localStorage.setItem(key, String(count));
      if (type === 'Revive') {
        this.shareReviveRoundCount++;
        this.shareReviveDailyCount = count;
      } else {
        this.shareHintRoundCount++;
        this.shareHintDailyCount = count;
      }
    },

    _placeOneAdKey() {
      return `placeOneAdCount_${getLocalToday()}`;
    },

    _loadPlaceOneAdRemain() {
      const count = parseInt(localStorage.getItem(this._placeOneAdKey())) || 0;
      this.placeOneAdRemain = Math.max(0, 2 - count);
      return count;
    },

    // ========== 贝壳显示更新（与首页一致） ==========
    updateShellsDisplay() {
      const shells = appState.shells;
      const maxShells = appState.maxShells || 6;
      const now = Date.now();
      const endTime = appState.infinitePlayEndTime || 0;
      const isInfinite = endTime && endTime > now;

      let display = '';
      let infiniteTimeDisplay = '00:00';
      if (isInfinite) {
        const remainMs = endTime - now;
        const remainSec = Math.ceil(remainMs / 1000);
        const m = Math.floor(remainSec / 60);
        const s = remainSec % 60;
        infiniteTimeDisplay = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      } else if (shells >= maxShells) {
        display = t('game.shells_full_display', {max: maxShells});
      } else {
        const remain = typeof getShellRecoveryRemaining === 'function' ? getShellRecoveryRemaining() : '';
        display = `${shells}/${maxShells} ${remain}s`;
      }

      this.shells = shells;
      this.maxShells = maxShells;
      this.isInfinitePlay = !!isInfinite;
      this.infiniteTimeDisplay = infiniteTimeDisplay;
      this.shellsDisplay = display;
      this.bonusShells = appState.bonusShells || 0;
    },

    // ========== rich-text 渲染辅助 ==========
    renderRichText(nodes) {
      if (!nodes || !Array.isArray(nodes)) return '';
      return nodes.map(n => {
        if (n.type === 'text') return n.text || '';
        if (n.name === 'br') return '<br>';
        if (n.name === 'span') {
          const style = (n.attrs && n.attrs.style) || '';
          const inner = this.renderRichText(n.children);
          return `<span style="${style}">${inner}</span>`;
        }
        return '';
      }).join('');
    },

    // ========== 道具消耗/获得动画 ==========
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
        }, 1000);
      });
    },

    // ========== 打字机动画 ==========
    _triggerBoardIntro() {
      if (this._typewriterTimer) clearInterval(this._typewriterTimer);
      if (this._typewriterTimeout) clearTimeout(this._typewriterTimeout);
      AudioManager.playSFX('ding');
      if (this.showRuleHint) {
        this.ruleAnimActive = false;
        setTimeout(() => {
          this.ruleAnimActive = true;
          this._typewriterTimer = setInterval(() => {
            AudioManager.playSFX('typewriter');
          }, 180);
          this._typewriterTimeout = setTimeout(() => {
            this.onTypewriterEnd();
          }, 1600);
        }, 50);
      }
    },

    onTypewriterEnd() {
      if (this._typewriterTimer) {
        clearInterval(this._typewriterTimer);
        this._typewriterTimer = null;
      }
      if (this._typewriterTimeout) {
        clearTimeout(this._typewriterTimeout);
        this._typewriterTimeout = null;
      }
    },

    // ========== 教程逻辑 ==========
    initTutorial() {
      this._gameOver = false;
      const size = 4;
      const regions = [
        [0, 1, 1, 2],
        [0, 1, 3, 2],
        [0, 0, 3, 2],
        [3, 3, 3, 2]
      ];
      const solution = [
        [0, 1, 0, 0],
        [0, 0, 0, 1],
        [1, 0, 0, 0],
        [0, 0, 1, 0]
      ];
      const puzzle = { size, starsPerUnit: 1, regions, solution };
      this._puzzle = puzzle;

      const screenWidth = window.innerWidth;
      const ratio = 750 / screenWidth;
      const sidePadding = Math.round(screenWidth * 0.09);
      const availableWidth = screenWidth - sidePadding * 2;
      const cellSizePx = Math.floor(availableWidth / size);
      const cellSize = Math.floor(cellSizePx * ratio);

      const gridData = this.buildGridData(puzzle, size);

      this.isTutorial = true;
      this.tutStep = 0;
      this.size = size;
      this.starsPerUnit = 1;
      this.totalStars = 4;
      this.foundCount = 0;
      this.progressPercent = 0;
      this.hearts = 3;
      this.maxHearts = 3;
      this.errors = 0;
      this.cellSize = cellSize;
      this.gridData = gridData;
      this.showResult = false;
      this.showRuleHint = false;
      this.boardAnimClass = 'board-intro-anim';
      this.pageReady = true;

      setTimeout(() => {
        this.advanceTutStep(1);
      }, 800);
    },

    _setTutHintPulse(cells, on) {
      for (const { r, c } of cells) {
        this.gridData[r][c].isHintPulse = on;
      }
    },

    advanceTutStep(step) {
      if (this.tutHighlightCells && this.tutHighlightCells.length > 0) {
        this._setTutHintPulse(this.tutHighlightCells, false);
      }
      this.tutStep = step;
      const skinName = t('skin.crab.name');

      if (step === 1) {
        this.tutShowFingerAnim = true;
        this.tutFingerPos = { row: 0, col: 1 };
        this.tutTextNodes = [
          { name: 'span', attrs: { style: 'color:#FF4444;font-weight:bold;' }, children: [{ type: 'text', text: t('game.tut_step1_highlight') }] },
          { type: 'text', text: t('game.tut_step1_text', {skinName: skinName}) }
        ];
        this.tutTextBottomNodes = null;
        this.tutHighlightCells = [{ r: 0, c: 1 }];
      } else if (step === 3) {
        this.tutShowFingerAnim = false;
        this.tutTextNodes = [
          { type: 'text', text: t('game.tut_step3_line1') },
          { name: 'br' },
          { type: 'text', text: ' ' + t('game.tut_step3_line2_pre') },
          { name: 'span', attrs: { style: 'color:#FF4444;font-weight:bold;' }, children: [{ type: 'text', text: t('game.tut_step3_color') }] },
          { type: 'text', text: t('game.tut_step3_line2_mid') },
          { name: 'span', attrs: { style: 'color:#FF4444;font-weight:bold;' }, children: [{ type: 'text', text: t('game.tut_step3_one') }] },
          { type: 'text', text: skinName + t('game.tut_step3_period') }
        ];
        this.tutTextBottomNodes = null;
        this.tutShowConfirmBtn = true;
        this.tutHighlightCells = [];
      } else if (step === 4) {
        this.tutShowConfirmBtn = false;
        this.tutTextNodes = [
          { name: 'span', attrs: { style: 'color:#FF4444;font-weight:bold;' }, children: [{ type: 'text', text: t('game.tut_step4_around', {skinName: skinName}) }] },
          { type: 'text', text: t('game.tut_step4_no_other', {skinName: skinName}) }
        ];
        this.tutTextBottomNodes = [
          { type: 'text', text: t('game.tut_step4_bottom') }
        ];
        this.tutHighlightCells = [
          { r: 0, c: 0 }, { r: 0, c: 2 },
          { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }
        ];
        this._setTutHintPulse(this.tutHighlightCells, true);
      } else if (step === 5) {
        this.tutTextNodes = [
          { type: 'text', text: t('game.tut_step3_line1') },
          { name: 'br' },
          { type: 'text', text: ' ' + skinName + t('game.tut_step5_cant') },
          { name: 'span', attrs: { style: 'color:#FF4444;font-weight:bold;' }, children: [{ type: 'text', text: t('game.tut_step5_same_row_col') }] },
          { type: 'text', text: t('game.tut_step5_appear') }
        ];
        this.tutTextBottomNodes = null;
        this.tutHighlightCells = [
          { r: 0, c: 3 },
          { r: 2, c: 1 },
          { r: 3, c: 1 }
        ];
        this._setTutHintPulse(this.tutHighlightCells, true);
      } else if (step === 6) {
        const regionId = this.gridData[2][0].region;
        const colorIndex = regionId % GameConfig.REGION_COLOR_NAMES.length;
        const cName = GameConfig.REGION_COLOR_NAMES[colorIndex];
        this.tutShowFingerAnim = true;
        this.tutFingerPos = { row: 2, col: 0 };
        this.tutTextNodes = null;
        this.tutTextBottomNodes = [
          { type: 'text', text: t('game.tut_step6_only') },
          { name: 'span', attrs: { style: 'color:#FF4444;font-weight:bold;' }, children: [{ type: 'text', text: t('game.tut_step6_last_color', {colorName: cName}) }] },
          { type: 'text', text: t('game.tut_step6_place', {skinName: skinName}) }
        ];
        this.tutHighlightCells = [{ r: 2, c: 0 }];
      } else if (step === 7) {
        const hl = [];
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (this.gridData[r][c].state === 'empty') hl.push({ r, c });
          }
        }
        this.tutShowFingerAnim = false;
        this.tutTextNodes = [
          { type: 'text', text: t('game.tut_step7_top', {skinName: skinName}) }
        ];
        this.tutTextBottomNodes = [
          { type: 'text', text: t('game.tut_step7_bottom') }
        ];
        this.tutHighlightCells = hl;
        this._setTutHintPulse(hl, true);
      } else if (step === 8) {
        this.showTutArrowHint = false;
      }
    },

    onTutConfirm() {
      AudioManager.playSFX('click');
      if (this.tutStep === 3) {
        this.advanceTutStep(4);
      }
    },

    checkTutOrGuideProgress() {
      if (this.isTutorial) {
        const { tutStep, tutHighlightCells, gridData } = this;
        if (tutStep === 4 || tutStep === 5) {
          // 检查所有高亮格子是否都被点击过（不管对错）
          let allInteracted = true;
          for (const cell of tutHighlightCells) {
            const cellState = gridData[cell.r][cell.c].state;
            if (cellState !== 'marked' && cellState !== 'wrong' && cellState !== 'wrong-anim') {
              allInteracted = false;
              break;
            }
          }
          if (allInteracted) {
            setTimeout(() => {
              if (tutStep === 4) this.advanceTutStep(5);
              else if (tutStep === 5) this.advanceTutStep(6);
            }, 400);
          }
        }
      }
    },

    // ========== 关卡初始化 ==========
    initLevel(level) {
      const config = GameConfig.getLevelConfig(level);
      const { size, starsPerUnit } = config;
      console.log('[initLevel] level=', level, 'size=', size);

      let puzzle = null;
      let seedSalt = 0;
      while (!puzzle && seedSalt < 10) {
        const currentSeed = seedSalt === 0 ? level.toString() : `${level}_${seedSalt}`;
        puzzle = PuzzleGenerator.generatePuzzle(size, starsPerUnit, config.difficulty, currentSeed);
        if (!puzzle) {
          puzzle = PuzzleGenerator.generatePuzzle(size, starsPerUnit, null, currentSeed);
        }
        seedSalt++;
      }
      if (!puzzle) {
        Toast.show(t('game.level_gen_failed'));
        setTimeout(() => Router.navigateToHome(), 1500);
        return;
      }

      const actualSize = puzzle.size;
      this._puzzle = puzzle;
      this._gameOver = false;
      this.adBoosted = false;
      this.boostedCoins = 0;
      this.isFirstClear = false;

      const screenWidth = window.innerWidth;
      const ratio = 750 / screenWidth;
      const sidePadding = Math.round(screenWidth * 0.09);
      const availableWidth = screenWidth - sidePadding * 2;
      const cellSizePx = Math.floor(availableWidth / actualSize);
      const cellSize = Math.floor(cellSizePx * ratio);

      const gridData = this.buildGridData(puzzle, actualSize);
      const totalStars = actualSize * puzzle.starsPerUnit;

      let initialFoundCount = 0;
      if (level >= 1 && level <= 10) {
        const candidates = [];
        for (let r = 0; r < actualSize; r++) {
          for (let c = 0; c < actualSize; c++) {
            if (puzzle.solution[r][c] === 1) candidates.push({ r, c });
          }
        }
        if (candidates.length > 0) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          gridData[target.r][target.c].state = 'correct';
          initialFoundCount = 1;
        }
      }

      const progressPercent = Math.round((initialFoundCount / totalStars) * 100);

      this.size = actualSize;
      this.starsPerUnit = puzzle.starsPerUnit;
      this.totalStars = totalStars;
      this.foundCount = initialFoundCount;
      this.progressPercent = progressPercent;
      this.hearts = 3;
      this.maxHearts = 3;
      this.errors = 0;
      this._resetNormalShareRoundCounts();
      this._loadNormalShareDailyCounts();
      this.cellSize = cellSize;
      this.gridData = gridData;
      this.showResult = false;
      this.showPreWinConfetti = false;
      this.showRuleHint = true;
      this.boardAnimClass = 'board-intro-anim';
      this.pageReady = true;

      this._triggerBoardIntro();
      console.log('[initLevel] OK');
    },

    buildGridData(puzzle, size) {
      const { regions } = puzzle;
      const gridData = [];
      const center = (size - 1) / 2;
      for (let r = 0; r < size; r++) {
        const row = [];
        for (let c = 0; c < size; c++) {
          const regionId = regions[r][c];
          const borderClasses = [];
          if (r === 0 || regions[r - 1][c] !== regionId) borderClasses.push('border-top');
          if (r === size - 1 || regions[r + 1][c] !== regionId) borderClasses.push('border-bottom');
          if (c === 0 || regions[r][c - 1] !== regionId) borderClasses.push('border-left');
          if (c === size - 1 || regions[r][c + 1] !== regionId) borderClasses.push('border-right');
          const dist = Math.abs(r - center) + Math.abs(c - center);
          const animDelay = (dist * 0.05).toFixed(2);
          row.push({
            region: regionId,
            color: GameConfig.REGION_COLORS[regionId % GameConfig.REGION_COLORS.length],
            state: 'empty',
            borderClasses: borderClasses.join(' '),
            animDelay: animDelay,
          });
        }
        gridData.push(row);
      }
      return gridData;
    },

    // ========== 滑动标记 ==========
    _getGridRect() {
      return new Promise((resolve) => {
        const el = document.getElementById('game-grid');
        if (el) {
          this._gridRect = el.getBoundingClientRect();
          resolve(this._gridRect);
        } else {
          resolve(null);
        }
      });
    },

    _pointerToCell(pointer) {
      if (!this._gridRect) return null;
      const rect = this._gridRect;
      const size = this.size;
      if (!this._rpxRatio) {
        this._rpxRatio = window.innerWidth / 750;
      }
      const padPx = 8 * this._rpxRatio;
      const innerW = rect.width - padPx * 2;
      const innerH = rect.height - padPx * 2;
      const stepX = innerW / size;
      const stepY = innerH / size;
      const x = pointer.clientX - rect.left - padPx;
      const y = pointer.clientY - rect.top - padPx;
      const col = Math.floor(x / stepX);
      const row = Math.floor(y / stepY);
      if (row >= 0 && row < size && col >= 0 && col < size) {
        return { row, col };
      }
      return null;
    },

    onGridPointerStart(e) {
      if (this._gameOver || (e.pointerType === 'mouse' && e.button !== 0)) return;
      this._gridPointerId = e.pointerId;
      this._isSwiping = false;
      this._swipedCells = {};
      this._touchStartTime = Date.now();
      this._gridRect = e.currentTarget.getBoundingClientRect();
      const pos = this._pointerToCell(e);
      if (pos) {
        this._touchStartRow = pos.row;
        this._touchStartCol = pos.col;
      }
    },

    onGridPointerMove(e) {
      if (this._gameOver || e.pointerId !== this._gridPointerId || !this._gridRect) return;
      const pos = this._pointerToCell(e);
      if (!pos) return;
      const key = pos.row + '-' + pos.col;
      if (!this._isSwiping) {
        if (pos.row !== this._touchStartRow || pos.col !== this._touchStartCol) {
          this._isSwiping = true;
          this._lastSwipeRow = this._touchStartRow;
          this._lastSwipeCol = this._touchStartCol;
          const startCell = this.gridData[this._touchStartRow][this._touchStartCol];
          this._swipeAction = startCell.state === 'marked' ? 'unmark' : 'mark';
          const startKey = this._touchStartRow + '-' + this._touchStartCol;
          if (!this._swipedCells[startKey]) {
            this._swipedCells[startKey] = true;
            this._markCell(this._touchStartRow, this._touchStartCol);
          }
        }
      }
      if (this._isSwiping && !this._swipedCells[key]) {
        const dr = Math.abs(pos.row - this._lastSwipeRow);
        const dc = Math.abs(pos.col - this._lastSwipeCol);
        if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
          this._swipedCells[key] = true;
          this._lastSwipeRow = pos.row;
          this._lastSwipeCol = pos.col;
          this._markCell(pos.row, pos.col);
        }
      }
    },

    onGridPointerEnd(e) {
      if (e.pointerId !== this._gridPointerId) return;
      this._gridPointerId = null;
      this._gridRect = null;
    },

    _markCell(row, col) {
      const cell = this.gridData[row][col];
      if (this._swipeAction === 'unmark') {
        if (cell.state === 'marked') {
          cell.state = 'empty';
          AudioManager.playSFX('unmark');
        }
      } else {
        if (cell.state === 'empty') {
          cell.state = 'marked';
          AudioManager.playSFX('mark');
          this.checkTutOrGuideProgress();
        }
      }
    },

    // ========== 点击交互 ==========
    onCellTap(row, col) {
      if (this._gameOver) return;
      if (this._isSwiping) return;
      const cell = this.gridData[row][col];
      if (this.isTutorial && this.tutStep <= 7) {
        if (this.tutStep === 3) return;
        const allowed = this.tutHighlightCells.some(c => c.r === row && c.c === col);
        const isMarked = cell.state === 'marked';
        if (!allowed && !isMarked) return;
      }
      if (cell.state === 'correct' || cell.state === 'wrong') return;

      const now = Date.now();
      const isDoubleTap = now - this._lastTapTime < 300 && this._lastTapRow === row && this._lastTapCol === col;
      this._lastTapTime = now;
      this._lastTapRow = row;
      this._lastTapCol = col;

      if (isDoubleTap) {
        clearTimeout(this._tapTimer);
        this._tapTimer = null;
        this.confirmCrab(row, col);
      } else {
        clearTimeout(this._tapTimer);
        this._tapTimer = setTimeout(() => {
          this.toggleMark(row, col);
        }, 300);
      }
    },

    toggleMark(row, col) {
      if (this.activeHint) this.clearActiveHint();
      const cell = this.gridData[row][col];
      if (cell.state === 'correct' || cell.state === 'wrong') return;
      const isMarking = cell.state === 'empty';
      cell.state = isMarking ? 'marked' : 'empty';
      AudioManager.playSFX(isMarking ? 'mark' : 'unmark');
      if (isMarking) this.checkTutOrGuideProgress();
    },

    confirmCrab(row, col) {
      if (this.activeHint) this.clearActiveHint();
      const cell = this.gridData[row][col];
      if (cell.state === 'correct' || cell.state === 'wrong') return;
      const isCorrect = this._puzzle.solution[row][col] === 1;

      // 教程模式下，禁止在错误位置双击（不显示红X）
      if (this.isTutorial && !isCorrect) {
        return;
      }

      if (isCorrect) {
        const foundCount = this.foundCount + 1;
        const progressPercent = Math.round((foundCount / this.totalStars) * 100);
        cell.state = 'correct';
        this.foundCount = foundCount;
        this.progressPercent = progressPercent;
        AudioManager.playSFX('correct');
        if (this.vibrateOn) vibrateShort();

        if (this.mode === 'daily') {
          const newTime = Math.min(this.timeRemaining + 15, 999);
          this.timeRemaining = newTime;
          this.showTimeFeedback('+15s', 'bonus');
        }
        if (this.mode === 'survival') {
          const newTime = Math.min(this.timeRemaining + 5, 999);
          this.timeRemaining = newTime;
          this.survivalCrabsFound = this.survivalCrabsFound + 1;
          this.showTimeFeedback('+5s', 'bonus');
        }

        if (this.isTutorial) {
          if (this.tutStep === 1) {
            setTimeout(() => { this.advanceTutStep(3); }, 500);
          } else if (this.tutStep === 6) {
            setTimeout(() => { this.advanceTutStep(7); }, 500);
          } else if (this.tutStep === 7) {
            if (foundCount === this.totalStars) {
              setTimeout(() => { this.advanceTutStep(8); }, 500);
            }
          }
        }

        if (foundCount === this.totalStars) {
          this.onWin();
        }
      } else {
        const hearts = this.hearts - 1;
        const errors = this.errors + 1;
        // 生存模式的错误格直接落地为红 X，复活后也必须保留；其他模式继续播放碎心动画。
        cell.state = this.mode === 'survival' ? 'wrong' : 'wrong-anim';
        this.hearts = hearts;
        this.errors = errors;
        AudioManager.playSFX('wrong');

        if (this.mode === 'daily') {
          const newTime = Math.max(this.timeRemaining - 10, 0);
          this.timeRemaining = newTime;
          this.showTimeFeedback('-10s', 'penalty');
          if (newTime <= 0) { this.onTimeUp(); return; }
        }
        if (this.mode === 'survival') {
          const newTime = Math.max(this.timeRemaining - 4, 0);
          this.timeRemaining = newTime;
          this.showTimeFeedback('-4s', 'penalty');
          if (newTime <= 0) { this.onTimeUp(); return; }
        }

        setTimeout(() => {
          if (this.mode !== 'survival') cell.state = 'wrong';
          if (hearts <= 0) this.onLose();
        }, 500);

        if (this.vibrateOn) vibrateShort();
      }
    },

    // ========== 每日挑战 + 生存模式 ==========
    initDailyChallenge() {
      const today = getLocalToday();
      const lastWin = localStorage.getItem('dailyChallengeLastWin') || '';
      if (lastWin === today) {
        Modal.show({
          title: t('game.daily_done_title'),
          content: t('game.daily_done_content'),
          showCancel: false,
        }).then(() => {
          this._isRealLeave = true;
          Router.navigateToHome();
        });
        return;
      }

      const puzzle = DailyPuzzles.getDailyPuzzle();
      if (!puzzle) {
        Toast.show(t('game.level_load_failed'));
        return;
      }
      const dailySize = puzzle.size;
      this._puzzle = puzzle;
      this._gameOver = false;

      const screenWidth = window.innerWidth;
      const ratio = 750 / screenWidth;
      const sidePadding = Math.round(screenWidth * 0.09);
      const availableWidth = screenWidth - sidePadding * 2;
      const cellSizePx = Math.floor(availableWidth / dailySize);
      const cellSize = Math.floor(cellSizePx * ratio);

      const gridData = this.buildGridData(puzzle, dailySize);
      const starsPerUnit = puzzle.starsPerUnit;
      const totalStars = dailySize * starsPerUnit;

      this.size = dailySize;
      this.starsPerUnit = starsPerUnit;
      this.totalStars = totalStars;
      this.foundCount = 0;
      this.progressPercent = 0;
      this.hearts = 3;
      this.maxHearts = 3;
      this.errors = 0;
      this.cellSize = cellSize;
      this.gridData = gridData;
      this.showResult = false;
      this.showRuleHint = true;
      this.timeRemaining = 180;
      this.maxTime = 180;
      this.dailyRevived = false;
      this.dailyDate = today;
      this.shells = appState.shells;
      this.maxShells = appState.maxShells;
      this.boardAnimClass = 'board-intro-anim';
      this.dailyStartTs = Date.now();
      this.pageReady = true;

      this._triggerBoardIntro();
      this.startTimer();
    },

    initSurvival() {
      this._gameOver = false;
      this._survivalStartTime = Date.now();
      this.survivalRound = 1;
      this.timeRemaining = 60;
      this.maxTime = 60;
      this.hearts = 3;
      this.maxHearts = 3;
      this.errors = 0;
      this.showResult = false;
      this.survivalRevived = false;
      this._survivalShellsAwarded = false;
      this._survivalRewardGranted = false;
      this.survivalSettlementType = '';
      this._survivalPuzzleKeys = [];
      this.survivalCrabsFound = 0;
      this.survivalRewardDoubled = false;
      this.survivalReviveContinued = false;
      this.isNewSurvivalRecord = false;
      this.survivalTimeText = '';
      this.shells = appState.shells;
      this.maxShells = appState.maxShells;
      this.initSurvivalRound(1);
      this.startTimer();
    },

    initSurvivalRound(round) {
      const config = GameConfig.getSurvivalRoundConfig(round);
      const { size, starsPerUnit, difficulty } = config;
      // 每回合使用稳定种子，并在本局内排除相同结构；必要时同步旋转/镜像区域和解答。
      // 种子基于周数，每周一更新（使用 UTC 时间计算周数）
      let puzzle = null;
      const weeksSinceEpoch = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
      const roundSeed = weeksSinceEpoch * 1000 + round * 100;
      for (let attempt = 0; attempt < 12 && !puzzle; attempt++) {
        const seed = roundSeed + attempt;
        let candidate = PuzzleGenerator.generatePuzzle(size, starsPerUnit, difficulty, seed);
        if (!candidate) candidate = PuzzleGenerator.generatePuzzle(size, starsPerUnit, null, seed);
        if (!candidate) continue;

        const turns = (round + attempt) % 4;
        const mirrored = Math.floor((round + attempt) / 4) % 2 === 1;
        const transformed = transformSurvivalPuzzle(candidate, turns, mirrored);
        const key = survivalPuzzleKey(transformed);
        // 同一结构的颜色置换不算新棋盘，记录规范化后的区域与解答。
        if (this._survivalPuzzleKeys.includes(key)) continue;
        puzzle = transformed;
      }
      if (!puzzle) { Toast.show(t('game.level_gen_failed')); this.stopTimer(); setTimeout(() => Router.navigateToHome(), 1500); return; }

      this._survivalPuzzleKeys.push(survivalPuzzleKey(puzzle));
      this._puzzle = puzzle;
      const actualSize = puzzle.size;
      const screenWidth = window.innerWidth;
      const ratio = 750 / screenWidth;
      const sidePadding = Math.round(screenWidth * 0.09);
      const availableWidth = screenWidth - sidePadding * 2;
      const cellSizePx = Math.floor(availableWidth / actualSize);
      const cellSize = Math.floor(cellSizePx * ratio);

      const gridData = this.buildGridData(puzzle, actualSize);
      const totalStars = actualSize * puzzle.starsPerUnit;

      this.survivalRound = round;
      this.size = actualSize;
      this.starsPerUnit = puzzle.starsPerUnit;
      this.totalStars = totalStars;
      this.foundCount = 0;
      this.progressPercent = 0;
      this.cellSize = cellSize;
      this.gridData = gridData;
      this.showResult = false;
      this.showPreWinConfetti = false;
      this.showRuleHint = true;
      this.boardAnimClass = 'board-intro-anim';
      this.pageReady = true;
      this._triggerBoardIntro();
    },

    onSurvivalRoundWin() {
      const round = this.survivalRound;
      this._gameOver = true;
      this.onTypewriterEnd();
      const newGridData = this.gridData.map(row =>
        row.map(cell => cell.state === 'correct' ? { ...cell, isWinningDance: true } : cell)
      );
      this.gridData = newGridData;
      AudioManager.playSFX('win');
      this.stopTimer();
      // 第15关通关后强制结束，弹出最终胜利结算
      if (round >= GameConfig.SURVIVAL_TOTAL_ROUNDS) {
        this.onSurvivalFinalWin();
        return;
      }
      setTimeout(() => {
        this._gameOver = false;
        this.initSurvivalRound(round + 1);
        if (this.pageReady) this.startTimer();
      }, 800);
    },

    onSurvivalFinalWin() {
      this.onSurvivalSuccessSettlement('complete');
    },

    onSurvivalBeyondTen() {
      this.onSurvivalSuccessSettlement('beyond_ten');
    },

    onSurvivalSuccessSettlement(settlementType) {
      if (this._survivalRewardGranted) return;
      this._survivalRewardGranted = true;
      this.survivalSettlementType = settlementType;
      this._gameOver = true;
      this.stopTimer();
      const newGridData = this.gridData.map(row =>
        row.map(cell => cell.state === 'correct' ? { ...cell, isWinningDance: true } : cell)
      );
      this.gridData = newGridData;
      this.confettiPieces = generateConfetti(45);
      this.showPreWinConfetti = true;
      AudioManager.playSFX('win');
      AudioManager.playCelebrate();

      const rewardCoins = 20;
      const rewardShells = 4;
      appState.coins += rewardCoins;
      appState.bonusShells = (appState.bonusShells || 0) + rewardShells;
      saveGameData();
      AudioManager.stopBGM();

      const timeTakenMs = Date.now() - (this._survivalStartTime || Date.now());
      const totalSeconds = Math.floor(timeTakenMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const survivalTimeText = minutes > 0 ? t('game.time_min_sec', {min: minutes, sec: seconds}) : t('game.time_sec', {sec: seconds});
      let isNewSurvivalRecord = false;
      const currentCrabs = this.survivalCrabsFound;
      if (currentCrabs > appState.survivalMaxCrabsFound) {
        appState.survivalMaxCrabsFound = currentCrabs;
        isNewSurvivalRecord = true;
        saveGameData();
      }

      setTimeout(() => {
        this.showResult = true;
        this.isWin = true;
        this.rewardCoins = rewardCoins;
        this.survivalRewardShells = rewardShells;
        this.survivalTimeText = survivalTimeText;
        this.isNewSurvivalRecord = isNewSurvivalRecord;
        this.updateShellsDisplay();
      }, 1300);
    },

    // ========== 计时器 + 胜败 ==========
    startTimer() {
      this.stopTimer();
      this._timerInterval = setInterval(() => {
        if (this._gameOver) { this.stopTimer(); return; }
        const t = this.timeRemaining - 1;
        if (t <= 0) {
          this.timeRemaining = 0;
          this.stopTimer();
          this.onTimeUp();
        } else {
          this.timeRemaining = t;
          if (t <= 10) AudioManager.playSFX('countdown');
        }
      }, 1000);
    },

    stopTimer() {
      if (this._timerInterval) {
        clearInterval(this._timerInterval);
        this._timerInterval = null;
      }
    },

    onTimeUp() {
      if (this._gameOver) return;
      this.onLose();
    },

    showTimeFeedback(text, type) {
      this.timeBonusText = text;
      this.timeBonusType = type;
      this.showTimeBonus = true;
      if (this._timeBonusTimer) clearTimeout(this._timeBonusTimer);
      this._timeBonusTimer = setTimeout(() => {
        this.showTimeBonus = false;
      }, 800);
    },

    onWin() {
      if (this.mode === 'survival') { this.onSurvivalRoundWin(); return; }
      this._gameOver = true;
      this.stopTimer();
      const newGridData = this.gridData.map(row =>
        row.map(cell => cell.state === 'correct' ? { ...cell, isWinningDance: true } : cell)
      );
      this.gridData = newGridData;
      this.confettiPieces = generateConfetti(45);
      this.showPreWinConfetti = true;
      AudioManager.playCelebrate();

      if (this.isTutorial) {
        appState.tutorialDone = true;
        appState.currentLevel = Math.max(appState.currentLevel, 1);
        saveGameData();
      }

      if (this.mode === 'daily') {
        const rewardCoins = 10;
        const rewardShells = 4;
        const dailyRank = Math.floor(Math.random() * 30) + 65;
        const totalSeconds = Math.max(0, Math.floor((Date.now() - this.dailyStartTs) / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const dailyTimeText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        const today = this.dailyDate;
        const lastWin = localStorage.getItem('dailyChallengeLastWin') || '';
        let dailyConsecutiveDays = parseInt(localStorage.getItem('dailyConsecutiveDays')) || 0;
        if (lastWin) {
          const dToday = new Date(today.replace(/-/g, '/'));
          const dLast = new Date(lastWin.replace(/-/g, '/'));
          const diffDays = Math.floor((dToday - dLast) / 86400000);
          if (diffDays === 1) dailyConsecutiveDays += 1;
          else if (diffDays > 1) dailyConsecutiveDays = 1;
          else if (diffDays === 0 && dailyConsecutiveDays === 0) dailyConsecutiveDays = 1;
        } else {
          dailyConsecutiveDays = 1;
        }

        appState.coins += rewardCoins;
        appState.bonusShells = (appState.bonusShells || 0) + rewardShells;
        saveGameData();

        localStorage.setItem('dailyChallengeLastWin', today);
        localStorage.setItem('dailyConsecutiveDays', String(dailyConsecutiveDays));
        localStorage.setItem('dailyChallengeTime', dailyTimeText);
        localStorage.setItem('dailyChallengeRank', String(dailyRank));
        AudioManager.stopBGM();

        setTimeout(() => {
          this.showResult = true;
          this.isWin = true;
          this.rewardCoins = rewardCoins;
          this.dailyRewardShells = rewardShells;
          this.dailyRank = dailyRank;
          this.dailyTimeText = dailyTimeText;
          this.dailyConsecutiveDays = dailyConsecutiveDays;
          this.updateShellsDisplay();
        }, 1300);
      } else {
        let starRating = 0;
        if (this.errors === 0) starRating = 3;
        else if (this.errors === 1) starRating = 2;
        else if (this.errors === 2) starRating = 1;
        const reward = GameConfig.getLevelReward(this.level, starRating);
        const level = this.level;
        const oldStars = appState.levelStars[level] || 0;
        this.isFirstClear = level >= appState.currentLevel;
        if (starRating > oldStars) {
          appState.totalStars += (starRating - oldStars);
          appState.levelStars[level] = starRating;
        }
        if (level >= appState.currentLevel) appState.currentLevel = level + 1;
        this.coins = appState.coins;
        saveGameData();

        setTimeout(() => {
          this.showResult = true;
          this.isWin = true;
          this.starRating = starRating;
          this.rewardCoins = reward.coins;

          setTimeout(() => {
            const coinCount = Math.min(reward.coins, 10);
            const flyingCoinsArray = Array.from({ length: coinCount }, (_, i) => i);
            this.showFlyingCoins = true;
            this.flyingCoinsArray = flyingCoinsArray;
            for (let i = 0; i < coinCount; i++) {
              setTimeout(() => {
                AudioManager.playSFX('coin');
                if (i === coinCount - 1) {
                  // 金币飞入钱袋时才增加总额
                  appState.coins += reward.coins;
                  this.coins = appState.coins;
                  saveGameData();
                  this.coinVaultPulse = true;
                  setTimeout(() => {
                    this.showFlyingCoins = false;
                    this.coinVaultPulse = false;
                  }, 600);
                }
              }, i * 100 + 900);
            }
          }, 50);
        }, 1300);
      }
    },

    _recordSurvivalFailureReward(today, extraData) {
      const timeTakenMs = Date.now() - (this._survivalStartTime || Date.now());
      const totalSeconds = Math.floor(timeTakenMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      extraData.survivalTimeText = minutes > 0 ? t('game.time_min_sec', {min: minutes, sec: seconds}) : t('game.time_sec', {sec: seconds});

      const svFailKey = 'survivalFailShellCount_' + today;
      const svFailCount = parseInt(localStorage.getItem(svFailKey)) || 0;
      if (!this._survivalShellsAwarded && svFailCount < 2) {
        localStorage.setItem(svFailKey, String(svFailCount + 1));
        extraData.survivalRewardShells = 2;
        appState.bonusShells = (appState.bonusShells || 0) + 2;
        this._survivalShellsAwarded = true;
      } else {
        extraData.survivalRewardShells = 0;
      }

      saveGameData();
    },

    onLose() {
      this._gameOver = true;
      this.stopTimer();

      let extraData = {};
      const today = getLocalToday();

      if (this.mode === 'survival' && this.survivalRound > 10 && this.survivalRound < this.survivalTotalRounds) {
        this._recordSurvivalFailureReward(today, extraData);
        this.onSurvivalBeyondTen();
        return;
      }

      AudioManager.playSFX('lose');

      if (this.mode === 'survival') {
        this._recordSurvivalFailureReward(today, extraData);
      } else if (this.mode === 'daily') {
        // 每日挑战失败送2贝壳（每日限1次）
        const dlFailKey = 'dailyFailShellCount_' + today;
        const dlFailCount = parseInt(localStorage.getItem(dlFailKey)) || 0;
        if (dlFailCount < 1) {
          localStorage.setItem(dlFailKey, String(dlFailCount + 1));
          extraData.dailyFailRewardShells = 2;
          appState.bonusShells = (appState.bonusShells || 0) + 2;
          saveGameData();
        } else {
          extraData.dailyFailRewardShells = 0;
        }
      }

      setTimeout(() => {
        this.showResult = true;
        this.isWin = false;
        if (extraData.survivalTimeText) this.survivalTimeText = extraData.survivalTimeText;
        if (extraData.survivalRewardShells !== undefined) this.survivalRewardShells = extraData.survivalRewardShells;
        if (extraData.dailyFailRewardShells !== undefined) this.dailyFailRewardShells = extraData.dailyFailRewardShells;
        this.updateShellsDisplay();
      }, 500);
    },

    // ========== 道具购买 ==========
    onOpenBuyPlaceOne() {
      this.buyPlaceOneCount = 1;
      this._loadPlaceOneAdRemain();
      this.showBuyPlaceOne = true;
    },

    onBuyPlaceOnePlus() {
      const maxBuy = Math.floor(appState.coins / 50);
      if (this.buyPlaceOneCount < Math.max(maxBuy, 1)) {
        this.buyPlaceOneCount++;
      }
    },

    onConfirmBuyPlaceOne() {
      const count = this.buyPlaceOneCount;
      const cost = count * 50;
      if (appState.coins < cost) { Toast.show(t('game.coins_insufficient')); return; }
      appState.coins -= cost;
      appState.placeOneCount += count;
      saveGameData();
      this.coins = appState.coins;
      this.placeOneCount = appState.placeOneCount;
      this.showBuyPlaceOne = false;
      this._playRewardAnim(this.skinData.icon, t('game.obtained_place', {count: count}), 'coin', 2);
    },

    onWatchAdForPlaceOne() {
      let count = this._loadPlaceOneAdRemain();
      if (count >= 2) { Toast.show(t('game.daily_limit')); return; }
      AdManager.showAd('place_one_buy', () => {
        count = this._loadPlaceOneAdRemain();
        if (count >= 2) { Toast.show(t('game.daily_limit')); return; }
        count++;
        localStorage.setItem(this._placeOneAdKey(), String(count));
        appState.placeOneCount++;
        saveGameData();
        this.placeOneCount = appState.placeOneCount;
        this.placeOneAdRemain = Math.max(0, 2 - count);
        this.showBuyPlaceOne = false;
        this._playRewardAnim(this.skinData.icon, t('game.obtained_place', {count: 1}), 'coin', 2);
      });
    },

    onBuyHintPlus() {
      const maxBuy = Math.floor(appState.coins / 30);
      if (this.buyHintCount < Math.max(maxBuy, 1)) {
        this.buyHintCount++;
      }
    },

    onConfirmBuyHint() {
      const count = this.buyHintCount;
      const cost = count * 30;
      if (appState.coins < cost) { Toast.show(t('game.coins_insufficient')); return; }
      appState.coins -= cost;
      appState.hintCount += count;
      saveGameData();
      this.coins = appState.coins;
      this.hintCount = appState.hintCount;
      this.showBuyHint = false;
      this._playRewardAnim(IMG.hint, t('game.obtained_hint', {count: count}), 'coin', 2);
    },

    onShareForHint() {
      this._loadNormalShareDailyCounts();
      if (!this.canShareHint) { Toast.show(t('game.share_limit')); return; }
      ShareManager.share({
        title: t('game.share_title'),
        text: t('game.share_text'),
      }, () => {
        this._recordNormalShare('Hint');
        appState.hintCount++;
        saveGameData();
        this.hintCount = appState.hintCount;
        this.showBuyHint = false;
        this._playRewardAnim(IMG.hint, t('game.obtained_hint_1'), 'coin', 2);
      });
    },

    onWatchAdForHint() {
      AdManager.showAd('hint_buy', () => {
        appState.hintCount++;
        saveGameData();
        this.hintCount = appState.hintCount;
        this.showBuyHint = false;
        this._playRewardAnim(IMG.hint, t('game.obtained_hint_1'), 'coin', 2);
      });
    },

    // ========== 道具 + 提示 ==========
    onPlaceOne() {
      if (this._gameOver) return;
      if (this.placeOneCount <= 0) {
        this.onOpenBuyPlaceOne();
        return;
      }
      const { size } = this;
      const candidates = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (this._puzzle.solution[r][c] === 1 && this.gridData[r][c].state !== 'correct') candidates.push({ r, c });
        }
      }
      if (candidates.length === 0) return;
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      const foundCount = this.foundCount + 1;
      const progressPercent = Math.round((foundCount / this.totalStars) * 100);
      appState.placeOneCount--;
      saveGameData();
      this.gridData[target.r][target.c].state = 'correct';
      this.foundCount = foundCount;
      this.progressPercent = progressPercent;
      this.placeOneCount = appState.placeOneCount;
      AudioManager.playSFX('correct');
      if (this.vibrateOn) vibrateShort();
      if (foundCount === this.totalStars) this.onWin();
    },

    onHint() {
      if (this._gameOver) return;
      if (this.activeHint) return;
      if (this.hintCount <= 0) {
        this.buyHintCount = 1;
        this.showBuyHint = true;
        return;
      }
      appState.hintCount--;
      saveGameData();
      this.hintCount = appState.hintCount;

      const logicalHint = PuzzleGenerator.getLogicalHint(
        this._puzzle.regions, this.size, this.starsPerUnit,
        this.gridData, this.skinData.name, GameConfig.REGION_COLOR_NAMES
      );

      let contentText = '';
      let confirmBtnText = t('game.hint_mark_x');
      let actionsToApply = [];

      if (logicalHint) {
        contentText = logicalHint.reason;
        actionsToApply = logicalHint.actions;
        if (logicalHint.type === 'confirm') confirmBtnText = t('game.hint_fill_in');
      } else {
        const { size } = this;
        const candidates = [];
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (this._puzzle.solution[r][c] === 0 && this.gridData[r][c].state === 'empty') candidates.push({ r, c });
          }
        }
        if (candidates.length > 0) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          contentText = t('game.hint_complex');
          confirmBtnText = t('game.hint_x');
          actionsToApply = [{ r: target.r, c: target.c, state: 'marked' }];
        } else {
          return;
        }
      }

      for (const action of actionsToApply) {
        this.gridData[action.r][action.c].isHintPulse = true;
      }
      const ctxCells = (logicalHint && logicalHint.contextCells) || [];
      for (const cell of ctxCells) {
        this.gridData[cell.r][cell.c].isHintContext = true;
      }

      this.activeHint = {
        text: contentText,
        btnText: confirmBtnText,
        actions: actionsToApply,
        contextCells: ctxCells
      };

      if (this.vibrateOn) vibrateShort();
    },

    onApplyHint() {
      const hint = this.activeHint;
      if (!hint) return;
      if (this.vibrateOn) vibrateShort();
      if (hint.btnText.includes('X')) AudioManager.playSFX('mark');
      this.clearActiveHint();
      for (const action of hint.actions) {
        if (action.state === 'marked') {
          this.gridData[action.r][action.c].state = 'marked';
        } else if (action.state === 'correct') {
          this.confirmCrab(action.r, action.c);
        }
      }
    },

    clearActiveHint() {
      if (!this.activeHint) return;
      for (const action of this.activeHint.actions) {
        this.gridData[action.r][action.c].isHintPulse = false;
      }
      if (this.activeHint.contextCells) {
        for (const cell of this.activeHint.contextCells) {
          this.gridData[cell.r][cell.c].isHintContext = false;
        }
      }
      this.activeHint = null;
    },

    onClearAll() {
      if (this._gameOver) return;
      Modal.show({
        title: t('game.clear_marks_title'),
        content: t('game.clear_marks_content', {skinName: t(this.skinData.nameKey)}),
      }).then(res => {
        if (res.confirm) {
          this.gridData = this.gridData.map(row =>
            row.map(cell => ({
              ...cell,
              state: (cell.state === 'marked' || cell.state === 'wrong') ? 'empty' : cell.state,
            }))
          );
        }
      });
    },

    // ========== 导航 + 设置 + 广告 + 其余 ==========
    onNextLevel() {
      this._stopCelebrateAudio();
      if (this._typewriterTimer) { clearInterval(this._typewriterTimer); this._typewriterTimer = null; }
      if (this._typewriterTimeout) { clearTimeout(this._typewriterTimeout); this._typewriterTimeout = null; }
      const nextLevel = this.level + 1;
      const now = Date.now();
      const isInfinitePlay = appState.infinitePlayEndTime && appState.infinitePlayEndTime > now;
      if (nextLevel > 0 && !isInfinitePlay && appState.shells <= 0 && (appState.bonusShells || 0) <= 0) {
        this.showShellExchange = true;
        this.exchangeCount = 1;
        return;
      }

      this.level = nextLevel;
      this.showResult = false;
      this.isTutorial = false;
      this.tutStep = 0;
      this.tutTextNodes = null;
      this.tutTextBottomNodes = null;
      this.tutShowConfirmBtn = false;
      this.tutShowFingerAnim = false;
      this.tutFingerPos = null;
      this.tutHighlightCells = [];
      this.showTutArrowHint = false;
      this.showRuleHint = false;
      this.boardAnimClass = '';

      // 扣除贝壳（教程关不扣）
      if (nextLevel > 0) {
        const now = Date.now();
        const isInfinitePlay = appState.infinitePlayEndTime && appState.infinitePlayEndTime > now;
        if (!isInfinitePlay) {
          if ((appState.bonusShells || 0) > 0) {
            appState.bonusShells--;
          } else if (appState.shells > 0) {
            appState.shells--;
          }
          saveGameData();
          setTimeout(() => {
            this._playRewardAnim(IMG.shell, t('game.shell_minus'), null, 2);
          }, 600);
        }
        this.shells = appState.shells;
        this.updateShellsDisplay();
      }

      // 教程关 → 第1关：确认领取后赠送初始道具
      if (this.level === 1 && appState.tutorialDone && !appState.starterGiftGiven) {
        Modal.show({
          title: t('game.starter_title'),
          content: t('game.starter_content'),
          showCancel: false,
          cancelOnMask: false,
        }).then(res => {
          if (!res.confirm) return;

          appState.placeOneCount = (appState.placeOneCount || 0) + 2;
          appState.hintCount = (appState.hintCount || 0) + 5;
          appState.starterGiftGiven = true;
          saveGameData();

          this.placeOneCount = appState.placeOneCount;
          this._playRewardAnim(this.skinData.icon, t('game.starter_place2'), 'coin', 4);

          setTimeout(() => {
            this.hintCount = appState.hintCount;
            this._playRewardAnim(IMG.hint, t('game.starter_hint5'), 'coin', 4);
          }, 1600);
        });
      }

      // 第11关：通知玩家不再自动放置
      if (nextLevel === 11) {
        Modal.show({
          title: t('game.difficulty_title_zh'),
          content: t('game.difficulty_content_zh'),
        });
      }

      this.initLevel(nextLevel);
    },

    onRetry() {
      this._stopCelebrateAudio();
      this.showResult = false;
      this.adBoosted = false;
      this.boostedCoins = 0;

      if (this.mode === 'normal') {
        const now = Date.now();
        const isInfinitePlay = appState.infinitePlayEndTime && appState.infinitePlayEndTime > now;
        if (!isInfinitePlay) {
          if ((appState.bonusShells || 0) <= 0 && appState.shells <= 0) { Toast.show(t('game.shells_insufficient')); return; }
          if ((appState.bonusShells || 0) > 0) {
            appState.bonusShells--;
          } else {
            appState.shells--;
          }
          saveGameData();
        }
      }

      if (this.mode === 'survival') {
        this.initSurvival();
      } else if (this.mode === 'daily') {
        this.initDailyChallenge();
      } else {
        this.initLevel(this.level);
      }
    },

    onOpenSettings() {
      this.showSettings = true;
    },

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
      if (count >= 5) { Toast.show(t('game.daily_limit')); return; }
      var self = this;
      AdManager.showAd('coin_earn', function() {
        count++;
        localStorage.setItem(key, String(count));
        appState.coins += 30;
        saveGameData();
        self.coins = appState.coins;
        self.coinAdRemain = Math.max(0, 5 - count);
        self.showCoinAd = false;
        Toast.show(t('game.coins_30'), 'success');
      });
    },

    // ========== 金币兑换贝壳 ==========
    onBuyShells() {
      var isInfinite = appState.infinitePlayEndTime && appState.infinitePlayEndTime > Date.now();
      if (isInfinite) { Toast.show(t('game.infinite_active')); return; }
      if (appState.shells >= appState.maxShells) { Toast.show(t('game.shells_full')); return; }
      if (appState.coins < 20) { Toast.show(t('game.coins_insufficient')); return; }
      this.showShellExchange = true;
      this.exchangeCount = 1;
    },

    onCloseShellExchange() {
      this.showShellExchange = false;
    },

    onShellMinus() {
      if (this.exchangeCount > 1) this.exchangeCount--;
    },

    onShellPlus() {
      var maxBuy = Math.floor(appState.coins / 20);
      var maxExt = appState.maxShells - appState.shells;
      var limit = Math.min(maxBuy, Math.max(maxExt, 1), 8);
      if (this.exchangeCount < limit) this.exchangeCount++;
    },

    onConfirmExchange() {
      var count = this.exchangeCount;
      var cost = count * 20;
      if (appState.coins < cost) { Toast.show(t('game.coins_insufficient')); return; }
      if (appState.shells >= appState.maxShells) { Toast.show(t('game.shells_full')); return; }
      appState.coins -= cost;
      appState.shells = Math.min(appState.shells + count, appState.maxShells);
      saveGameData();
      this.coins = appState.coins;
      this.updateShellsDisplay();
      this.showShellExchange = false;
      Toast.show(t('game.earned_shells', {count: count}), 'success');
    },

    onCloseSettings() {
      this.showSettings = false;
    },

    onToggleMusic(e) {
      const on = e.target.checked;
      this.musicOn = on;
      AudioManager.setMusicOn(on);
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

    onExitGame() {
      this.showSettings = false;
      this._isRealLeave = true;
      Router.navigateToHome();
    },

    _stopCelebrateAudio() {
      AudioManager.stopCelebrate();
    },


    onWatchAdBoost() {
      if (!this.isFirstClear || this.adBoosted) return;
      AdManager.showAd('normal_boost', () => {
        const base = this.rewardCoins;
        const extra = base * 4;
        appState.coins += extra;
        saveGameData();
        this.coins = appState.coins;
        this.adBoosted = true;
        this.boostedCoins = base * 5;
        this.updateShellsDisplay();
      });
    },

    onWatchDailyAd() {
      AdManager.showAd('daily_boost', () => {
        const extraShells = this.dailyRewardShells;
        appState.bonusShells = (appState.bonusShells || 0) + extraShells;
        saveGameData();
        this.adBoosted = true;
        this.dailyRewardShells = this.dailyRewardShells + extraShells;
        this.updateShellsDisplay();
        Toast.show(t('game.stamina_doubled_toast'));
      });
    },

    onSurvivalDoubleRewards() {
      AdManager.showAd('survival_double', () => {
        const extraShells = this.survivalRewardShells;
        if (extraShells <= 0) { Toast.show(t('game.no_reward_double')); return; }
        appState.bonusShells = (appState.bonusShells || 0) + extraShells;
        saveGameData();
        this.survivalRewardDoubled = true;
        this.survivalRewardShells = this.survivalRewardShells + extraShells;
        this.updateShellsDisplay();
        Toast.show(t('game.stamina_doubled_toast'));
      });
    },

    onSurvivalReviveContinue() {
      AdManager.showAd('survival_continue', () => {
        this._gameOver = false;
        const newTime = Math.min(this.timeRemaining + 60, 999);
        const newHearts = Math.min(this.hearts + 1, 3);
        this.showResult = false;
        this.survivalReviveContinued = true;
        this.timeRemaining = newTime;
        this.hearts = newHearts;
        this._stopCelebrateAudio();
        this.initSurvivalRound(this.survivalRound + 1);
        this.startTimer();
      });
    },

    onSurvivalRetryFree() {
      const restart = () => {
        this._stopCelebrateAudio();
        this.showResult = false;
        this.initSurvival();
      };
      // 还有免费次数：扣掉一次直接重开（与首页 onSurvivalMode 口径一致）
      if (this.survivalHasFreeRemain) {
        const today = getLocalToday();
        const used = (appState.survivalPlayedDate === today) ? (appState.survivalPlayedCount || 0) : 0;
        appState.survivalPlayedDate = today;
        appState.survivalPlayedCount = used + 1;
        saveGameData();
        restart();
        return;
      }
      // 免费次数已用完：看广告重开
      AdManager.showAd('survival_retry', restart);
    },

    onDailyRevive() {
      AdManager.showAd('daily_revive', () => {
        this._gameOver = false;
        const newTime = Math.min(this.timeRemaining + 60, 999);
        const newHearts = Math.min(this.hearts + 1, 3);
        this.showResult = false;
        this.dailyRevived = true;
        this.timeRemaining = newTime;
        this.hearts = newHearts;
        this.startTimer();
      });
    },

    onDailyRetry() {
      AdManager.showAd('daily_retry', () => {
        this.onRetry();
      });
    },

    onSurvivalRevive() {
      AdManager.showAd('survival_revive', () => {
        this._gameOver = false;
        const newTime = Math.min(this.timeRemaining + 60, 999);
        const newHearts = Math.min(this.hearts + 1, 3);
        this.showResult = false;
        this.survivalRevived = true;
        this.timeRemaining = newTime;
        this.hearts = newHearts;
        this.startTimer();
      });
    },

    _applyNormalRevive() {
      this._gameOver = false;
      this.showResult = false;
      this.hearts = 3;
    },

    onShareNormalRevive() {
      this._loadNormalShareDailyCounts();
      if (!this.canShareRevive) { Toast.show(t('game.share_limit')); return; }
      ShareManager.share({
        title: t('game.share_title'),
        text: t('game.share_text'),
      }, () => {
        this._recordNormalShare('Revive');
        this._applyNormalRevive();
      });
    },

    onNormalRevive() {
      AdManager.showAd('normal_revive', () => {
        this._applyNormalRevive();
      });
    },

    onGoHome() {
      this._stopCelebrateAudio();
      this.showResult = false;
      this._isRealLeave = true;
      // 直接回首页，而非 navigateBack()，避免被防退出的额外 history 条目干扰
      Router.navigateToHome();
    },



    share() {
      ShareManager.share({
        title: t('game.share_title'),
        text: t('game.share_text'),
      });
    },

    preventBubble() {},
  }
};
