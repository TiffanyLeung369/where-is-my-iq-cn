def solve(regions, N=6):
    solutions = []
    stars = [[0]*N for _ in range(N)]
    cols = [0]*N
    regs = [0]*N
    def canPlace(r, c):
        for dr in [-1,0,1]:
            for dc in [-1,0,1]:
                if dr==0 and dc==0: continue
                nr, nc = r+dr, c+dc
                if 0<=nr<N and 0<=nc<N and stars[nr][nc]: return False
        return True
    def bt(r):
        if len(solutions) > 1: return
        if r == N:
            solutions.append([row[:] for row in stars])
            return
        for c in range(N):
            if cols[c]: continue
            reg = regions[r][c]
            if regs[reg]: continue
            if not canPlace(r, c): continue
            stars[r][c] = 1
            cols[c] += 1
            regs[reg] += 1
            bt(r+1)
            stars[r][c] = 0
            cols[c] -= 1
            regs[reg] -= 1
    bt(0)
    return solutions

# Let's search a massive number of random connected components!
import random
shapes = []
for i in range(100000):
    grid = [[-1]*6 for _ in range(6)]
    sizes = [0]*6
    seeds = []
    for reg in range(6):
        while True:
            r, c = random.randint(0,5), random.randint(0,5)
            if grid[r][c] == -1:
                grid[r][c] = reg
                sizes[reg] = 1
                seeds.append((r,c))
                break
    frontiers = [[(s[0]+dr, s[1]+dc) for dr,dc in [(-1,0),(1,0),(0,-1),(0,1)] if 0<=s[0]+dr<6 and 0<=s[1]+dc<6] for s in seeds]
    valid = True
    for _ in range(30):
        avail = [reg for reg in range(6) if sizes[reg] < 6 and [p for p in frontiers[reg] if grid[p[0]][p[1]] == -1]]
        if not avail: break
        reg = random.choice(avail)
        opts = [p for p in frontiers[reg] if grid[p[0]][p[1]] == -1]
        r, c = random.choice(opts)
        grid[r][c] = reg
        sizes[reg] += 1
        for dr,dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            if 0<=r+dr<6 and 0<=c+dc<6 and grid[r+dr][c+dc] == -1:
                frontiers[reg].append((r+dr, c+dc))
    if all(s == 6 for s in sizes):
        sols = solve(grid)
        if len(sols) == 1:
            print("FOUND!")
            for row in grid: print("[" + ", ".join(str(x) for x in row) + "],")
            exit(0)
