# BonusShells 奖励系统实现备忘录

**实现日期**：2024年9月20日

## 需求背景

用户要求将岛屿满星礼物箱和每日打卡中的贝壳奖励统一为特殊的"奖励贝壳（bonusShells）"系统，与普通的自动恢复贝壳（shells）区分开来。

**原因**：让玩家清楚区分两种贝壳来源，避免贝壳满了（6/6）时奖励被丢弃的问题。

**规则**：
- 岛屿满星和每日打卡的贝壳奖励统统加到 `bonusShells`，无论 `shells` 是否已满
- 在礼物箱弹窗中，贝壳奖励图标右上角显示红色徽章（显示数量）
- 在主页贝壳图标上方显示红色数字徽章，表示当前 bonusShells 总数

## 修改的文件

### 1. js/pages/map.js

**buildLotteryResult() 函数（第 457-475 行）**：
- 检测奖励中是否包含贝壳（`reward.field === 'shells'`）
- 如果包含贝壳，设置 `reward.showBonusBadge = true` 标记
- 礼物箱弹窗模板中，根据 `showBonusBadge` 在贝壳图标右上角显示红色徽章

**onClaimPrize() 函数（第 509-520 行）**：
```javascript
// 岛屿满星的贝壳奖励统一加到 bonusShells
if (reward.field === 'shells') {
  appState.bonusShells = (appState.bonusShells || 0) + reward.value;
} else {
  appState[reward.field] = (appState[reward.field] || 0) + reward.value;
}
```

### 2. js/pages/home.js

**每日打卡奖励发放逻辑（第 1084-1111 行）**：
- Day 1：贝壳 x1 → 加到 `bonusShells`
- Day 4：贝壳 x2 + 提示 x1 → 贝壳加到 `bonusShells`
- Day 6：贝壳 x2 + 自动放置 x1 + 提示 x1 → 贝壳加到 `bonusShells`

修改前：`appState.shells = Math.min(appState.shells + value, appState.maxShells);`
修改后：`appState.bonusShells = (appState.bonusShells || 0) + value;`

### 3. css/map.css

**红色徽章样式（第 440-453 行）**：
```css
.gb-bonus-badge {
  position: absolute;
  top: -1.5vw;
  right: -1.5vw;
  min-width: 4.8vw;
  height: 4.8vw;
  background: linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%);
  border: 0.53vw solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.2vw;
  font-weight: bold;
  color: white;
  box-shadow: 0 0.53vw 1.07vw rgba(0, 0, 0, 0.25);
  z-index: 10;
  padding: 0 1.07vw;
}
```

## 测试状态

**服务器状态**：
- 开发服务器已在 http://localhost:8000 成功启动
- Claude Code 右侧预览面板已成功加载游戏界面

**测试环境设置**：
- 贝壳：6/6 Full
- bonusShells：0
- 每日打卡：Day 1 可领取
- 岛屿礼物箱：已重置，可重新领取

**待测试功能**：
1. 岛屿满星礼物箱中的贝壳奖励显示红色徽章
2. 领取后贝壳加到 bonusShells
3. 主页贝壳图标上方显示红色数字徽章
4. 每日打卡的贝壳奖励加到 bonusShells

## 技术细节

**贝壳系统区分**：
- **普通贝壳（shells）**：通过时间自动恢复（每 60 秒 +1），上限 6 个
- **奖励贝壳（bonusShells）**：通过岛屿满星和每日打卡获得，带红色徽章标识，无上限

**红色徽章位置**：
- 礼物箱弹窗：贝壳图标右上角，显示奖励数量
- 主页：贝壳图标上方，显示当前 bonusShells 总数

**已排除的奖励**：
- 无限循环奖励（infinite30/infinite60）不显示红色徽章
- 自动放置道具和提示道具不受影响
