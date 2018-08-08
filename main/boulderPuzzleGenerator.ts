import {BoulderPuzzle, Boulder, Tile, BoulderMove} from './boulderPuzzle'

function randInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

interface puzzleConfig {
    size: number;
    fragile: boolean;
    boulders: number;
    pits: boolean;
    crystal: boolean;
    depth: number;
    mindepth: number;
}

export function createBoulderPuzzle(args:puzzleConfig): [BoulderPuzzle[], BoulderMove[]] {
      let p = new BoulderPuzzle(args.size, args.size)
      for (let i = 0; i < (args.fragile ? 1 / 25 : 0) * p.width * p.height; i++) {
        let x = randInt(0, p.width);
        let y = randInt(0, p.height);
        p.grid[x][y] = Tile.Fragile;
      }
      for (let i = 0; i < p.width * p.height / 5; i++) {
        let x = randInt(0, p.width);
        let y = randInt(0, p.height);
        p.grid[x][y] = Tile.Brick;
      }

      for (let i = 0; i < args.boulders; i++) {
        let x = randInt(0, p.width);
        let y = randInt(0, p.height);
        p.grid[x][y] = Tile.Target
        p.boulders.push(new Boulder(x, y))
      }
      p.use_fragile = args.fragile;
      p.use_crystals = args.crystal;
      p.use_pits = args.pits;

      let stack = p.getStack(args.depth, true)
      let solution = stack[0][0].solve();
      console.log("Min Steps:", solution ? solution.length - 1 : " > 5")
      if (solution && solution.length < args.mindepth) {
        throw "too short"
      }
      let board: BoulderPuzzle = stack[0][0] as BoulderPuzzle;
      if (args.crystal && !board.grid.some(line => line.some(tile => tile == Tile.Crystal))) {
        throw "No crystals"
      }
      if (args.pits && !board.grid.some(line => line.some(tile => tile == Tile.Pit))) {
        throw "No Pits"
      }

      return [stack[0] as BoulderPuzzle[], stack[1] as BoulderMove[]]
    }
