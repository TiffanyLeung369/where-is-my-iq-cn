const { generatePuzzle } = require('./utils/puzzleGenerator.js');
console.time('gen6');
let count = 0;
let successCount = 0;
for (let i = 0; i < 100; i++) {
  const p = generatePuzzle(6, 1);
  count++;
  if (p) successCount++;
}
console.timeEnd('gen6');
console.log(`Success rate for 6x6: ${successCount}/${count}`);

console.time('gen4');
count = 0;
successCount = 0;
for (let i = 0; i < 100; i++) {
  const p = generatePuzzle(4, 1);
  count++;
  if (p) successCount++;
}
console.timeEnd('gen4');
console.log(`Success rate for 4x4: ${successCount}/${count}`);
