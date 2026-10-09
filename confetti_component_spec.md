# 全局标准组件：庆典彩带与礼炮系统 (Confetti & Cannon)

## 重要指示 (Locked)
此组件及其参数配置已被用户锁定。**不可随意更改其下落时间、生成数量或粒子动画速度**。任何后续新增的“需要彩带/庆祝”的页面（如新签到、新成就、新抽奖等）均应原封不动地复制或复用此套代码。

## 视觉构成
1. **全屏飘落彩带 (`confetti-container`)**:
   - 包含 40 个独立碎片（方块、长条、圆饼）。
   - CSS 动画下落时间：延展为 `3.6s - 5.4s` 以实现“极其缓慢柔和飘落”的质感。
2. **中心向外散射爆发礼炮 (`cannon-container`)**:
   - 左下角/右下角各自 12 个（共24个）高速粒子，在 1.0~1.6s 的极短时间内向上爆发抛射再消散，与缓慢下落形成动静相宜的对比。

---

## 1. WXML 结构模板

将以下代码置于弹窗全屏的最底层或固定定位的最高层：

```html
<!-- 全屏飘落大彩带 (慢速飘落 40 片) -->
<view class="confetti-container">
  <view class="confetti c1" style="width: 25rpx; height: 25rpx;"></view>
  <view class="confetti c2" style="width: 22rpx; height: 22rpx;"></view>
  <view class="confetti c3" style="width: 24rpx; height: 24rpx;"></view>
  <view class="confetti c4" style="width: 26rpx; height: 26rpx;"></view>
  <view class="confetti c5" style="width: 20rpx; height: 20rpx;"></view>
  <view class="confetti c6" style="width: 23rpx; height: 23rpx;"></view>
  <view class="confetti c7" style="width: 25rpx; height: 25rpx;"></view>
  <view class="confetti c8" style="width: 21rpx; height: 21rpx;"></view>
  <view class="confetti c9" style="width: 24rpx; height: 24rpx;"></view>
  <view class="confetti c10" style="width: 22rpx; height: 22rpx;"></view>
  <view class="confetti c11" style="width: 26rpx; height: 26rpx;"></view>
  <view class="confetti c12" style="width: 20rpx; height: 20rpx;"></view>
  <view class="confetti c13" style="width: 25rpx; height: 25rpx;"></view>
  <view class="confetti c14" style="width: 22rpx; height: 22rpx;"></view>
  <view class="confetti c15" style="width: 24rpx; height: 24rpx;"></view>
  <view class="confetti c16" style="width: 26rpx; height: 26rpx;"></view>
  <view class="confetti c17" style="width: 20rpx; height: 20rpx;"></view>
  <view class="confetti c18" style="width: 23rpx; height: 23rpx;"></view>
  <view class="confetti c19" style="width: 25rpx; height: 25rpx;"></view>
  <view class="confetti c20" style="width: 21rpx; height: 21rpx;"></view>
  <view class="confetti c21" style="width: 24rpx; height: 24rpx;"></view>
  <view class="confetti c22" style="width: 22rpx; height: 22rpx;"></view>
  <view class="confetti c23" style="width: 26rpx; height: 26rpx;"></view>
  <view class="confetti c24" style="width: 20rpx; height: 20rpx;"></view>
  <view class="confetti c25" style="width: 25rpx; height: 35rpx;"></view>
  <view class="confetti c26" style="width: 22rpx; height: 30rpx;"></view>
  <view class="confetti c27" style="width: 24rpx; height: 24rpx;"></view>
  <view class="confetti c28" style="width: 26rpx; height: 26rpx;"></view>
  <view class="confetti c29" style="width: 20rpx; height: 32rpx;"></view>
  <view class="confetti c30" style="width: 23rpx; height: 23rpx;"></view>
  <view class="confetti c31" style="width: 14rpx; height: 14rpx;"></view>
  <view class="confetti c32" style="width: 12rpx; height: 12rpx;"></view>
  <view class="confetti c33" style="width: 16rpx; height: 16rpx;"></view>
  <view class="confetti c34" style="width: 10rpx; height: 10rpx;"></view>
  <view class="confetti c35" style="width: 15rpx; height: 15rpx;"></view>
  <view class="confetti c36" style="width: 18rpx; height: 18rpx;"></view>
  <view class="confetti c37" style="width: 12rpx; height: 12rpx;"></view>
  <view class="confetti c38" style="width: 14rpx; height: 14rpx;"></view>
  <view class="confetti c39" style="width: 11rpx; height: 11rpx;"></view>
  <view class="confetti c40" style="width: 17rpx; height: 17rpx;"></view>
</view>

<!-- 左右下方礼炮喷射极致阵列 (24 枚碎片) -->
<view class="cannon-container">
  <view class="cannon-particle cp-l1"></view>
  <view class="cannon-particle cp-l2"></view>
  <view class="cannon-particle cp-l3"></view>
  <view class="cannon-particle cp-l4"></view>
  <view class="cannon-particle cp-l5"></view>
  <view class="cannon-particle cp-l6"></view>
  <view class="cannon-particle cp-l7"></view>
  <view class="cannon-particle cp-l8"></view>
  <view class="cannon-particle cp-l9"></view>
  <view class="cannon-particle cp-l10"></view>
  <view class="cannon-particle cp-l11"></view>
  <view class="cannon-particle cp-l12"></view>
  
  <view class="cannon-particle cp-r1"></view>
  <view class="cannon-particle cp-r2"></view>
  <view class="cannon-particle cp-r3"></view>
  <view class="cannon-particle cp-r4"></view>
  <view class="cannon-particle cp-r5"></view>
  <view class="cannon-particle cp-r6"></view>
  <view class="cannon-particle cp-r7"></view>
  <view class="cannon-particle cp-r8"></view>
  <view class="cannon-particle cp-r9"></view>
  <view class="cannon-particle cp-r10"></view>
  <view class="cannon-particle cp-r11"></view>
  <view class="cannon-particle cp-r12"></view>
</view>
```

当后续有新页面需要添加此组件时，可根据需要考虑是否单独抽离为 `components/confetti/` 小程序组件以便全局复用，或直接引入对应 WXML 骨架并引用 WXSS 样式文件。
