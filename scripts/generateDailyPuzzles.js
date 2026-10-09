/**
 * 离线预生成每日挑战谜题池
 * 用法：node scripts/generateDailyPuzzles.js
 * 输出：utils/dailyPuzzles.json
 */

const { generatePuzzle } = require('../utils/puzzleGenerator');

const TOTAL = 365; // 生成一年的量
const SIZE = 12;
const STARS_PER_UNIT = 1;

console.log(`开始预生成 ${TOTAL} 个 ${SIZE}×${SIZE} 每日挑战谜题...`);
console.log('这可能需要几分钟，请耐心等待。\n');

const puzzles = [];
let attempts = 0;

while (puzzles.length < TOTAL) {
  attempts++;
  const puzzle = generatePuzzle(SIZE, STARS_PER_UNIT, null); // 不限难度，确保成功率
  if (puzzle && puzzle.size === SIZE) {
    puzzles.push({
      regions: puzzle.regions,
      solution: puzzle.solution,
      difficulty: puzzle.difficulty,
      size: puzzle.size,
      starsPerUnit: puzzle.starsPerUnit,
    });
    if (puzzles.length % 10 === 0) {
      console.log(`  ✅ 已生成 ${puzzles.length}/${TOTAL} (尝试次数: ${attempts})`);
    }
  }
}

console.log(`\n全部完成！共尝试 ${attempts} 次，成功生成 ${puzzles.length} 个谜题。`);

// 写入文件
const fs = require('fs');
const path = require('path');
const outputPath = path.join(__dirname, '..', 'utils', 'dailyPuzzles.json');
fs.writeFileSync(outputPath, JSON.stringify(puzzles));
console.log(`已保存到: ${outputPath}`);
console.log(`文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
