/**
 * WXSS → CSS 自动转换脚本
 * 
 * 功能：
 * 1. rpx → vw（1rpx = 100/750 vw ≈ 0.1333vw）
 * 2. page { } → .page { }
 * 3. 移除微信特有的 button::after { border: none } 等
 */

const fs = require('fs');
const path = require('path');

// 转换映射
const conversions = [
  // 文件名 → [源文件, 目标文件]
  ['app.wxss', 'css/global.css'],
  ['pages/home/home.wxss', 'css/home.css'],
  ['pages/game/game.wxss', 'css/game.css'],
  ['pages/map/map.wxss', 'css/map.css'],
  ['pages/shop/shop.wxss', 'css/shop.css'],
];

const baseDir = path.resolve(__dirname, '..');

function convertRpxToVw(css) {
  // 1. rpx → vw: 把数值rpx转为 vw
  //    匹配: 数字(可带小数和负号) + rpx
  css = css.replace(/([-\d.]+)rpx/g, (match, num) => {
    const val = parseFloat(num);
    const vw = (val * 100 / 750);
    // 保留合理精度
    const rounded = Math.round(vw * 100) / 100;
    if (rounded === 0) return '0';
    return rounded + 'vw';
  });

  // 2. page { → .page {（仅匹配独立的 page 选择器）
  css = css.replace(/(?<![a-zA-Z-])page\s*\{/g, '.page {');
  css = css.replace(/(?<![a-zA-Z-])page\s*,/g, '.page,');

  // 3. 移除或注释微信特有样式
  // button::after { display: none } — H5 不需要
  // 保留但加注释，不强制删除

  return css;
}

// 执行转换
for (const [src, dst] of conversions) {
  const srcPath = path.join(baseDir, src);
  const dstPath = path.join(baseDir, dst);

  if (!fs.existsSync(srcPath)) {
    console.log(`⚠️  跳过: ${src}（文件不存在）`);
    continue;
  }

  const wxss = fs.readFileSync(srcPath, 'utf-8');
  const css = convertRpxToVw(wxss);

  // 确保目标目录存在
  fs.mkdirSync(path.dirname(dstPath), { recursive: true });
  fs.writeFileSync(dstPath, css, 'utf-8');

  const lines = css.split('\n').length;
  console.log(`✅ ${src} → ${dst}（${lines} 行）`);
}

console.log('\n转换完成！');
