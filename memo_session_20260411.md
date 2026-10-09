# 会话备忘录 — 2026-04-11（会话 0200ca19）

## 一、本次会话完成的工作

### 1. 首页模式卡片宽度对齐 (已完成 ✅)
- **需求**：首页"每日挑战"和"生存模式"卡片宽度与上方"皮肤"和"岛屿"入口按钮左右对齐
- **问题根因**：`flex: 1` 在微信小程序中受 `min-width: auto` 影响，内容多的卡片会被撑宽
- **解决方案**：`.mode-card` 改用 `width: calc(50% - 10rpx); flex: none; box-sizing: border-box`
- **涉及文件**：`pages/home/home.wxss`（`.mode-card` 类）

### 2. 皮肤衣柜标题字号缩小 (已完成 ✅)
- **需求**：保持字体风格（800加粗 + 字间距12rpx + 深海蓝 `#1A5F7A`），仅缩小字号
- **修改**：`.shop-title` 的 `font-size` 从 `52rpx` → `36rpx`
- **涉及文件**：`pages/shop/shop.wxss`

### 3. 皮肤衣柜版面垂直居中 (已完成 ✅)
- **需求**：整体内容上下居中，消除底部大面积空白
- **修改**：`.page` 添加 `justify-content: center`
- **涉及文件**：`pages/shop/shop.wxss`

### 4. 每日挑战成功面板布局优化 (已完成 ✅)
- **需求**："今日挑战成功！"文字需一行显示，不被螃蟹图标挤成两行
- **修改**：将 `c007-skin-icon` 从 `c007-title-row` 内移出，放到标题行上方独立一行
- **涉及文件**：`pages/home/home.wxml`（c007-win-panel 区域）

### 5. 每日挑战广告图标逻辑 (已完成 ✅)
- **需求**：若没挑战成功又用完了免费次数，橙色按钮右上角脉动显示广告 icon，副标题变为"（看广告继续挑战）"
- **新增变量**：`dailyNeedAd = !hasPlayedDaily && dailyFreeUsed`（未通关但已用免费次数）
- **WXML 改动**：
  - 橙色按钮上条件渲染 `btn-ad-icon-corner`（脉动动画已复用生存模式的 `bounceAd`）
  - 副标题根据 `dailyNeedAd` 在"(免费次数 1/1)"和"(看广告继续挑战)"之间切换
- **涉及文件**：`pages/home/home.js`、`pages/home/home.wxml`

### 6. 生存模式文案统一 (已完成 ✅)
- **修改**：副标题从"(看视频继续挑战)" → "(看广告继续挑战)"
- **涉及文件**：`pages/home/home.wxml`

---

## 二、当前测试状态 ⚠️

### home.js 中的测试覆盖（需在上线前移除）
```js
// 第 80-84 行：清空每日通关记录
wx.removeStorageSync('dailyPlayedDate');
wx.removeStorageSync('dailyChallengeLastWin');
app.globalData.dailyPlayedDate = '';

// 第 86 行：强制设为未通关
const hasPlayedDaily = false;

// 第 88 行：强制显示广告图标（测试用）
const dailyNeedAd = true; // ← 需还原为：!hasPlayedDaily && dailyFreeUsed
```

---

## 三、历史已完成工作（承接上一轮）

### 全局庆祝特效标准化 ✅
- 40片慢速飘落彩带 + 24片底部双向爆发礼炮
- CSS 动画定义在 `app.wxss`，规范文档：`confetti_component_spec.md`

### 皮肤衣柜 (Shop) UI 重构 ✅
- 自定义导航栏 + 标题"皮肤衣柜" + 左上角 home.png + 右侧金币栏
- 按钮颜色：使用中=橙色渐变，未解锁/看广告=绿色渐变

### 全局图标规范 ✅
- 无正片叠底，所有 icon 保持原图色彩
- 主页返回图标统一使用 `/images/home.png`（蓝白矢量版）

### 全局资产栏统一 ✅
- `.asset-item` 胶囊样式定义在 `app.wxss`，已部署到首页、衣柜、游戏结算

---

## 四、当前文件状态速查

| 文件 | 关键修改内容 |
|------|-------------|
| `app.wxss` | 无正片叠底 + 庆典动画 + 全局资产胶囊样式 |
| `app.json` | 4页面: home, game, shop, map |
| `home.wxml` | 螃蟹图标移至标题行上方 + 每日按钮广告图标条件渲染 + 生存模式文案统一 |
| `home.wxss` | `.mode-card` 改用 `calc(50% - 10rpx)` 固定宽度 |
| `home.js` | 新增 `dailyNeedAd` + `dailyFreeUsed` 变量（含测试覆盖） |
| `shop.wxss` | 标题字号 36rpx + 页面垂直居中 |

---

## 五、未完成/待确认的需求

### 广告脉动图标样式确认
- **状态**：代码已实现，等待用户在微信开发者工具中重新编译后确认效果
- **确认方式**：重新编译小程序（非仅返回），首页每日挑战按钮应显示脉动广告图标

---

## 六、重要开发规范（沿用）

### ⚠️ 禁止使用 Python 脚本修改项目源文件！
所有文件修改必须通过 IDE 原生工具进行，确保编码和格式正确。

### ⚠️ 微信开发者工具缓存问题
修改 `*.json` 配置后，必须完全关闭并重新打开微信开发者工具。

### 设计规范速查
- **所有 icon 不做透明处理、不做正片叠底**
- **主页返回图标**：统一使用 `/images/home.png`（蓝白矢量版）
- **资产栏**：统一用 `.asset-item` 胶囊样式（定义在 `app.wxss`）
- **庆祝特效**：使用 `confetti_component_spec.md` 中的标准代码块
- **标题字体风格**：800加粗、字间距12rpx、深海蓝 `#1A5F7A`
- **脉动广告图标规范（全局统一）**：
  - 定位：`position: absolute; top: -16rpx; right: 10rpx;`（不贴边，留透气空间）
  - 大按钮（结算页等）用 `.pulse-corner`：`64rpx × 64rpx`
  - 小按钮（首页卡片等）用 `.btn-ad-icon-corner`：`56rpx × 56rpx`
  - 旋转角度：`rotate(12deg)`
  - 动画：`bounceAd 2s infinite ease-in-out`
  - 关键帧：`0%/100% → translateY(0) rotate(12deg) scale(1)` / `50% → translateY(-8rpx) rotate(18deg) scale(1.08)`
  - 投影：`drop-shadow(0 4rpx 8rpx rgba(0,0,0,0.2))`
  - 图片源：`/images/ad_icon_transparent.png`
  - ⚠️ 今后所有新增的按钮右上角脉动图标，必须复用此规范，不允许自行定义新的定位参数

---

## 七、项目核心文件路径
```
藏在哪小程序/
├── app.js              # 全局数据、皮肤配置
├── app.json            # 页面注册
├── app.wxss            # 全局样式（庆典动画、资产胶囊、工具类）
├── images/             # 所有图标素材
│   ├── home.png        # 主页返回图标（蓝白矢量版）
│   ├── coin.png        # 金币图标
│   ├── shell.png       # 贝壳图标
│   └── ad_icon_transparent.png  # 铅笔画视频广告图标
├── pages/
│   ├── home/           # 首页
│   ├── game/           # 游戏 + 所有结算页面
│   ├── shop/           # 皮肤衣柜
│   └── map/            # 岛屿地图
└── confetti_component_spec.md  # 庆祝特效规范文档
```
