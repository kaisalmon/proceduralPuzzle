import _ from "lodash";
import PuzzleState from './puzzleState'

export enum Tile {
  Empty = ' ',
  Fragile = '□',
  Brick = '■',
  Crystal = '◇',
  Portal = '℗',
  Pit = '▼',
  Target = '◎'
}

export enum BoulderMove {
  Up = "Up",
  UpPortal = "Up, using portal",
  UpPit = "Up, into pit",
  Down = "Down",
  DownPortal = "Down, using portal",
  DownPit = "Down, into pit",
  Left = "Left",
  LeftPortal = "Left, using portal",
  LeftPit = "Left, into pit",
  Right = "Right",
  RightPortal = "Right, using portal",
  RightPit = "Right, into pit",
  Shatter = "Shatter",
}

function randInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}


export class Boulder {
  x: number;
  y: number;
  index: number = -1;
  in_pit: boolean = false;
  last_move: [number, number] | undefined;
  last_mag: number | undefined;
  last_contact: { x: number, y: number } | undefined;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  is_frozen(): boolean {
    if (this.in_pit) {
      return true;
    }
    return false;
  }
}

export class BoulderPuzzle extends PuzzleState<BoulderMove>{
  grid: Tile[][]
  boulders: Boulder[];
  criticalTiles: { x: number, y: number }[] = []
  width: number; height: number;

  use_crystals: boolean = false;
  use_pits: boolean = false;
  use_portals: boolean = false;
  use_fragile: boolean = false;
  no_basic: boolean = false;

  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
    this.grid = [];
    this.boulders = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.grid[x]) {
          this.grid[x] = []
        }
        this.grid[x].push(Tile.Empty);
      }
    }
  }

  bouldersInVecOrder(vec: number[]): Boulder[] {
    return this.boulders.sort((a, b) => {
      let aVal = a.x * vec[0] + a.y * vec[1]
      let bVal = b.x * vec[0] + b.y * vec[1]
      if (aVal < bVal) {
        return 1;
      } else {
        return -1;
      }
    })
  }

  toString(): string {
    let result = "";
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[x][y] == Tile.Target) {
          result += this.boulders.some((b) => b.x == x && b.y == y) ? "✓" : this.grid[x][y]
        } else if (this.grid[x][y] == Tile.Empty) {
          result += this.boulders.some((b) => b.x == x && b.y == y) ? "o" : this.grid[x][y]
        } else if (this.grid[x][y] == Tile.Pit) {
          result += this.boulders.some((b) => b.x == x && b.y == y) ? Tile.Empty : this.grid[x][y]
        } else {
          result += this.boulders.some((b) => b.x == x && b.y == y) ? "o" : this.grid[x][y]
        }
      }
      result += "\n";
    }
    return result;
  }
  hashString(): string {
    return this.toString();
  }
  apply(move: BoulderMove): BoulderPuzzle {
    let state = _.cloneDeep(this);
    for (var i = 0; i < state.boulders.length; i++) {
      state.boulders[i].index = i;
    }
    if (move == BoulderMove.Shatter) {
      state.grid = state.grid.map((line: Tile[]) => line.map((t: Tile) => t == Tile.Crystal ? Tile.Empty : t))
      return state;
    }
    let vec = this.getVec(move);

    let toBeRemoved: Boulder[] = []
    for (let b of state.bouldersInVecOrder(vec)) {
      b.last_move = [0, 0]
      if (b.is_frozen()) {
        continue;
      }
      let ox = b.x;
      let oy = b.y;
      for (let mag = 1; mag < this.height; mag++) {
        if (state.isPassable(ox + vec[0] * mag, oy + vec[1] * mag)) {
          b.x = ox + vec[0] * mag;
          b.y = oy + vec[1] * mag;
        } else {
          let t = state.getTile(ox + vec[0] * mag, oy + vec[1] * mag)
          if (t == Tile.Pit && !state.any_boulder_at(ox + vec[0] * mag, oy + vec[1] * mag)) {
            b.in_pit = true;
            b.x = ox + vec[0] * mag;
            b.y = oy + vec[1] * mag;
            b.last_mag = mag;
          }
          //don't break if we didn't move
          if (mag > 1 && t == Tile.Fragile) {
            state.grid[ox + vec[0] * mag][oy + vec[1] * mag] = Tile.Empty;
          }
          break;
        }
        b.last_move = [vec[0] * mag, vec[1] * mag];
        if (mag != 0) {
          b.last_contact = { x: b.x + vec[0], y: b.y + vec[1] };
        } else {
          b.last_contact = undefined;
        }
        b.last_mag = mag;
      }
    }
    state.boulders = state.boulders.filter((b: Boulder) => toBeRemoved.indexOf(b) == -1);
    state.boulders = state.boulders.sort((a: Boulder, b: Boulder) => a.index - b.index);
    return state;
  }
  isTilePassable(tile: Tile | undefined): boolean {
    return tile == Tile.Empty || tile == Tile.Target
  }
  isPassable(x: number, y: number): boolean {
    if (!this.isTilePassable(this.getTile(x, y))) {
      if (this.getTile(x, y) == Tile.Pit && this.any_boulder_at(x, y)) {
        //that's fine
      } else {
        return false;
      }
    }
    for (let b of this.boulders) {
      if (b.x == x && b.y == y && !b.in_pit) {
        return false;
      }
    }
    return true;
  }
  getTile(x: number, y: number): Tile | undefined {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return undefined;
    }
    return this.grid[x][y];
  }

  any_boulder_at(x: number, y: number): boolean {
    return (this.boulders.some(b => b.x == x && b.y == y))
  }


  reverseShatter(): BoulderPuzzle {
    if (this.criticalTiles.length < 8) {
      throw "Not enough critical tiles for shatter"
    }
    if (this.grid.some(line => line.some(tile => tile == Tile.Crystal))) {
      throw "Crystals already present"
    }
    for (var i = 0; i < randInt(1, 4); i++) {
      let coord = _.sample(this.criticalTiles);
      if (coord) {
        if (this.getTile(coord.x, coord.y) == Tile.Empty) {
          this.grid[coord.x][coord.y] = Tile.Crystal;
        }
      }
    }
    for (var i = 0; i < Math.min(this.height, this.width); i++) {
      let x = randInt(0, this.width)
      let y = randInt(0, this.height)
      if (this.getTile(x, y) == Tile.Empty) {
        this.grid[x][y] = Tile.Crystal;
      }
    }
    return this;
  }

  reverse(move: BoulderMove): BoulderPuzzle {
    let state = _.cloneDeep(this);
    if (move == BoulderMove.Shatter) {
      return state.reverseShatter();
    }

    let vec = this.getVec(move);
    vec[0] = -vec[0]
    vec[1] = -vec[1]

    let haveMoved: Boulder[] = [];

    if (state.isPitMove(move)) {
      let possibleCoords: { x: number, y: number }[] = [];
      for (let coord of this.criticalTiles) {
        if (state.getTile(coord.x, coord.y) == Tile.Empty && state.isPassable(coord.x + vec[0], coord.y + vec[1])) {
          if (state.boulders.some((b: Boulder) => b.x == coord.x && b.y == coord.y)) {
            continue; //Don't put a pit under an existing boulder
          }
          possibleCoords.push(coord)
        }
      }

      let pit = _.sample(possibleCoords);
      if (!pit) {
        throw "No pit locations";
      }
      state.grid[pit.x][pit.y] = Tile.Pit;
      let b = new Boulder(pit.x, pit.y)
      state.boulders.push(b)
    }

    for (let b of state.bouldersInVecOrder(vec)) {
      let ox = b.x;
      let oy = b.y;
      let mags = [];
      if (state.isPassable(ox - vec[0], oy - vec[1]) && state.getTile(ox, oy) != Tile.Pit) {
        if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Empty) {
          if (!state.use_fragile) {
            throw "No Fragile supported"
          }
        }
      }
      for (let mag = 1; mag < this.height; mag++) {
        if (state.isPassable(ox + vec[0] * mag, oy + vec[1] * mag)) {
          mags.push(mag)
        } else {
          break;
        }
      }
      if (!state.isPassable(ox - vec[0], oy - vec[1])) {
        mags.push(0)
      }

      let mag = _.sample(mags)
      if (mag === undefined) {
        throw "No options"
      }
      if (mag != 0) {
        haveMoved.push(b)
      }
      b.x += vec[0] * mag
      b.y += vec[1] * mag

      //Add path to Critical Path
      for (var i = 1; i <= mag; i++) {
        let criticalTile = { x: b.x - vec[0] * i, y: b.y - vec[1] * i }
        state.criticalTiles.push(criticalTile)
      }

      if (state.isPassable(ox - vec[0], oy - vec[1]) && state.getTile(ox, oy) != Tile.Pit) {
        if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Empty) {
          if (!state.use_fragile) {
            throw "No Fragile supported"
          }
          state.grid[ox - vec[0]][oy - vec[1]] = Tile.Fragile;
        } else if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Target) {
          throw "Would need to put fragile block on target";
        }
      } else if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Pit) {
        throw "Would need to put fragile block where a pit is";
      } else if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Fragile) {
        throw "Would need to put fragile block where there will already be one";
      }
    }


    if (state.isPortalMove(move)) {
      if (this.hasPortals()) {
        throw "Already has a portal pair"
      }

      let b = _.sample(haveMoved);
      if (b) {
        state.grid[b.x][b.y] = Tile.Portal;

        let possibleCoords: { x: number, y: number }[] = [];
        for (var x = 0; x < this.width; x++) {
          for (var y = 0; y < this.height; y++) {
            if (state.getTile(x, y) == Tile.Empty && state.isPassable(x + vec[0], y + vec[1])) {
              possibleCoords.push({ x: x, y: y })
            }
          }
        }

        let portal = _.sample(possibleCoords);
        if (!portal) {
          throw "No portal locations possible";
        }
        state.grid[portal.x][portal.y] = Tile.Portal;
        b.x = portal.x;
        b.y = portal.y;
        let mags = [];
        for (let mag = 1; mag < this.height; mag++) {
          if (state.isPassable(b.x + vec[0] * mag, b.y + vec[1] * mag)) {
            mags.push(mag)
          } else {
            break;
          }
        }
        let mag = _.sample(mags);
        if (!mag) {
          throw "No where to enter portal from (Shouldn't happen)"
        }
        b.x += vec[0] * mag;
        b.y += vec[1] * mag;
      }
    }

    return state;
  }
  hasPortals(): boolean {
    for (var x = 0; x < this.width; x++) {
      for (var y = 0; y < this.height; y++) {
        if (this.getTile(x, y) == Tile.Portal) {
          return true;
        }
      }
    }
    return false;
  }
  isPitMove(move: BoulderMove) {
    return move == BoulderMove.UpPit || move == BoulderMove.RightPit || move == BoulderMove.LeftPit || move == BoulderMove.DownPit;
  }
  isPortalMove(move: BoulderMove) {
    return move == BoulderMove.UpPortal || move == BoulderMove.RightPortal || move == BoulderMove.LeftPortal || move == BoulderMove.DownPortal;
  }
  isValid(): boolean {
    for (var i = 0; i < this.boulders.length; i++) {
      let b1 = this.boulders[i];
      let tile = this.getTile(b1.x, b1.y);
      if (!this.isTilePassable(tile)) {
        if (tile == Tile.Pit && b1.in_pit) {
          //that's fine
        } else {
          return false;
        }
      }
      for (var j = i + 1; j <= this.boulders.length - 1; j++) {
        let b2 = this.boulders[j];
        if (b1.x == b2.x && b1.y == b2.y) {
          return false;
        }
      }
    }
    return true;
  }
  getMoves(): BoulderMove[] {
    let moves = [BoulderMove.Up, BoulderMove.Down, BoulderMove.Left, BoulderMove.Right]
    if (this.use_crystals) {
      moves.push(BoulderMove.Shatter)
    }
    return moves;
  }
  getReverseMoves(): BoulderMove[] {
    let moves = [BoulderMove.Up, BoulderMove.Down, BoulderMove.Left, BoulderMove.Right]
    if (this.no_basic) {
      moves = []
    }
    if (this.use_crystals) {
      moves.push(BoulderMove.Shatter)
    }
    if (this.use_portals && !this.hasPortals() && randInt(0, 3) == 0) {
      moves.push(BoulderMove.UpPortal)
      moves.push(BoulderMove.RightPortal)
      moves.push(BoulderMove.LeftPortal)
      moves.push(BoulderMove.DownPortal)
    }
    if (this.use_pits) {
      moves.push(BoulderMove.RightPit)
      moves.push(BoulderMove.LeftPit)
      moves.push(BoulderMove.UpPit)
      moves.push(BoulderMove.DownPit)
    }
    return moves;
  }
  getVec(move: BoulderMove): number[] {
    switch (move) {
      case BoulderMove.Right:
        return [1, 0]
      case BoulderMove.RightPortal:
        return [1, 0]
      case BoulderMove.RightPit:
        return [1, 0]
      case BoulderMove.Left:
        return [-1, 0]
      case BoulderMove.LeftPortal:
        return [-1, 0]
      case BoulderMove.LeftPit:
        return [-1, 0]
      case BoulderMove.Up:
        return [0, -1]
      case BoulderMove.UpPortal:
        return [0, -1]
      case BoulderMove.UpPit:
        return [0, -1]
      case BoulderMove.Down:
        return [0, 1]
      case BoulderMove.DownPortal:
        return [0, 1]
      case BoulderMove.DownPit:
        return [0, 1]
      default:
        throw "Error"
    }
  }
  isSolved(): boolean {
    for (var x = 0; x < this.width; x++) {
      for (var y = 0; y < this.height; y++) {
        if (this.getTile(x, y) == Tile.Target) {
          if (!this.boulders.some(b => b.x == x && b.y == y)) {
            return false
          }
        }
      }
    }
    return true;
  }
}