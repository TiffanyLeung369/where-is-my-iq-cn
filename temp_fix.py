import sys

content = """  margin-bottom: 32rpx;
  display: flex;
  justify-content: center; /* 让内部紧凑的 mask 整体居中 */
}

.rule-text {
  font-size: 28rpx;
  color: rgba(44, 95, 124, 0.6);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6rpx;
}

.rule-text-sub {
  font-size: 20rpx;
  color: rgba(44, 95, 124, 0.6);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6rpx;
  margin-top: 6rpx;
}

.typewriter-mask {
  display: inline-flex; /* 紧贴内容宽度，而非 100% */
  flex-direction: column;
  align-items: flex-start; /* 文本左对齐，配合从左到右的 clip-path */
  clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
  animation: typing 1.5s steps(30, end) forwards;
}
@keyframes typing {
  from { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
  to { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
}

.inline-icon {
  width: 24rpx;
  height: 24rpx;
  display: inline-block;
  vertical-align: middle;
}

/* ========== tutorial styles ========== */

.grid {
  display: flex;
  flex-direction: column;
  border-radius: 24rpx;
  padding: 8rpx;
  background: rgba(255, 255, 255, 0.6);
  gap: 6rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.grid-row {
  display: flex;
  gap: 6rpx;
}

.grid-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.15s ease;
  border-radius: 16rpx;
  box-sizing: border-box;
  border: none;
}

.grid-cell.border-top,
.grid-cell.border-bottom,
.grid-cell.border-left,
.grid-cell.border-right {
  /* 区域靠颜色区分 */
}

.grid-cell.correct {
  opacity: 0.95;
  box-shadow: inset 0 0 0 3rpx rgba(255, 255, 255, 0.5);
}

.grid-cell.wrong {
  opacity: 0.65;
}

.grid-cell.marked {
  opacity: 0.75;
}

.grid-cell:active {
  transform: scale(0.92);
}

/* ========== tutorial styles ========== */

.cell-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.cell-emoji {
  width: 80%;
  height: 80%;
  font-size: 36rpx;
}

/* ========== 001 款胖圆白/红叉叉 ========== */
.chubby-cross {
  position: relative;
  width: 65%;
  height: 65%;
}

.chubby-cross::before, .chubby-cross::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 28%; /* 控制胖瘦 */
  border-radius: 99rpx; /* 圆角 */
  transform: translate(-50%, -50%) rotate(45deg);
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.15); /* 增加一点厚度阴影 */
}

.chubby-cross::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.chubby-cross.red::before, .chubby-cross.red::after {
  background-color: #ff5e5e; /* 更明快通透的红色 */
}

.chubby-cross.white::before, .chubby-cross.white::after {
  background-color: #ffffff;
}

/* 内联说明栏中的缩微版尺寸修正 */
.chubby-cross.inline-cross {
  width: 24rpx;
  height: 24rpx;
  display: inline-block;
  vertical-align: middle;
  margin: 0 6rpx;
}
.chubby-cross.inline-cross::before, .chubby-cross.inline-cross::after {
  height: 26%;
  box-shadow: none;
}

/* X 标记旧版废弃（已改用胖叉） */
.cell-mark {
  width: 60%;
  height: 60%;
  color: #fff;
  font-weight: 900;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
  line-height: 1;
}

/* ========== tutorial styles ========== */

.crab-container {
  width: 92%;
  height: 92%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crab-img {
  width: 100%;
  height: 100%;
}

@keyframes dropIn {
  0% { transform: translateY(-200rpx) scale(0.5); opacity: 0; }
  30% { transform: translateY(0) scale(1.1); opacity: 1; }
  45% { transform: translateY(-40rpx) scale(0.95); }
  60% { transform: translateY(0) scale(1.05); }
  75% { transform: translateY(-15rpx) scale(0.98); }
  85% { transform: translateY(0) scale(1.02); }
  100% { transform: translateY(0) scale(1); }
}

.animate-dropIn {
  animation: dropIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes idle {
  0% { transform: rotate(0deg) scale(1); }
  15% { transform: rotate(3deg) scale(1.02); }
  30% { transform: rotate(0deg) scale(1); }
  45% { transform: rotate(-3deg) scale(1.02); }
  60% { transform: rotate(0deg) scale(1); }
  100% { transform: rotate(0deg) scale(1); }
}

.animate-idle {
  animation: idle 3s ease-in-out 0.8s infinite;
}

/* X 标记 */
.cell-mark {
  width: 60%;
  height: 60%;
  color: #fff;
  font-weight: 900;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
  line-height: 1;
}

/* ========== tutorial styles ========== */

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.08); opacity: 1; }
  70% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

.animate-bounceIn {
  animation: bounceIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8rpx); }
  40% { transform: translateX(8rpx); }
  60% { transform: translateX(-4rpx); }
  80% { transform: translateX(4rpx); }
}

.animate-shake {
  animation: shake 0.4s ease;
}

/* ========== tutorial styles ========== */

.progress-bar {
  width: 100%;
  padding: 24rpx 8rpx 0; 
  box-sizing: border-box;
  margin-bottom: 80rpx; /* 这里是008图中横线到工具栏的巨大缝隙 */
}

.progress-text {
  font-size: 28rpx;
  color: #2c5f7c;
  display: block;
  text-align: center;
  font-weight: 500;
  margin-bottom: 12rpx;
}

.progress-track {
  width: 100%;
  height: 3rpx; /* 008图中的细线索 */
  background: rgba(255, 255, 255, 0.4);
  border-radius: 4rpx;
}

.progress-fill {
  height: 100%;
  background: #ffffff;
  border-radius: 4rpx;
  transition: width 0.4s ease;
}

/* ========== tutorial styles ========== */

.bottom-bar {
  display: flex;
  justify-content: space-evenly;
  align-items: flex-start;
  width: 100%;
  padding: 0 24rpx;
  box-sizing: border-box;
  /* 移除 margin-top: auto 取消强行吸底，让底部自然产生巨大留白 */
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.65);
  border-radius: 24rpx;
  width: 140rpx;
  height: 140rpx;
  box-shadow: 0 4rpx 12rpx rgba(44, 95, 124, 0.1);
  transition: all 0.15s ease;
}

.tool-btn:active {
  transform: scale(0.9);
  background: rgba(255, 255, 255, 0.9);
}

.tool-icon {
  width: 56rpx;
  height: 56rpx;
  margin-bottom: 8rpx;
}

.tool-name {
  font-size: 28rpx;
  color: #2c5f7c;
  font-weight: 500;
  line-height: 1.2;
}
"""

with open('pages/game/game.wxss', 'r', encoding='utf-8') as f:
    orig = f.read()
lines = orig.split('\n')

idx = -1
for i, line in enumerate(lines):
    if line.startswith('.tool-count {'):
        idx = i
        break

if idx != -1:
    lines.insert(idx, content)
    with open('pages/game/game.wxss', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print('Fixed!')
else:
    print('Not found')
