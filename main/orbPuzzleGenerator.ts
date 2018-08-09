import {OrbPuzzle, Orb, Tile, OrbMove} from './orbPuzzle'

function randInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

interface puzzleConfig {
    size: number;
    fragile: boolean;
    orbs: number;
    pits: boolean;
    crystal: boolean;
    depth: number;
    mindepth: number;
    decoy_pits: boolean;
    brick_density: number;
    fragile_brick_density: number;
    pit_density: number;
}

export async function createOrbPuzzle(args:puzzleConfig): Promise<[OrbPuzzle[], OrbMove[]]> {
      let p = new OrbPuzzle(args.size, args.size)
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
      if(args.decoy_pits){
          for (let i = 0; i < p.width * p.height / 100 * args.pit_density; i++) {
          let x = randInt(0, p.width);
          let y = randInt(0, p.height);
          p.grid[x][y] = Tile.Pit;
        }
      }

      for (let i = 0; i < args.orbs; i++) {
        let x = randInt(0, p.width);
        let y = randInt(0, p.height);
        p.grid[x][y] = Tile.Target
        p.orbs.push(new Orb(x, y))
      }

      p.use_fragile = args.fragile;
      p.use_crystals = args.crystal;
      p.use_pits = args.pits;

      let stack = p.getStack(args.depth)
      let solutionResult = await stack[0][0].solve(args.depth);
      let solution:OrbMove[]|undefined;
      if(solutionResult){
        solution = solutionResult[1]
        if (solution && solution.length < args.mindepth - 1) {
          console.error("too short", solution.length, args.mindepth - 1);
          throw "too short "
        }
      }
      let board: OrbPuzzle = stack[0][0] as OrbPuzzle;
      if (args.crystal && !board.grid.some(line => line.some(tile => tile == Tile.Crystal))) {
        throw "No crystals"
      }
      if(args.depth > 2){
        if (args.pits && !board.grid.some(line => line.some(tile => tile == Tile.Pit))) {
          throw "No Pits"
        }
        if (args.pits && !stack[1].some((m => [OrbMove.DownPit, OrbMove.UpPit, OrbMove.LeftPit, OrbMove.RightPit].indexOf(m) !== -1))) {
          throw "No Pit USED in solution"
        }
      }
      if(!solution){
        solution = stack[1]
      }
      return [stack[0] as OrbPuzzle[], solution]
    }
