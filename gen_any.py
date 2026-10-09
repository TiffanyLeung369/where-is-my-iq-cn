import random

def generate_regions(N):
    grid = [[-1 for _ in range(N)] for _ in range(N)]
    regionSizes = [0] * N
    
    seeds = []
    for i in range(N):
        placed = False
        for _ in range(200):
            r = random.randint(0, N-1)
            c = random.randint(0, N-1)
            if grid[r][c] != -1: continue
            
            tooClose = False
            for s in seeds:
                if abs(s[0]-r) + abs(s[1]-c) < 2:
                    tooClose = True
                    break
            if tooClose: continue
            
            seeds.append((r, c))
            grid[r][c] = i
            regionSizes[i] = 1
            placed = True
            break
        
        if not placed:
            for r in range(N):
                for c in range(N):
                    if grid[r][c] == -1:
                        seeds.append((r, c))
                        grid[r][c] = i
                        regionSizes[i] = 1
                        placed = True
                        break
                if placed: break
                
    frontiers = []
    for s in seeds:
        adj = []
        for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
            nr, nc = s[0]+dr, s[1]+dc
            if 0<=nr<N and 0<=nc<N and grid[nr][nc] == -1:
                adj.append((nr, nc))
        frontiers.append(adj)
        
    totalAssigned = N
    stuckCount = 0
    
    while totalAssigned < N*N:
        progress = False
        for i in range(N):
            if regionSizes[i] >= N: continue
            
            frontiers[i] = [(r, c) for r, c in frontiers[i] if grid[r][c] == -1]
            if not frontiers[i]: continue
            
            idx = random.randint(0, len(frontiers[i])-1)
            r, c = frontiers[i][idx]
            frontiers[i].pop(idx)
            
            if grid[r][c] != -1: continue
            
            grid[r][c] = i
            regionSizes[i] += 1
            totalAssigned += 1
            progress = True
            
            for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
                nr, nc = r+dr, c+dc
                if 0<=nr<N and 0<=nc<N and grid[nr][nc] == -1:
                    frontiers[i].append((nr, nc))
                    
        if not progress:
            stuckCount += 1
            if stuckCount > 5: return None
            
            for r in range(N):
                for c in range(N):
                    if grid[r][c] == -1:
                        for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
                            nr, nc = r+dr, c+dc
                            if 0<=nr<N and 0<=nc<N and grid[nr][nc] != -1:
                                reg = grid[nr][nc]
                                if regionSizes[reg] < N:
                                    grid[r][c] = reg
                                    regionSizes[reg] += 1
                                    totalAssigned += 1
                                    progress = True
                                    break
    for count in regionSizes:
        if count != N: return None
    return grid

def solve(regions, N):
    S = 1
    solutions = []
    stars = [[0]*N for _ in range(N)]
    colCounts = [0]*N
    regionCounts = [0]*N
    
    def canPlace(r, c):
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                if dr == 0 and dc == 0: continue
                nr, nc = r+dr, c+dc
                if 0<=nr<N and 0<=nc<N and stars[nr][nc] == 1:
                    return False
        return True
        
    def backtrack(row, placed, startCol):
        if len(solutions) >= 2: return
        
        if placed == S:
            if row + 1 == N:
                if all(c == S for c in colCounts) and all(c == S for c in regionCounts):
                    solutions.append([row[:] for row in stars])
                return
            backtrack(row + 1, 0, 0)
            return
            
        for c in range(startCol, N):
            if colCounts[c] >= S: continue
            reg = regions[row][c]
            if regionCounts[reg] >= S: continue
            if not canPlace(row, c): continue
            
            stars[row][c] = 1
            colCounts[c] += 1
            regionCounts[reg] += 1
            backtrack(row, placed + 1, c + 1)
            stars[row][c] = 0
            colCounts[c] -= 1
            regionCounts[reg] -= 1
            
    backtrack(0, 0, 0)
    return solutions

def is_irregular(regions, N):
    # check that it's NOT just six 3x2 or 2x3 blocks
    perimeter = 0
    for r in range(N):
        for c in range(N):
            for dr, dc in [(1,0), (0,1)]:
                nr, nc = r+dr, c+dc
                if nr<N and nc<N and regions[r][c] != regions[nr][nc]:
                    perimeter += 1
    return perimeter > 16 # roughly implies it's jagged

N = 6
while True:
    regions = generate_regions(N)
    if not regions: continue
    if not is_irregular(regions, N): continue
    sols = solve(regions, N)
    if len(sols) == 1:
        print("REGIONS:")
        print(",\n".join("[" + ", ".join(str(x) for x in row) + "]" for row in regions))
        print("SOLUTION:")
        print(",\n".join("[" + ", ".join(str(x) for x in row) + "]" for row in sols[0]))
        break
