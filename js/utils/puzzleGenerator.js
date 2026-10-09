/**
 * Star Battle puzzle generator
 * 
 * Star Battle rules:
 * - NxN grid divided into N regions, each region has exactly N cells
 * - Each row, column, and region has exactly S crabs
 * - Crabs cannot be adjacent (including diagonals)
 */

const _presets = window.PresetPuzzles || {};
const PRESET_8x8 = _presets.PRESET_PUZZLES_8x8 || [];
const PRESET_10x10 = _presets.PRESET_PUZZLES_10x10 || [];

// 12x12 预设池：复用每日挑战的数据（100个经过验证的 12x12 唯一解谜题）
function _getDailyPool12() {
  if (typeof window === 'undefined' || !window._dailyPuzzleRawData) return [];
  return window._dailyPuzzleRawData;
}

/** 解码每日挑战的 hex 字符串为 12x12 区域网格 */
function _decodeDailyRegions(hexStr) {
  const grid = [];
  for (let r = 0; r < 12; r++) {
    const row = [];
    for (let c = 0; c < 12; c++) {
      const ch = hexStr[r * 12 + c];
      row.push(ch >= 'a' ? ch.charCodeAt(0) - 87 : parseInt(ch));
    }
    grid.push(row);
  }
  return grid;
}

// ============================================================
// 区域生成
// ============================================================

/**
 * 生成 N 个连通区域，每个区域恰好 N 个格子
 * 使用种子+轮询生长法（适合 4~10）
 */
function generateRegions(size) {
  const N = size;

  // 大网格使用结构化生成
  if (N >= 12) {
    return generateRegionsStructured(N);
  }

  const grid = Array.from({ length: N }, () => Array(N).fill(-1));
  const regionSizes = new Array(N).fill(0);

  // 放置 N 个种子点（尽量分散）
  const seeds = [];
  for (let i = 0; i < N; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 200; attempt++) {
      const r = Math.floor(Math.random() * N);
      const c = Math.floor(Math.random() * N);
      if (grid[r][c] !== -1) continue;

      // 检查与已有种子的最小距离
      let tooClose = false;
      const minDist = Math.max(1, Math.floor(N / Math.ceil(Math.sqrt(N))) - 1);
      for (const s of seeds) {
        if (Math.abs(s.r - r) + Math.abs(s.c - c) < minDist) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      seeds.push({ r, c });
      grid[r][c] = i;
      regionSizes[i] = 1;
      placed = true;
      break;
    }

    if (!placed) {
      // 降级：随便找一个空位
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (grid[r][c] === -1) {
            seeds.push({ r, c });
            grid[r][c] = i;
            regionSizes[i] = 1;
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
    }
  }

  // 每个区域的边界待扩展格子
  const frontiers = seeds.map((seed) =>
    getAdjacentCells(seed.r, seed.c, N).filter(({ r, c }) => grid[r][c] === -1)
  );

  // 轮询生长，每轮每个区域扩展一格
  let totalAssigned = N;
  const targetTotal = N * N;
  let stuckCount = 0;

  while (totalAssigned < targetTotal) {
    let progress = false;

    for (let i = 0; i < N; i++) {
      if (regionSizes[i] >= Math.floor(N * 1.5)) continue;

      // 刷新边界（去掉已被占的格子）
      frontiers[i] = frontiers[i].filter(({ r, c }) => grid[r][c] === -1);
      if (frontiers[i].length === 0) continue;

      // 随机选一个边界格子
      const idx = Math.floor(Math.random() * frontiers[i].length);
      const cell = frontiers[i][idx];
      frontiers[i].splice(idx, 1);

      if (grid[cell.r][cell.c] !== -1) continue;

      grid[cell.r][cell.c] = i;
      regionSizes[i]++;
      totalAssigned++;
      progress = true;

      // 将新格子的邻居加入边界
      const neighbors = getAdjacentCells(cell.r, cell.c, N).filter(
        ({ r, c }) => grid[r][c] === -1
      );
      frontiers[i].push(...neighbors);
    }

    if (!progress) {
      stuckCount++;
      if (stuckCount > 10) return null; // 生成失败，需重试

      // 尝试将剩余未分配格子分给相邻区域
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (grid[r][c] !== -1) continue;
          const neighbors = getAdjacentCells(r, c, N).filter(
            ({ r: nr, c: nc }) => grid[nr][nc] !== -1
          );
          if (neighbors.length > 0) {
            // 找一个还没满的相邻区域
            for (const nb of neighbors) {
              const regionId = grid[nb.r][nb.c];
              if (regionSizes[regionId] < Math.floor(N * 1.5)) {
                grid[r][c] = regionId;
                regionSizes[regionId]++;
                totalAssigned++;
                progress = true;
                break;
              }
            }
          }
        }
      }
    }
  }

  // 验证每个区域连通性
  for (let i = 0; i < N; i++) {
    if (!isRegionConnected(grid, i, N)) return null;
  }

  return grid;
}

/**
 * 结构化区域生成器（专为 12×12 设计）
 * 先将网格切成 N 个矩形块，再做若干次边界扰动以增加不规则性
 * 保证每个区域连通且大小约 N 格
 */
function generateRegionsStructured(N) {
  const grid = Array.from({ length: N }, () => Array(N).fill(-1));

  // 第一步：将 12×12 切成 12 个 3×4（或 4×3）的矩形块
  // 使用 4 行 × 3 列的分块（每块 3 行 × 4 列 = 12 格）
  const rowBlocks = 4; // 分成 4 个行带
  const colBlocks = 3; // 分成 3 个列带
  const rowsPerBlock = Math.floor(N / rowBlocks); // 3
  const colsPerBlock = Math.floor(N / colBlocks); // 4
  let regionId = 0;

  for (let br = 0; br < rowBlocks; br++) {
    for (let bc = 0; bc < colBlocks; bc++) {
      const rStart = br * rowsPerBlock;
      const cStart = bc * colsPerBlock;
      for (let r = rStart; r < rStart + rowsPerBlock && r < N; r++) {
        for (let c = cStart; c < cStart + colsPerBlock && c < N; c++) {
          grid[r][c] = regionId;
        }
      }
      regionId++;
    }
  }

  // 第二步：做若干次边界扰动（交换相邻不同区域的格子）
  const swapAttempts = N * N * 2; // 扰动次数
  for (let i = 0; i < swapAttempts; i++) {
    const r = Math.floor(Math.random() * N);
    const c = Math.floor(Math.random() * N);
    const myRegion = grid[r][c];

    // 随机选一个相邻格子
    const neighbors = getAdjacentCells(r, c, N);
    const nb = neighbors[Math.floor(Math.random() * neighbors.length)];
    const nbRegion = grid[nb.r][nb.c];

    if (myRegion === nbRegion) continue;

    // 尝试将 (r,c) 交给 nbRegion
    grid[r][c] = nbRegion;

    // 检查交换后两个区域仍然连通
    if (isRegionConnected(grid, myRegion, N) && isRegionConnected(grid, nbRegion, N)) {
      // 交换成功，保留
    } else {
      // 回滚
      grid[r][c] = myRegion;
    }
  }

  // 验证所有区域连通
  for (let i = 0; i < regionId; i++) {
    if (!isRegionConnected(grid, i, N)) return null;
  }

  return grid;
}

/**
 * 获取上下左右相邻格子
 */
function getAdjacentCells(r, c, size) {
  const cells = [];
  if (r > 0) cells.push({ r: r - 1, c });
  if (r < size - 1) cells.push({ r: r + 1, c });
  if (c > 0) cells.push({ r, c: c - 1 });
  if (c < size - 1) cells.push({ r, c: c + 1 });
  return cells;
}

/**
 * 检查某个区域是否连通（BFS）
 */
function isRegionConnected(grid, regionId, size) {
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === regionId) cells.push({ r, c });
    }
  }
  if (cells.length === 0) return false;

  const visited = new Set();
  const queue = [cells[0]];
  visited.add(`${cells[0].r},${cells[0].c}`);

  while (queue.length > 0) {
    const { r, c } = queue.shift();
    for (const nb of getAdjacentCells(r, c, size)) {
      const key = `${nb.r},${nb.c}`;
      if (!visited.has(key) && grid[nb.r][nb.c] === regionId) {
        visited.add(key);
        queue.push(nb);
      }
    }
  }

  return visited.size === cells.length;
}

// ============================================================
// 求解器
// ============================================================

/**
 * 求解 Star Battle 谜题（自动分流）
 */
function solve(regions, size, starsPerUnit, maxSolutions) {
  // S=1 用专用快速求解器（排列模型 + 前向检查）
  if (starsPerUnit === 1) {
    return solveS1(regions, size, maxSolutions);
  }
  return solveGeneral(regions, size, starsPerUnit, maxSolutions);
}

/**
 * S=1 专用快速求解器
 * 将问题建模为排列：为每行分配一个列，约束：列不重复、区域不重复、相邻行列差≥2
 * 加前向检查：每次放置后验证剩余每行至少有1个可用列、每个未满区域至少有1个可用格
 */
function solveS1(regions, size, maxSolutions) {
  const N = size;
  const solutions = [];
  const placement = new Array(N).fill(-1);
  const usedCols = new Uint8Array(N);
  const usedRegions = new Uint8Array(N);

  function backtrack(row) {
    if (solutions.length >= maxSolutions) return;
    if (row === N) {
      // 转换为 grid 格式
      const grid = Array.from({ length: N }, () => Array(N).fill(0));
      for (let r = 0; r < N; r++) grid[r][placement[r]] = 1;
      solutions.push(grid);
      return;
    }

    for (let c = 0; c < N; c++) {
      if (usedCols[c]) continue;
      const rid = regions[row][c];
      if (usedRegions[rid]) continue;

      // 相邻约束：与上一行列差必须 >= 2
      if (row > 0 && Math.abs(c - placement[row - 1]) <= 1) continue;

      // 放置
      placement[row] = c;
      usedCols[c] = 1;
      usedRegions[rid] = 1;

      // 前向检查：验证每个剩余行至少有 1 个可用列
      let feasible = true;
      for (let fr = row + 1; fr < N && feasible; fr++) {
        let found = false;
        for (let fc = 0; fc < N; fc++) {
          if (usedCols[fc]) continue;
          if (usedRegions[regions[fr][fc]]) continue;
          // 只对紧邻的下一行检查列距约束
          if (fr === row + 1 && Math.abs(fc - c) <= 1) continue;
          found = true;
          break;
        }
        if (!found) feasible = false;
      }

      // 前向检查：验证每个未用区域在剩余行中至少有 1 个可用格
      if (feasible) {
        for (let reg = 0; reg < N && feasible; reg++) {
          if (usedRegions[reg]) continue;
          let found = false;
          for (let fr = row + 1; fr < N && !found; fr++) {
            for (let fc = 0; fc < N && !found; fc++) {
              if (regions[fr][fc] !== reg) continue;
              if (usedCols[fc]) continue;
              // 只对紧邻行检查列距
              if (fr === row + 1 && Math.abs(fc - c) <= 1) continue;
              found = true;
            }
          }
          if (!found) feasible = false;
        }
      }

      if (feasible) {
        backtrack(row + 1);
      }

      // 回溯
      placement[row] = -1;
      usedCols[c] = 0;
      usedRegions[rid] = 0;
    }
  }

  backtrack(0);
  return solutions;
}

/**
 * 通用求解器（S >= 2 用）
 */
function solveGeneral(regions, size, starsPerUnit, maxSolutions) {
  const N = size;
  const S = starsPerUnit;
  const solutions = [];

  const regionCells = Array.from({ length: N }, () => []);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      regionCells[regions[r][c]].push({ r, c });
    }
  }

  const stars = Array.from({ length: N }, () => Array(N).fill(0));
  const colCounts = new Array(N).fill(0);
  const regionCounts = new Array(N).fill(0);

  function canPlace(r, c) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N && stars[nr][nc] === 1) {
          return false;
        }
      }
    }
    return true;
  }

  function backtrack(row, placed, startCol) {
    if (solutions.length >= maxSolutions) return;

    if (placed === S) {
      if (row + 1 === N) {
        if (colCounts.every((c) => c === S) && regionCounts.every((c) => c === S)) {
          solutions.push(stars.map((r) => [...r]));
        }
        return;
      }
      backtrack(row + 1, 0, 0);
      return;
    }

    if (N - startCol < S - placed) return;

    for (let c = startCol; c < N; c++) {
      if (colCounts[c] >= S) continue;

      const regionId = regions[row][c];
      if (regionCounts[regionId] >= S) continue;

      if (!canPlace(row, c)) continue;

      // 增强剪枝：在放置后检查剩余行中，每个还未满的列和区域是否还有足够的可用格子
      const remainingRows = N - row - 1;
      if (colCounts[c] + 1 < S && remainingRows === 0) continue;

      // 放置
      stars[row][c] = 1;
      colCounts[c]++;
      regionCounts[regionId]++;

      backtrack(row, placed + 1, c + 1);

      // 回溯
      stars[row][c] = 0;
      colCounts[c]--;
      regionCounts[regionId]--;
    }
  }

  backtrack(0, 0, 0);
  return solutions;
}

// ============================================================
// 难度评分
// ============================================================

/**
 * 计算谜题难度分数
 * 基于人类求解时需要的推理深度
 */
function calculateDifficulty(regions, solution, size, starsPerUnit) {
  const N = size;
  const S = starsPerUnit;
  let score = 0;

  // 1. 网格大小贡献
  if (N <= 4) score += 0;
  else if (N <= 6) score += 1;
  else if (N <= 8) score += 2;
  else if (N <= 10) score += 4;
  else score += 6;

  // 2. 多星贡献
  if (S >= 2) score += 3;

  // 3. 区域形状不规则度
  const irregularity = calculateIrregularity(regions, N);
  score += Math.floor(irregularity * 2);

  // 4. 统计"送分格"数量（只属于一个可能位置的格子）
  const freebies = countFreebies(regions, solution, N, S);
  if (freebies >= 3) score -= 2;
  else if (freebies >= 1) score -= 1;

  return Math.max(1, Math.min(10, score));
}

/**
 * 计算区域形状的不规则度（0-1）
 */
function calculateIrregularity(regions, size) {
  let totalPerimeter = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const regionId = regions[r][c];
      // 检查四个方向，不同区域的边界算周长
      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
      ];
      for (const [nr, nc] of neighbors) {
        if (nr < 0 || nr >= size || nc < 0 || nc >= size || regions[nr][nc] !== regionId) {
          totalPerimeter++;
        }
      }
    }
  }
  // 一个完美正方形区域的最小周长
  const minPerimeter = size * 4 * Math.sqrt(size);
  return Math.min(1, (totalPerimeter - minPerimeter) / (totalPerimeter + 1));
}

/**
 * 统计"送分格"（通过简单排除法就能确定的位置）
 */
function countFreebies(regions, solution, size, starsPerUnit) {
  let count = 0;
  // 对每个区域，如果区域中只有 S 个格子不与其他区域的必然星位相邻，那就是送分格
  // 简化版：检查是否有某行/列/区域只剩恰好 S 个可选位置
  for (let r = 0; r < size; r++) {
    let possibleInRow = 0;
    for (let c = 0; c < size; c++) {
      if (solution[r][c] === 1) possibleInRow++;
    }
    // 如果解中该行恰好 S 个星，且该行格子数较少，算送分
    if (possibleInRow === starsPerUnit) count++;
  }
  return Math.max(0, count - size + 2);
}

// ============================================================
// 逻辑可推导性验证器
// ============================================================

/**
 * 验证谜题是否可以通过纯逻辑推导求解（无需猜测）
 * 使用约束传播：排除法 + 唯一候选法 + 满额排除 + 相邻排除
 * @param {number[][]} regions - 区域网格
 * @param {number} size - 网格大小 N
 * @param {number} starsPerUnit - 每行/列/区域的星数 S
 * @returns {boolean} 是否可逻辑推导
 */
function isLogicallySolvable(regions, size, starsPerUnit) {
  const N = size;
  const S = starsPerUnit;

  // possible[r][c] = true 表示该格仍可能放螃蟹
  // confirmed[r][c] = true 表示该格已确认有螃蟹
  const possible = Array.from({ length: N }, () => Array(N).fill(true));
  const confirmed = Array.from({ length: N }, () => Array(N).fill(false));

  // 预计算每个区域包含的格子列表
  const regionCells = Array.from({ length: N }, () => []);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      regionCells[regions[r][c]].push({ r, c });
    }
  }

  // 计数器
  const rowConfirmed = new Array(N).fill(0);
  const colConfirmed = new Array(N).fill(0);
  const regConfirmed = new Array(N).fill(0);
  let totalConfirmed = 0;
  const totalNeeded = N * S;

  /**
   * 排除一个格子（标记为不可能放螃蟹）
   * @returns {boolean} 是否新排除了
   */
  function eliminate(r, c) {
    if (!possible[r][c]) return false;
    possible[r][c] = false;
    return true;
  }

  /**
   * 确认一个格子有螃蟹，并级联排除相邻格子
   * @returns {boolean} 是否新确认了
   */
  function confirm(r, c) {
    if (confirmed[r][c]) return false;
    confirmed[r][c] = true;
    possible[r][c] = false; // 已确认的从候选中移除（不再需要考虑）
    totalConfirmed++;
    rowConfirmed[r]++;
    colConfirmed[c]++;
    regConfirmed[regions[r][c]]++;

    // 相邻排除：8方向相邻格全部排除
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
          eliminate(nr, nc);
        }
      }
    }
    return true;
  }

  // 主循环：持续约束传播直到无法推进
  let changed = true;
  while (changed && totalConfirmed < totalNeeded) {
    changed = false;

    // --- 满额排除 ---
    // 某行已确认够 S 只 → 该行剩余格子全部排除
    for (let r = 0; r < N; r++) {
      if (rowConfirmed[r] >= S) {
        for (let c = 0; c < N; c++) {
          if (possible[r][c]) { eliminate(r, c); changed = true; }
        }
      }
    }
    // 某列已确认够 S 只
    for (let c = 0; c < N; c++) {
      if (colConfirmed[c] >= S) {
        for (let r = 0; r < N; r++) {
          if (possible[r][c]) { eliminate(r, c); changed = true; }
        }
      }
    }
    // 某区域已确认够 S 只
    for (let reg = 0; reg < N; reg++) {
      if (regConfirmed[reg] >= S) {
        for (const { r, c } of regionCells[reg]) {
          if (possible[r][c]) { eliminate(r, c); changed = true; }
        }
      }
    }

    // --- 唯一候选法 ---
    // 某行只剩 (S - 已确认) 个可能位置 → 全部确认
    for (let r = 0; r < N; r++) {
      const need = S - rowConfirmed[r];
      if (need <= 0) continue;
      const candidates = [];
      for (let c = 0; c < N; c++) {
        if (possible[r][c]) candidates.push({ r, c });
      }
      if (candidates.length === need) {
        for (const pos of candidates) {
          if (confirm(pos.r, pos.c)) changed = true;
        }
      }
    }

    // 某列只剩 (S - 已确认) 个可能位置 → 全部确认
    for (let c = 0; c < N; c++) {
      const need = S - colConfirmed[c];
      if (need <= 0) continue;
      const candidates = [];
      for (let r = 0; r < N; r++) {
        if (possible[r][c]) candidates.push({ r, c });
      }
      if (candidates.length === need) {
        for (const pos of candidates) {
          if (confirm(pos.r, pos.c)) changed = true;
        }
      }
    }

    // 某区域只剩 (S - 已确认) 个可能位置 → 全部确认
    for (let reg = 0; reg < N; reg++) {
      const need = S - regConfirmed[reg];
      if (need <= 0) continue;
      const candidates = [];
      for (const { r, c } of regionCells[reg]) {
        if (possible[r][c]) candidates.push({ r, c });
      }
      if (candidates.length === need) {
        for (const pos of candidates) {
          if (confirm(pos.r, pos.c)) changed = true;
        }
      }
    }

    // --- 区域-行/列交叉排除（Region-Line Interaction） ---
    // 如果某区域的所有候选格都在同一行，则该行中其他区域的候选格可以排除
    // 如果某区域的所有候选格都在同一列，则该列中其他区域的候选格可以排除
    for (let reg = 0; reg < N; reg++) {
      const need = S - regConfirmed[reg];
      if (need <= 0) continue;
      const candidates = [];
      for (const { r, c } of regionCells[reg]) {
        if (possible[r][c]) candidates.push({ r, c });
      }
      if (candidates.length === 0) continue;

      // 检查是否所有候选格在同一行
      const rows = new Set(candidates.map(p => p.r));
      if (rows.size === need) {
        // 这些行中，不属于该区域的候选格可以排除
        for (const row of rows) {
          for (let c = 0; c < N; c++) {
            if (possible[row][c] && regions[row][c] !== reg) {
              if (eliminate(row, c)) changed = true;
            }
          }
        }
      }

      // 检查是否所有候选格在同一列
      const cols = new Set(candidates.map(p => p.c));
      if (cols.size === need) {
        for (const col of cols) {
          for (let r = 0; r < N; r++) {
            if (possible[r][col] && regions[r][col] !== reg) {
              if (eliminate(r, col)) changed = true;
            }
          }
        }
      }
    }

    // --- 反向交叉排除（Line-Region Interaction） ---
    // 如果某行中的候选格只来自一个区域（且该区域还需要 S 只），则该区域中不在该行的候选格可以排除
    for (let r = 0; r < N; r++) {
      const need = S - rowConfirmed[r];
      if (need <= 0) continue;
      const regionsInRow = new Set();
      for (let c = 0; c < N; c++) {
        if (possible[r][c]) regionsInRow.add(regions[r][c]);
      }
      if (regionsInRow.size === need) {
        for (const reg of regionsInRow) {
          for (const { r: cr, c: cc } of regionCells[reg]) {
            if (cr !== r && possible[cr][cc]) {
              if (eliminate(cr, cc)) changed = true;
            }
          }
        }
      }
    }

    // 如果某列中的候选格只来自一个区域，则该区域中不在该列的候选格可以排除
    for (let c = 0; c < N; c++) {
      const need = S - colConfirmed[c];
      if (need <= 0) continue;
      const regionsInCol = new Set();
      for (let r = 0; r < N; r++) {
        if (possible[r][c]) regionsInCol.add(regions[r][c]);
      }
      if (regionsInCol.size === need) {
        for (const reg of regionsInCol) {
          for (const { r: cr, c: cc } of regionCells[reg]) {
            if (cc !== c && possible[cr][cc]) {
              if (eliminate(cr, cc)) changed = true;
            }
          }
        }
      }
    }

    // --- 试探法 (Probing / Depth-1 Lookahead) ---
    // 如果以上所有普通推断皆无法继续，则对每个待选位置进行前向一步试探：
    // "假设该位置为螃蟹，其直接后果（相邻消除、区域满足等）是否会立刻导致某行/列/区域无解（剩余可选数 < 所需数）？"
    // 如果会导致无解，则该位置必定不是螃蟹。
    if (!changed && totalConfirmed < totalNeeded) {
      for (let r = 0; r < N && !changed; r++) {
        for (let c = 0; c < N && !changed; c++) {
          if (!possible[r][c]) continue; // 已经被排除了
          
          // 模拟选择 (r, c)
          // 1. (r, c) 自身从"可能"中移除(当作被确认了，这里我们检查其附带消除)
          // 2. 其 8 邻居被消除
          
          // 我们只需要快速统计，如果消除这些格子后，剩余的 possible 数量是否能满足需要
          // 复制当前 possible
          const p2 = possible.map(row => [...row]);
          p2[r][c] = false;
          
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
                p2[nr][nc] = false;
              }
            }
          }
          
          const reg = regions[r][c];
          // 如果同区域已经达到 S (这里是假设 (r, c) 被选了，所以相当于该区域还需要 need-1 只)
          // 同理行和列
          
          let conflict = false;

          for (let rr = 0; rr < N && !conflict; rr++) {
            const need = S - rowConfirmed[rr] - (rr === r ? 1 : 0);
            if (need <= 0) continue;
            let avail = 0;
            for (let cc = 0; cc < N; cc++) if (p2[rr][cc]) avail++;
            if (avail < need) conflict = true;
          }

          for (let cc = 0; cc < N && !conflict; cc++) {
            const need = S - colConfirmed[cc] - (cc === c ? 1 : 0);
            if (need <= 0) continue;
            let avail = 0;
            for (let rr = 0; rr < N; rr++) if (p2[rr][cc]) avail++;
            if (avail < need) conflict = true;
          }

          for (let rx = 0; rx < N && !conflict; rx++) {
            const need = S - regConfirmed[rx] - (rx === reg ? 1 : 0);
            if (need <= 0) continue;
            let avail = 0;
            for (const cell of regionCells[rx]) if (p2[cell.r][cell.c]) avail++;
            if (avail < need) conflict = true;
          }

          if (conflict) {
            // 选择 (r, c) 导致了一步直接矛盾，因此 (r, c) 绝对不可能是螃蟹
            if (eliminate(r, c)) changed = true;
          }
        }
      }
    }
  }

  return totalConfirmed === totalNeeded;
}

// ============================================================
// 主入口
// ============================================================

function rotateSquareMatrix(matrix, turns) {
  let result = matrix.map(row => [...row]);
  for (let turn = 0; turn < turns; turn++) {
    result = result[0].map((_, col) => result.map(row => row[col]).reverse());
  }
  return result;
}

function getSeededFirstRandom(level) {
  let a = level * 192837465 + 987654321;
  let t = a += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function getPresetRotationTurns(seed, size, poolLength, presetIndex) {
  const level = Number.parseInt(seed, 10);
  if (!Number.isInteger(level) || level < 1 || !window.GameConfig) return 0;

  const blockStart = Math.floor((level - 1) / 30) * 30 + 1;
  let previousUses = 0;
  for (let previousLevel = blockStart; previousLevel < level; previousLevel++) {
    const config = window.GameConfig.getLevelConfig(previousLevel);
    if (config.size !== size || config.starsPerUnit !== 1) continue;

    const previousIndex = Math.floor(getSeededFirstRandom(previousLevel) * poolLength);
    if (previousIndex === presetIndex) previousUses++;
  }
  return previousUses % 4;
}

function generatePuzzle(size, starsPerUnit, difficultyTarget, seed) {
  const originalRandom = Math.random;
  if (seed !== undefined && seed !== null && seed !== 'random') {
    // 使用 Mulberry32 生成固定的随机数序列
    let a = parseInt(seed) * 192837465 + 987654321;
    Math.random = function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  try {
    return _generatePuzzle(size, starsPerUnit, difficultyTarget, seed);
  } finally {
    // 强制恢复全局环境
    Math.random = originalRandom;
  }
}

function _generatePuzzle(size, starsPerUnit, difficultyTarget, seed) {
  starsPerUnit = starsPerUnit || 1;

  // 8x8 / 10x10 (S=1): use precomputed puzzle pool + region ID permutation for variety
  // Random generation pipelines have <0.02% unique-solution hit rate at these sizes
  if ((size === 8 || size === 10) && starsPerUnit === 1) {
    const pool = size === 8 ? PRESET_8x8 : PRESET_10x10;
    if (pool && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      const preset = pool[idx];
      // Randomly permute region IDs so colors look different each time
      const perm = Array.from({ length: size }, (_, i) => i);
      for (let i = perm.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
      }
      const rotationTurns = getPresetRotationTurns(seed, size, pool.length, idx);
      const coloredRegions = preset.regions.map(row => row.map(v => perm[v]));
      const regions = rotateSquareMatrix(coloredRegions, rotationTurns);
      const solution = rotateSquareMatrix(preset.solution, rotationTurns);
      const difficulty = calculateDifficulty(regions, solution, size, 1);
      return { regions, solution, difficulty, size, starsPerUnit: 1 };
    }
  }
  // 12x12：优先从每日挑战数据池随机抽取（100个经过验证的唯一解谜题）
  if (size === 12 && starsPerUnit === 1) {
    const pool = _getDailyPool12();
    if (pool.length > 0) {
      // 排除当天每日挑战使用的谜题索引
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const dayOfYear = Math.floor((now - start) / 864e5);
      const todayIdx = dayOfYear % pool.length;
      let idx = Math.floor(Math.random() * (pool.length - 1));
      if (idx >= todayIdx) idx++;
      const entry = pool[idx];
      const baseRegions = _decodeDailyRegions(entry[0]);
      const starCols = entry[1];
      // 随机置换区域 ID，让颜色每次不同
      const perm = Array.from({ length: 12 }, (_, i) => i);
      for (let i = perm.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
      }
      const regions = baseRegions.map(row => row.map(v => perm[v]));
      const solution = Array.from({ length: 12 }, (_, r) =>
        Array.from({ length: 12 }, (_, c) => (c === starCols[r] ? 1 : 0))
      );
      const difficulty = calculateDifficulty(regions, solution, 12, 1);
      return { regions, solution, difficulty, size: 12, starsPerUnit: 1 };
    }
    // 数据池不可用时降级到反向生成法
    let lg = generatePuzzleLarge(size, difficultyTarget);
    if (lg) return lg;
    for (let retry = 0; retry < 5; retry++) {
      Math.random(); Math.random(); Math.random();
      lg = generatePuzzleLarge(size, difficultyTarget);
      if (lg) return lg;
    }
    return null;
  }
  // 12 以上的其他大网格仍走反向生成法
  if (size > 12 && starsPerUnit === 1) {
    let lg = generatePuzzleLarge(size, difficultyTarget);
    if (lg) return lg;
    for (let retry = 0; retry < 5; retry++) {
      Math.random(); Math.random(); Math.random();
      lg = generatePuzzleLarge(size, difficultyTarget);
      if (lg) return lg;
    }
    return null;
  }

  const maxAttempts = 2500;

  // 难度范围
  const difficultyRanges = {
    easy: [1, 4],
    normal: [3, 8],
    hard: [6, 12],
  };
  const range = difficultyRanges[difficultyTarget] || [1, 10];

  let bestFallback = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 1. 生成区域
    const regions = generateRegions(size);
    if (!regions) continue;

    // 2. 求解（最多找2个解，判断唯一性）
    const solutions = solve(regions, size, starsPerUnit, 2);

    // 3. 必须恰好1个解
    if (solutions.length !== 1) continue;

    // 4. 验证可逻辑推导（无需猜测）
    if (!isLogicallySolvable(regions, size, starsPerUnit)) continue;

    const solution = solutions[0];

    // 4. 计算难度
    const difficulty = calculateDifficulty(regions, solution, size, starsPerUnit);

    const puzzleObj = {
      regions,
      solution,
      difficulty,
      size,
      starsPerUnit,
    };

    // 记录任意一个合法且有唯一解的谜题，防止完全找不到目标难度导致死锁黑屏
    bestFallback = puzzleObj;

    // 5. 【修补】真正的难度锁：验证是否落在由 gameConfig 下发的目标难度区间内
    if (!difficultyTarget || (difficulty >= range[0] && difficulty <= range[1])) {
      return puzzleObj;
    }
  }

  // 超过最大尝试次数，虽然难度有偏差但至少逻辑合法，此时强制输出保护玩家体验
  if (bestFallback) {
    console.warn(`[puzzleGenerator] 尝试了 ${maxAttempts} 次未能命中难度 ${difficultyTarget} (${range[0]}-${range[1]})。返回难度值为 ${bestFallback.difficulty} 的代替关卡。`);
    return bestFallback;
  }

  return getAbsoluteFallback(size);
}

function getAbsoluteFallback(size) {
  // ========== 绝对保底机制 ==========
  // 如果所有随机尝试都失败了，提供绝对合规的短阵预设关卡（退级为4x4以确保体验极佳，避免依靠猜测）
  console.warn("所有生成尝试均失败，使用安全保底配置");
  if (size <= 4) {
    return {
      regions: [
        [0, 0, 1, 1],
        [0, 0, 1, 1],
        [2, 2, 3, 3],
        [2, 2, 3, 3]
      ],
      solution: [
        [0, 1, 0, 0],
        [0, 0, 0, 1],
        [1, 0, 0, 0],
        [0, 0, 1, 0]
      ],
      size: 4, starsPerUnit: 1, difficulty: 1
    };
  }
  
  if (size === 6) {
    return {
      regions: [
        [0, 0, 1, 1, 2, 2],
        [0, 0, 1, 1, 2, 2],
        [0, 0, 1, 1, 2, 2],
        [3, 3, 4, 4, 5, 5],
        [3, 3, 4, 4, 5, 5],
        [3, 3, 4, 4, 5, 5]
      ],
      solution: [
        [1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 1],
        [0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0],
        [0, 0, 1, 0, 0, 0]
      ],
      size: 6, starsPerUnit: 1, difficulty: 2
    };
  }

  if (size === 8) {
    return {
      regions: [
        [0,0,0, 1,1,1, 2,2],
        [0,0,0, 1,1,1, 2,2],
        [0,0, 3,3,3, 2,2,2],
        [4,4, 3,3,3, 2,2,2],
        [4,4,4, 5,5,5, 6,6],
        [4,4,4, 5,5,5, 6,6],
        [7,7,7, 5,5, 6,6,6],
        [7,7,7, 7,7, 6,6,6]
      ],
      solution: [
        [0,0,1,0,0,0,0,0],
        [0,0,0,0,1,0,0,0],
        [0,0,0,0,0,0,1,0],
        [0,0,0,1,0,0,0,0],
        [0,0,0,0,0,1,0,0],
        [1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,1],
        [0,1,0,0,0,0,0,0]
      ],
      size: 8, starsPerUnit: 1, difficulty: 3
    };
  }

  // 10x10极大保底兜底处理（动态生成合法星位防止逻辑报错）
  const colsSafe = [0, 3, 6, 9, 2, 5, 8, 1, 4, 7];
  return {
    regions: Array.from({length: size}, (_, r) => Array.from({length: size}, (_, c) => Math.floor(r))),
    solution: Array.from({length: size}, (_, r) => Array.from({length: size}, (_, c) => ((colsSafe[r % 10] === c || (c === r && size!==10)) ? 1 : 0))),
    size, starsPerUnit: 1, difficulty: 5
  };
}

// ============================================================
// 大网格专用：反向生成法（先放星星再造区域）
// ============================================================

/**
 * 生成大网格谜题（12×12）
 * 策略：1.随机生成合法星星位置 → 2.BFS围绕星星造区域 → 3.验证唯一解
 */
function generatePuzzleLarge(size, difficultyTarget) {
  const N = size;
  const maxAttempts = 800;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 1. 随机生成一组合法的星星位置（每行1个、每列1个、互不相邻）
    const starCols = generateStarPlacement(N);
    if (!starCols) continue;

    // 构建 solution 矩阵
    const solution = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      solution[r][starCols[r]] = 1;
    }

    // 2. 围绕星星位置用 BFS 造区域
    const regions = buildRegionsFromStars(starCols, N);
    if (!regions) continue;

    // 3. 验证唯一性（最多找2个解）
    const solutions = solve(regions, N, 1, 2);
    if (solutions.length !== 1) continue;

    // 4. 验证可逻辑推导（无需猜测）
    if (!isLogicallySolvable(regions, N, 1)) continue;

    // 成功！
    const difficulty = calculateDifficulty(regions, solutions[0], N, 1);
    return {
      regions,
      solution: solutions[0],
      difficulty,
      size: N,
      starsPerUnit: 1,
    };
  }

  console.warn('[generatePuzzleLarge] 未能在限定次数内生成唯一解谜题');
  return null;
}

/**
 * 生成合法的星星位置（每行1个、每列1个、互不相邻含对角线）
 * 类似 N-Queens 问题但禁止对角线相邻
 * @returns {number[]|null} 每行星星所在的列号数组
 */
function generateStarPlacement(N) {
  const cols = new Array(N).fill(-1);
  const usedCols = new Set();

  function backtrack(row) {
    if (row === N) return true;

    // 随机顺序尝试列
    const order = Array.from({ length: N }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    for (const c of order) {
      if (usedCols.has(c)) continue;

      // 检查与上一行的相邻性（含对角线）
      if (row > 0) {
        const prevCol = cols[row - 1];
        if (Math.abs(c - prevCol) <= 1) continue;
      }

      cols[row] = c;
      usedCols.add(c);

      if (backtrack(row + 1)) return true;

      cols[row] = -1;
      usedCols.delete(c);
    }
    return false;
  }

  if (backtrack(0)) return cols;
  return null;
}

/**
 * 围绕星星位置用 BFS 多源扩展生成 N 个连通区域
 * 每个星星是一个区域的种子，同时向外扩展，保证连通性
 */
function buildRegionsFromStars(starCols, N) {
  const grid = Array.from({ length: N }, () => Array(N).fill(-1));
  const regionSizes = new Array(N).fill(0);

  // 每个星星是其区域的种子
  const queues = [];
  for (let r = 0; r < N; r++) {
    const c = starCols[r];
    grid[r][c] = r; // 区域 ID = 行号
    regionSizes[r] = 1;
    // 将相邻格子加入待扩展队列（随机顺序）
    const neighbors = getAdjacentCells(r, c, N).filter(({ r: nr, c: nc }) => grid[nr][nc] === -1);
    shuffleArray(neighbors);
    queues.push(neighbors);
  }

  // 轮询 BFS：每轮每个区域扩一格
  let totalAssigned = N;
  const target = N * N;
  let stuckRounds = 0;

  while (totalAssigned < target) {
    let progress = false;
    for (let i = 0; i < N; i++) {
      // 从队列中找一个未被占的格子
      while (queues[i].length > 0) {
        const cell = queues[i].shift();
        if (grid[cell.r][cell.c] !== -1) continue;

        grid[cell.r][cell.c] = i;
        regionSizes[i]++;
        totalAssigned++;
        progress = true;

        // 将新格子的空邻居加入队列
        const nbs = getAdjacentCells(cell.r, cell.c, N).filter(({ r, c }) => grid[r][c] === -1);
        shuffleArray(nbs);
        queues[i].push(...nbs);
        break;
      }
    }

    if (!progress) {
      stuckRounds++;
      if (stuckRounds > 5) {
        // 将剩余未分配格子强制分配给相邻区域
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            if (grid[r][c] !== -1) continue;
            const nbs = getAdjacentCells(r, c, N);
            for (const nb of nbs) {
              if (grid[nb.r][nb.c] !== -1) {
                grid[r][c] = grid[nb.r][nb.c];
                regionSizes[grid[r][c]]++;
                totalAssigned++;
                break;
              }
            }
          }
        }
        break;
      }
    }
  }

  // 验证连通性
  for (let i = 0; i < N; i++) {
    if (!isRegionConnected(grid, i, N)) return null;
  }

  return grid;
}

/**
 * 获取数组中选出 size 个元素的所有组合
 */
function getCombinations(arr, size) {
  const result = [];
  function backtrack(start, combo) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      backtrack(i + 1, combo);
      combo.pop(); // 撤销选择
    }
  }
  backtrack(0, []);
  return result;
}

/**
 * 依据当前盘面状态提供渐进式的逻辑提示
 * @param {Array} regions - 区域网格
 * @param {number} size - 网格大小配置
 * @param {number} starsPerUnit - 目标系数S
 * @param {Array} gridData - UI层构建带有state的数据对象
 * @param {string} skinName - 皮肤名字（如：螃蟹 / 小猪）
 * @param {Array} colorNames - 当前使用的颜色名字列表
 * @returns {Object|null} { reason: string, actions: [{r,c,state}] }
 */
function getLogicalHint(regions, size, starsPerUnit, gridData, skinName = 'Crab', colorNames = []) {
  const N = size;
  const S = starsPerUnit;

  const possible = Array.from({ length: N }, () => Array(N).fill(true));
  const confirmed = Array.from({ length: N }, () => Array(N).fill(false));

  const rowConfirmed = new Array(N).fill(0);
  const colConfirmed = new Array(N).fill(0);
  const regConfirmed = new Array(N).fill(0);
  
  const regionCells = Array.from({ length: N }, () => []);

  // 1. 根据当前盘面初始化候选表
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const reg = regions[r][c];
      regionCells[reg].push({ r, c });

      const state = gridData[r][c].state;
      if (state === 'marked' || state === 'wrong') {
        possible[r][c] = false;
      } else if (state === 'correct') {
        confirmed[r][c] = true;
        possible[r][c] = false;
        rowConfirmed[r]++;
        colConfirmed[c]++;
        regConfirmed[reg]++;
        
        // 周围格子也直接判定为不可能（星战规则）
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
              possible[nr][nc] = false;
            }
          }
        }
      }
    }
  }

  // 辅助函数：找出一个范围内所有还未标记且在 possible 中被认定为不可能的格子，收集为标记X
  const collectMarks = (cells) => {
    const actions = [];
    for (const {r, c} of cells) {
      if (gridData[r][c].state === 'empty' && possible[r][c]) {
        actions.push({ r, c, state: 'marked' });
      }
    }
    return actions;
  };

  // --- Level 1: 满额排除 ---
  for (let r = 0; r < N; r++) {
    if (rowConfirmed[r] === S) {
      const cells = [];
      for (let c = 0; c < N; c++) cells.push({r,c});
      const actions = collectMarks(cells);
      if (actions.length > 0) {
        const ctx = []; for (let cc = 0; cc < N; cc++) { if (gridData[r][cc].state === "correct") ctx.push({r, c: cc}); }
        return { type: 'mark_x', reason: t('hint.row_full', {skinName: skinName}), actions, contextCells: ctx };
      }
    }
  }
  for (let c = 0; c < N; c++) {
    if (colConfirmed[c] === S) {
      const cells = [];
      for (let r = 0; r < N; r++) cells.push({r,c});
      const actions = collectMarks(cells);
      if (actions.length > 0) {
        const ctx = []; for (let rr = 0; rr < N; rr++) { if (gridData[rr][c].state === "correct") ctx.push({r: rr, c}); }
        return { type: 'mark_x', reason: t('hint.col_full', {skinName: skinName}), actions, contextCells: ctx };
      }
    }
  }
  for (let reg = 0; reg < N; reg++) {
    if (regConfirmed[reg] === S) {
      const actions = collectMarks(regionCells[reg]);
      const cName = colorNames[reg] || t('hint.default_color');
      if (actions.length > 0) {
        const ctx = regionCells[reg].filter(({r, c}) => gridData[r][c].state === "correct");
        return { type: 'mark_x', reason: t('hint.region_full', {colorName: cName, skinName: skinName}), actions, contextCells: ctx };
      }
    }
  }

  // --- Level 2: 唯一候选点 ---
  for (let r = 0; r < N; r++) {
    const need = S - rowConfirmed[r];
    if (need > 0) {
      const cands = [];
      for (let c = 0; c < N; c++) if (possible[r][c] && gridData[r][c].state !== 'correct') cands.push({r,c, state:'correct'});
      if (cands.length === need) {
        // Only return if at least one is currently 'empty'
        const actions = cands.filter(a => gridData[a.r][a.c].state === 'empty');
        if (actions.length > 0) {
          const ctx = []; for (let cc = 0; cc < N; cc++) { if (!possible[r][cc]) ctx.push({r, c: cc}); }
          return { type: 'confirm', reason: t('hint.row_only_spot', {skinName: skinName}), actions, contextCells: ctx };
        }
      }
    }
  }
  for (let c = 0; c < N; c++) {
    const need = S - colConfirmed[c];
    if (need > 0) {
      const cands = [];
      for (let r = 0; r < N; r++) if (possible[r][c] && gridData[r][c].state !== 'correct') cands.push({r,c, state:'correct'});
      if (cands.length === need) {
        const actions = cands.filter(a => gridData[a.r][a.c].state === 'empty');
        if (actions.length > 0) {
          const ctx = []; for (let rr = 0; rr < N; rr++) { if (!possible[rr][c]) ctx.push({r: rr, c}); }
          return { type: 'confirm', reason: t('hint.col_only_spot', {skinName: skinName}), actions, contextCells: ctx };
        }
      }
    }
  }
  for (let reg = 0; reg < N; reg++) {
    const need = S - regConfirmed[reg];
    if (need > 0) {
      const cands = [];
      for (const {r,c} of regionCells[reg]) if (possible[r][c] && gridData[r][c].state !== 'correct') cands.push({r,c, state:'correct'});
      if (cands.length === need) {
        const actions = cands.filter(a => gridData[a.r][a.c].state === 'empty');
        const cName = colorNames[reg] || t('hint.default_color');
        if (actions.length > 0) {
          const ctx = regionCells[reg].filter(({r, c}) => !possible[r][c]);
          return { type: 'confirm', reason: t('hint.region_only_spot', {colorName: cName, skinName: skinName}), actions, contextCells: ctx };
        }
      }
    }
  }

  // --- Level 3 & 4: 进阶推演 (Naked / Hidden Subsets) ---
  // 这部分不仅覆盖单行/单列/单色块被锁死的情况，也支持高级的多行/多色块互锁（如 4色块占满4排）
  
  // 1. 区域 -> 行/列 (K个特定颜色色块的所有候选点，完全挤在K个行或竖列中)
  const activeRegions = [];
  for (let reg = 0; reg < N; reg++) if (S - regConfirmed[reg] > 0) activeRegions.push(reg);

  // 搜索组合范围 k 扩展至 N-1
  for (let k = 1; k <= activeRegions.length - 1 || k === 1; k++) {
    const combs = getCombinations(activeRegions, k);
    for (const combo of combs) {
      const need = combo.reduce((acc, reg) => acc + (S - regConfirmed[reg]), 0);
      
      const rows = new Set();
      const cols = new Set();
      for (const reg of combo) {
        for (const {r, c} of regionCells[reg]) {
          if (possible[r][c]) {
            rows.add(r);
            cols.add(c);
          }
        }
      }

      // 检查行锁定
      let rowCapacity = 0;
      for (const r of rows) rowCapacity += S - rowConfirmed[r];
      if (rowCapacity === need) {
        const cells = [];
        for (const r of rows) {
          for (let c = 0; c < N; c++) {
            if (possible[r][c] && !combo.includes(regions[r][c])) {
              cells.push({r, c});
            }
          }
        }
        const actions = collectMarks(cells);
        if (actions.length > 0) {
          const ctx = [];
          for (const r of rows) { for (let cc = 0; cc < N; cc++) { if (combo.includes(regions[r][cc])) ctx.push({r, c: cc}); } }
          const cNamesStr = combo.map(reg => `「${colorNames[reg] || t('hint.unknown_color')}」`).join('、');
          if (combo.length === 1) {
            return { type: 'mark_x', reason: t('hint.color_locked_rows_single', {colors: cNamesStr, rows: rows.size > 1 ? t('hint.these_rows') : t('hint.this_row'), skinName: skinName}), actions, contextCells: ctx };
          } else {
            return { type: 'mark_x', reason: t('hint.color_locked_rows_multi', {colors: cNamesStr, count: rows.size, comboCount: combo.length, skinName: skinName}), actions, contextCells: ctx };
          }
        }
      }

      // 检查列锁定
      let colCapacity = 0;
      for (const c of cols) colCapacity += S - colConfirmed[c];
      if (colCapacity === need) {
        const cells = [];
        for (const c of cols) {
          for (let r = 0; r < N; r++) {
            if (possible[r][c] && !combo.includes(regions[r][c])) {
              cells.push({r, c});
            }
          }
        }
        const actions = collectMarks(cells);
        if (actions.length > 0) {
          const ctx = [];
          for (const c of cols) { for (let rr = 0; rr < N; rr++) { if (combo.includes(regions[rr][c])) ctx.push({r: rr, c}); } }
          const cNamesStr = combo.map(reg => `「${colorNames[reg] || t('hint.unknown_color')}」`).join('、');
          if (combo.length === 1) {
            return { type: 'mark_x', reason: t('hint.color_locked_cols_single', {colors: cNamesStr, cols: cols.size > 1 ? t('hint.these_cols') : t('hint.this_col'), skinName: skinName}), actions, contextCells: ctx };
          } else {
            return { type: 'mark_x', reason: t('hint.color_locked_cols_multi', {colors: cNamesStr, count: cols.size, comboCount: combo.length, skinName: skinName}), actions, contextCells: ctx };
          }
        }
      }
    }
  }

  // 2. 行 -> 区域 (反向绑定：K个行的所有候选点，完全挤在K个颜色色块中)
  const activeRows = [];
  for (let r = 0; r < N; r++) if (S - rowConfirmed[r] > 0) activeRows.push(r);
  for (let k = 1; k <= activeRows.length - 1 || k === 1; k++) {
    const combs = getCombinations(activeRows, k);
    for (const combo of combs) {
      const need = combo.reduce((acc, r) => acc + (S - rowConfirmed[r]), 0);
      const regs = new Set();
      for (const r of combo) {
        for (let c = 0; c < N; c++) {
          if (possible[r][c]) regs.add(regions[r][c]);
        }
      }
      let regCapacity = 0;
      for (const reg of regs) regCapacity += S - regConfirmed[reg];
      if (regCapacity === need) {
        const cells = [];
        for (const reg of regs) {
          for (const cell of regionCells[reg]) {
            if (possible[cell.r][cell.c] && !combo.includes(cell.r)) {
              cells.push({r: cell.r, c: cell.c});
            }
          }
        }
        const actions = collectMarks(cells);
        if (actions.length > 0) {
          const ctx = [];
          for (const r of combo) { for (let cc = 0; cc < N; cc++) { if (regs.has(regions[r][cc])) ctx.push({r, c: cc}); } }
          const cNamesStr = Array.from(regs).map(reg => `「${colorNames[reg] || t('hint.unknown_color')}」`).join('、');
          let plural = combo.length > 1 ? t('hint.these_rows') : t('hint.this_row');
          let colorTerm = regs.size > 1 ? t('hint.these_colors') : t('hint.this_color');
          return { type: 'mark_x', reason: t('hint.rows_locked_to_colors', {rows: plural, skinName: skinName, colorTerm: colorTerm, colors: cNamesStr}), actions, contextCells: ctx };
        }
      }
    }
  }

  // 3. 列 -> 区域 (反向绑定：K个列的所有候选点，完全挤在K个颜色色块中)
  const activeCols = [];
  for (let c = 0; c < N; c++) if (S - colConfirmed[c] > 0) activeCols.push(c);
  for (let k = 1; k <= activeCols.length - 1 || k === 1; k++) {
    const combs = getCombinations(activeCols, k);
    for (const combo of combs) {
      const need = combo.reduce((acc, c) => acc + (S - colConfirmed[c]), 0);
      const regs = new Set();
      for (const c of combo) {
        for (let r = 0; r < N; r++) {
          if (possible[r][c]) regs.add(regions[r][c]);
        }
      }
      let regCapacity = 0;
      for (const reg of regs) regCapacity += S - regConfirmed[reg];
      if (regCapacity === need) {
        const cells = [];
        for (const reg of regs) {
          for (const cell of regionCells[reg]) {
            if (possible[cell.r][cell.c] && !combo.includes(cell.c)) {
              cells.push({r: cell.r, c: cell.c});
            }
          }
        }
        const actions = collectMarks(cells);
        if (actions.length > 0) {
          const ctx = [];
          for (const c of combo) { for (let rr = 0; rr < N; rr++) { if (regs.has(regions[rr][c])) ctx.push({r: rr, c}); } }
          const cNamesStr = Array.from(regs).map(reg => `「${colorNames[reg] || t('hint.unknown_color')}」`).join('、');
          let plural = combo.length > 1 ? t('hint.these_cols') : t('hint.this_col');
          let colorTerm = regs.size > 1 ? t('hint.these_colors') : t('hint.this_color');
          return { type: 'mark_x', reason: t('hint.cols_locked_to_colors', {cols: plural, skinName: skinName, colorTerm: colorTerm, colors: cNamesStr}), actions, contextCells: ctx };
        }
      }
    }
  }

  // --- Level 5: 试探推演 (Probing) ---
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!possible[r][c] || gridData[r][c].state !== 'empty') continue;

      // 假设 (r,c) 为螃蟹
      const p2 = possible.map(row => [...row]);
      p2[r][c] = false;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < N && nc >= 0 && nc < N) p2[nr][nc] = false;
        }
      }
      
      const reg = regions[r][c];
      let conflict = false;

      const checkNeeded = (getNeeds) => {
        for (let i = 0; i < N && !conflict; i++) {
          const need = getNeeds(i);
          if (need <= 0) continue;
          let avail = 0;
          if (getNeeds.type === 'row') {
            for (let cc = 0; cc < N; cc++) if (p2[i][cc]) avail++;
          } else if (getNeeds.type === 'col') {
            for (let rr = 0; rr < N; rr++) if (p2[rr][i]) avail++;
          } else {
            for (const {r: rr, c: cc} of regionCells[i]) if(p2[rr][cc]) avail++;
          }
          if (avail < need) conflict = true;
        }
      };

      const rowNeeds = (rr) => S - rowConfirmed[rr] - (rr === r ? 1 : 0); rowNeeds.type = 'row';
      const colNeeds = (cc) => S - colConfirmed[cc] - (cc === c ? 1 : 0); colNeeds.type = 'col';
      const regNeeds = (rx) => S - regConfirmed[rx] - (rx === reg ? 1 : 0); regNeeds.type = 'reg';

      checkNeeded(rowNeeds);
      checkNeeded(colNeeds);
      checkNeeded(regNeeds);

      if (conflict) {
        return { type: 'mark_x', reason: t('hint.probing_dead_end', {skinName: skinName}), actions: [{r, c, state: 'marked'}], contextCells: [] };
      }
    }
  }

  // --- Level 6: 终极兜底 (透视眼) ---
  return null; // 外层捕获到 null 会 fallback 到之前的随机揭晓
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

window.PuzzleGenerator = {
  generatePuzzle,
  generateRegions,
  solve,
  getLogicalHint,
};

