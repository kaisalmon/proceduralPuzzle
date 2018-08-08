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
    decoy_pits: boolean;
    brick_density: number;
    fragile_brick_density: number;
    pit_density: number;
}

export function createBoulderPuzzle(args:puzzleConfig): [BoulderPuzzle[], BoulderMove[]] {
      let p = new BoulderPuzzle(args.size, args.size)
      for (let i = 0; i < p.width * p.height / 100 * args.fragile_brick_density; i++) {
        let x = randInt(0, p.width);
        let y = randInt(0, p.height);
        p.grid[x][y] = Tile.Fragile;
      }
      for (let i = 0; i < p.width * p.height / 100 * args.brick_density; i++) {
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

      if(args.decoy_pits){
          for (let i = 0; i < p.width * p.height / 100 * args.pit_density; i++) {
          let x = randInt(0, p.width);
          let y = randInt(0, p.height);
          p.grid[x][y] = Tile.Pit;
        }
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
      if (args.pits && !stack[1].some((m => [BoulderMove.DownPit, BoulderMove.UpPit, BoulderMove.LeftPit, BoulderMove.RightPit].indexOf(m) !== -1))) {
        throw "No Pit USED in solution"
      }

      return [stack[0] as BoulderPuzzle[], stack[1] as BoulderMove[]]
    }
