import re
import os

filepath = 'c:/Users/user/.gemini/antigravity/scratch/藏在哪小程序/pages/game/game.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add fields to data
data_fields = """    // 教程专用
    isTutorial: false,
    tutStep: 0,
    tutHighlightCells: [],
    tutTextNodes: null,
    tutTextBottomNodes: null,
    tutShowConfirmBtn: false,
    tutShowFingerAnim: false,
    tutFingerPos: null,
    isLevel1Guide: false,
    level1GuideStep: 0,"""

content = content.replace("mode: 'normal',", "mode: 'normal',\n" + data_fields)

# 2. Add initTutorial and advanceTutStep methods right before initLevel
init_tutorial_code = """
  // ========== 教程与引导逻辑 ==========
  initTutorial() {
    this._gameOver = false;
    const size = 4;
    // 硬编码 4x4, 确保螃蟹在(0, 1), 即第1行第2列
    const regions = [
      [0, 1, 1, 2],
      [0, 1, 3, 2],
      [0, 0, 3, 3],
      [2, 2, 2, 3]
    ];
    // 答案: (0,1), (1,3), (2,0), (3,2)
    const solution = [
      [0, 1, 0, 0],
      [0, 0, 0, 1],
      [1, 0, 0, 0],
      [0, 0, 1, 0]
    ];

    const puzzle = { size, starsPerUnit: 1, regions, solution };
    this._puzzle = puzzle;

    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.windowWidth;
    const ratio = 750 / screenWidth;
    const pagePadding = 20;
    const reservePx = 30;
    const availableWidth = screenWidth - pagePadding * 2 - reservePx;
    const cellSizePx = Math.floor(availableWidth / size);
    const cellSize = Math.floor(cellSizePx * ratio);

    const gridData = this.buildGridData(puzzle, size);

    this.setData({
      isTutorial: true,
      tutStep: 0,
      size,
      starsPerUnit: 1,
      totalStars: 4,
      foundCount: 0,
      progressPercent: 0,
      hearts: 3,
      maxHearts: 3,
      errors: 0,
      cellSize,
      gridData,
      showResult: false,
      showRuleHint: false,
      boardAnimClass: 'board-intro-anim',
      pageReady: true
    });

    setTimeout(() => {
      this.advanceTutStep(1);
    }, 800);
  },

  advanceTutStep(step) {
    this.setData({ tutStep: step });
    const { skin } = this.data;
    const skinName = skin.name;

    if (step === 1) {
      this.setData({
        tutShowFingerAnim: true,
        tutFingerPos: { row: 0, col: 1 },
        tutTextNodes: [
          { name: 'span', attrs: { style: 'color:#FF4444;font-weight:bold;' }, children: [{ type: 'text', text: '“连点两下”' }] },
          { type: 'text', text: '把' + skinName + '放在格子里' }
        ],
        tutTextBottomNodes: null,
        tutHighlightCells: [{ r: 0, c: 1 }],
      });
    } else if (step === 3) {
      this.setData({
        tutShowFingerAnim: false,
        tutTextNodes: [
          { type: 'text', text: '太棒了！' },
          { name: 'img', attrs: { src: '/images/check.png', style: 'width: 40rpx; height: 40rpx; vertical-align: bottom; margin-left: 8rpx;' } },
          { type: 'text', text: ' 一种' },
          { name: 'span', attrs: { style: 'color:#FF4444;font-weight:bold;' }, children: [{ type: 'text', text: '“颜色”' }] },
          { type: 'text', text: '只准放' },
          { name: 'span', attrs: { style: 'color:#FF4444;font-weight:bold;' }, children: [{ type: 'text', text: '“一只”' }] },
          { type: 'text', text: skinName + '。' }
        ],
        tutTextBottomNodes: null,
        tutShowConfirmBtn: true,
        tutHighlightCells: [],
      });
    } else if (step === 4) {
      this.setData({
        tutShowConfirmBtn: false,
        tutTextNodes: [
          { type: 'text', text: skinName },
          { name: 'span', attrs: { style: 'color:#FF4444;font-weight:bold;' }, children: [{ type: 'text', text: '“四周”' }] },
          { type: 'text', text: '不能有另一只' + skinName + '。' }
        ],
        tutTextBottomNodes: [{ type: 'text', text: '点一下这些空格，排除它们。' }],
        tutHighlightCells: [
          { r: 0, c: 0 }, { r: 0, c: 2 },
          { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }
        ],
      });
    } else if (step === 5) {
      this.setData({
        tutTextNodes: [
          { type: 'text', text: '太棒了！' },
          { name: 'img', attrs: { src: '/images/check.png', style: 'width: 40rpx; height: 40rpx; vertical-align: bottom; margin-left: 8rpx;' } },
          { type: 'text', text: ' ' + skinName + '不能在' },
          { name: 'span', attrs: { style: 'color:#FF4444;font-weight:bold;' }, children: [{ type: 'text', text: '“同一行或同一列”' }] },
          { type: 'text', text: '出现。' }
        ],
        tutTextBottomNodes: null,
        tutHighlightCells: [
          { r: 0, c: 3 },
          { r: 2, c: 1 },
          { r: 3, c: 1 }
        ],
      });
    } else if (step === 6) {
      // 动态获取颜色名
      const regionId = this.data.gridData[1][3].region; // 位于 (1,3)
      const cName = REGION_COLOR_NAMES[regionId % REGION_COLOR_NAMES.length];
      
      this.setData({
        tutShowFingerAnim: true,
        tutFingerPos: { row: 1, col: 3 },
        tutTextNodes: null,
        tutTextBottomNodes: [
          { type: 'text', text: '只剩' },
          { name: 'span', attrs: { style: 'color:#FF4444;font-weight:bold;' }, children: [{ type: 'text', text: '“最后的' + cName + '格子”' }] },
          { type: 'text', text: '了，连点两下放' + skinName + '吧' }
        ],
        tutHighlightCells: [{ r: 1, c: 3 }]
      });
    } else if (step === 7) {
      const hl = [];
      for (let r=0; r<4; r++) {
        for (let c=0; c<4; c++) {
          if (this.data.gridData[r][c].state === 'empty') hl.push({r, c});
        }
      }
      this.setData({
        tutShowFingerAnim: false,
        tutTextNodes: [{ type: 'text', text: '最后两只' + skinName + '藏在哪，你找到了吗？' }],
        tutTextBottomNodes: [{ type: 'text', text: '如需提示，请点击这里' }],
        tutHighlightCells: hl,
        showTutArrowHint: true
      });
    } else if (step === 8) {
       this.setData({ showTutArrowHint: false });
    }
  },

  onTutConfirm() {
    audioManager.playSFX('click');
    if (this.data.tutStep === 3) {
      this.advanceTutStep(4);
    }
  },

  checkLevel1GuideStart(targetPos) {
    this.setData({
      isLevel1Guide: true,
      level1GuideStep: 1,
      tutTextBottomNodes: [{ type: 'text', text: '螃蟹四周不能有其他螃蟹，划动格子排除' }],
    });
    // 高亮四周
    const hl = [];
    const { r, c } = targetPos;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < this.data.size && nc >= 0 && nc < this.data.size) {
          hl.push({ r: nr, c: nc });
        }
      }
    }
    this.setData({ tutHighlightCells: hl });
  },

  checkTutOrGuideProgress() {
    if (this.data.isTutorial) {
      const { tutStep, tutHighlightCells, gridData } = this.data;
      if (tutStep === 4 || tutStep === 5) {
        let allMarked = true;
        for (const cell of tutHighlightCells) {
          if (gridData[cell.r][cell.c].state !== 'marked') {
            allMarked = false; break;
          }
        }
        if (allMarked) {
          setTimeout(() => {
            if (tutStep === 4) this.advanceTutStep(5);
            else if (tutStep === 5) this.advanceTutStep(6);
          }, 400);
        }
      }
    } else if (this.data.isLevel1Guide) {
      const { level1GuideStep, tutHighlightCells, gridData } = this.data;
      let allMarked = true;
      for (const cell of tutHighlightCells) {
        if (gridData[cell.r][cell.c].state !== 'marked') {
          allMarked = false; break;
        }
      }
      if (allMarked) {
        if (level1GuideStep === 1) {
          setTimeout(() => {
            const r = this.level1TargetPos.r;
            const c = this.level1TargetPos.c;
            const hl = [];
            for (let i = 0; i < this.data.size; i++) {
              if (i !== c && gridData[r][i].state === 'empty') hl.push({ r, c: i });
              if (i !== r && gridData[i][c].state === 'empty') hl.push({ r: i, c });
            }
            this.setData({
              level1GuideStep: 2,
              tutHighlightCells: hl,
              tutTextBottomNodes: [{ type: 'text', text: '同行同列也不能有其他螃蟹' }]
            });
          }, 400);
        } else if (level1GuideStep === 2) {
          setTimeout(() => {
             this.setData({ isLevel1Guide: false, tutHighlightCells: [], tutTextBottomNodes: null });
          }, 400);
        }
      }
    }
  },
  // ========== 教程与引导逻辑结束 ==========
"""

content = content.replace("  /**\n   * 初始化关卡\n   */\n  initLevel(level) {", init_tutorial_code + "\n  /**\n   * 初始化关卡\n   */\n  initLevel(level) {")

# 3. Add onLoad hook
content = content.replace("""    if (mode === 'daily') {
      this.initDailyChallenge();
    } else if (mode === 'survival') {
      this.initSurvival();
    } else {
      this.initLevel(level);
    }""", """    if (mode === 'daily') {
      this.initDailyChallenge();
    } else if (mode === 'survival') {
      this.initSurvival();
    } else {
      if (level == 0) {
        this.initTutorial();
      } else {
        this.initLevel(level);
      }
    }""")

# 4. Modify initLevel to hook level1Guide
target_gift = """      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        gridData[target.r][target.c].state = 'correct';
        initialFoundCount = 1;
      }"""
replacement_gift = """      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        gridData[target.r][target.c].state = 'correct';
        initialFoundCount = 1;
        
        if (config.isLevel1Guide) {
          this.level1TargetPos = target;
          setTimeout(() => {
            this.checkLevel1GuideStart(target);
          }, 1000);
        }
      }"""
content = content.replace(target_gift, replacement_gift)

# 5. Modify onCellTap restrictions
cell_tap_target = """    const { row, col } = e.currentTarget.dataset;
    const cell = this.data.gridData[row][col];

    // 已确认的格子不可操作
    if (cell.state === 'correct' || cell.state === 'wrong') return;"""
cell_tap_replacement = """    const { row, col } = e.currentTarget.dataset;
    
    // 教程模式下限制点击范围
    if (this.data.isTutorial && this.data.tutStep <= 7) {
      if (this.data.tutStep === 3) return; // 弹框等待点击明白了
      const allowed = this.data.tutHighlightCells.some(c => c.r === row && c.c === col);
      if (!allowed) return;
    } else if (this.data.isLevel1Guide) {
      const allowed = this.data.tutHighlightCells.some(c => c.r === row && c.c === col);
      if (!allowed) return;
    }

    const cell = this.data.gridData[row][col];

    // 已确认的格子不可操作
    if (cell.state === 'correct' || cell.state === 'wrong') return;"""
content = content.replace(cell_tap_target, cell_tap_replacement)

# 6. Modify confirmCrab
confirm_crab_target = """      // 检查是否全部找到
      if (foundCount === this.data.totalStars) {
        this.onWin();
      }"""
confirm_crab_replacement = """      if (this.data.isTutorial) {
        if (this.data.tutStep === 1) {
          setTimeout(() => { this.advanceTutStep(3); }, 500);
        } else if (this.data.tutStep === 6) {
          setTimeout(() => { this.advanceTutStep(7); }, 500);
        } else if (this.data.tutStep === 7) {
          if (foundCount === this.data.totalStars) {
            setTimeout(() => { this.advanceTutStep(8); }, 500);
          }
        }
      }

      // 检查是否全部找到
      if (foundCount === this.data.totalStars) {
        this.onWin();
      }"""
content = content.replace(confirm_crab_target, confirm_crab_replacement)

# 7. Modify toggleMark and _markCell to trigger checkTutOrGuideProgress
toggle_mark_target = """    this.setData({ [key]: newState });
    audioManager.playSFX(isMarking ? 'mark' : 'unmark');"""
toggle_mark_replacement = """    this.setData({ [key]: newState });
    audioManager.playSFX(isMarking ? 'mark' : 'unmark');
    if (isMarking) this.checkTutOrGuideProgress();"""
content = content.replace(toggle_mark_target, toggle_mark_replacement)

mark_cell_target = """      // 批量标记
      if (cell.state === 'empty') {
        this.setData({ [key]: 'marked' });
        audioManager.playSFX('mark');
      }"""
mark_cell_replacement = """      // 批量标记
      if (cell.state === 'empty') {
        this.setData({ [key]: 'marked' });
        audioManager.playSFX('mark');
        this.checkTutOrGuideProgress();
      }"""
content = content.replace(mark_cell_target, mark_cell_replacement)

# 8. Modify onWin to handle tutorial completion and hide unnecessary buttons
on_win_target = """    if (this.data.mode === 'daily') {"""
on_win_replacement = """    if (this.data.isTutorial) {
      app.globalData.tutorialDone = true;
      app.globalData.currentLevel = Math.max(app.globalData.currentLevel, 1);
      app.saveGameData();
    }
    if (this.data.mode === 'daily') {"""
content = content.replace(on_win_target, on_win_replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Game.js updated successfully")
