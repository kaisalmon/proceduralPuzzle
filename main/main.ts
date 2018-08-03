import * as _ from "lodash";
import * as $ from 'jquery'
import swal from 'sweetalert2'

abstract class PuzzleState<MOVE>{
  abstract toString(): string;
  abstract hashString(): string;
  abstract apply(move: MOVE): PuzzleState<MOVE>;
  abstract reverse(move: MOVE): PuzzleState<MOVE>;
  abstract isValid(): boolean;
  abstract isSolved(): boolean;
  abstract getMoves(): MOVE[];
  abstract getReverseMoves(): MOVE[];

  solve(maxDepth: number = 5, curDepth: number = 0): PuzzleState<MOVE>[] | undefined {
    if (this.isSolved()) {
      return [this]
    }

    if (curDepth >= maxDepth) {
      return undefined;
    }
    let shortestSolution: PuzzleState<MOVE>[] | undefined = undefined;
    let nextDepth = maxDepth;
    for (let m of this.getMoves()) {
      let s = this.apply(m);

      console.log("Trying " + m)
      if (s.hashString() === this.hashString()) {
        console.log("No change")
        continue
      }
      let ss = s.solve(nextDepth, curDepth + 1)
      if (ss) {
        if (shortestSolution === undefined || ss.length < shortestSolution.length) {
          shortestSolution = ss;
          nextDepth = shortestSolution.length - 1;
        } else {
          console.log('Nope')
        }
      }
    }
    if (shortestSolution) {
      let arr: PuzzleState<MOVE>[] = [this]
      arr = arr.concat(shortestSolution)
      return arr;
    }
  }
  getStack(depth: number, debug: boolean = false): [PuzzleState<MOVE>[], MOVE[]] {
    let bad_states = []
    let bad_count = 0;
    let itr_count = 0;
    let stack: PuzzleState<MOVE>[] = [this]
    let moves: MOVE[] = [];
    while (stack.length < depth) {
      itr_count++;
      if (itr_count > 1000) {
        throw "Too many iterations"
      }

      let p = stack[stack.length - 1]

      let nexts: [PuzzleState<MOVE>, MOVE][] = [];
      for (let move of p.getReverseMoves()) {
        try {
          let next = p.reverse(move);
          if (!next.isValid()) {
            throw "Invalid state"
          }
          if (next.hashString() === p.hashString()) {
            console.error("Pointless move")
            throw "Pointless Move"
          }
          if (next.apply(move).hashString() != p.hashString()) {
            throw {
              "name": "FatalError",
              "message": "Reversing move and applying move have different results",
              "starting-point": next,
              "a": next.apply(move),
              "b": p,
              "a-hash": next.apply(move).hashString(),
              "b-hash": p.hashString(),
              "move": move
            }
          }
          nexts.push([next, move])
        } catch (e) {
          if (debug) {
            //console.error(e)
          }
          if (e.name == "FatalError") {
            console.error(e)
            throw e;
          }
        }
      }
      if (nexts.length == 0) {
        bad_count++;
        if (bad_count > 30) {
          throw "Maximum bad states exceeded"
        }

        if (bad_states.indexOf(p.hashString()) === -1) {
          stack.pop()
          moves.pop()
          bad_states.push(p.hashString())
          if (stack.length == 0) {
            throw "Bad Solution"
          }
        } else {
          stack = [this]
          moves = []
          if (bad_states.indexOf(this.hashString()) !== -1) {
            throw "Bad Solution"
          }
        }
      } else {
        let next = _.sample(nexts);
        if (!next) {
          throw "No valid options"
        }
        stack.push(next[0])
        moves.push(next[1])
      }
    }
    return [stack.reverse(), moves.reverse()]
  }
}
/*******************************************/

export enum Tile {
  Empty = ' ',
  Fragile = '□',
  Brick = '■',
  Crystal = '◇',
  Portal = '℗',
  Pit = '▼',
  Target = '◎'
}

export class Boulder {
  x: number;
  y: number;
  index: number = -1;
  in_pit: boolean = false;
  last_move: number[] | undefined;
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
    state.boulders = state.boulders.filter((b:Boulder) => toBeRemoved.indexOf(b) == -1);
    state.boulders = state.boulders.sort((a:Boulder, b:Boulder) => a.index - b.index);
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
          if (state.boulders.some((b:Boulder) => b.x == coord.x && b.y == coord.y)) {
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
        throw "Would need to put fragile block where a pit ia pit is";
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
    for (var i = 0; i < this.boulders.length - 1; i++) {
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

enum BoulderMove {
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

/*
let p =new BoulderPuzzle(5, 3)
p.boulders.push(new Boulder(2,1))
p.grid[1][1] = Tile.Fragile;
console.log(p.toString())
p = p.reverse(BoulderMove.Left);
console.log(p.toString())


*/
function randInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

async function tryUntilSuccess<T>(f: () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let i = 0;
    function _attempt(): void {
      try {
        let result = f();
        resolve(result)
      } catch (e) {
        //console.error(e)
        for (var j = 0; j < 10; j++) {
          i++;
          if (i % 10) {
            console.warn("Over " + i + " attempts..")
          }
          if (i > 5000) {
            reject();
            return;
          }
        }
        requestAnimationFrame(_attempt)
      }
    }
    _attempt();
  })
}

/*
let stack:BoulderPuzzle[] = []
let p =new BoulderPuzzle(10,10)
p.grid[4][3] = Tile.Pit;
p.boulders.push(new Boulder(4,4))
stack.push(p)
p = p.reverse(BoulderMove.Up)
stack.push(p)
stack = stack.reverse();
*/

$(document).ready(() => {
  (async function() {
    let params = getUrlVars();
    let size: number = parseInt(params['size']) || 10;
    let boulders: number = parseInt(params['boulders']) || 2;
    let depth: number = parseInt(params['depth']) || 4;
    let mindepth: number = parseInt(params['mindepth']) || depth;
    let fragile: boolean = params['fragile'] == "true";
    let crystal: boolean = params['crystal'] == "true";
    let pits: boolean = params['pits'] == "true";

    function createPuzzle(): [BoulderPuzzle[], BoulderMove[]] {
      let p = new BoulderPuzzle(size, size)
      for (let i = 0; i < (fragile ? 1 / 25 : 0) * p.width * p.height; i++) {
        let x = randInt(0, p.width);
        let y = randInt(0, p.height);
        p.grid[x][y] = Tile.Fragile;
      }
      for (let i = 0; i < p.width * p.height / 5; i++) {
        let x = randInt(0, p.width);
        let y = randInt(0, p.height);
        p.grid[x][y] = Tile.Brick;
      }

      for (let i = 0; i < boulders; i++) {
        let x = randInt(0, p.width);
        let y = randInt(0, p.height);
        p.grid[x][y] = Tile.Target
        p.boulders.push(new Boulder(x, y))
      }
      p.use_fragile = fragile;
      p.use_crystals = crystal;
      p.use_pits = pits;

      let stack = p.getStack(depth, true)
      let solution = stack[0][0].solve();
      console.log("Min Steps:", solution ? solution.length - 1 : " > 5")
      if (solution && solution.length < mindepth) {
        throw "too short"
      }
      let board: BoulderPuzzle = stack[0][0] as BoulderPuzzle;
      if (crystal && !board.grid.some(line => line.some(tile => tile == Tile.Crystal))) {
        throw "No crystals"
      }
      if (pits && !board.grid.some(line => line.some(tile => tile == Tile.Pit))) {
        throw "No Pits"
      }

      return [stack[0] as BoulderPuzzle[], stack[1] as BoulderMove[]]
    }

    let stack:[BoulderPuzzle[], BoulderMove[]]|undefined = undefined;
    swal({
      title: 'Generating Level',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      onOpen: async () => {
        swal.showLoading()
      }
    })

    try{
      stack = await tryUntilSuccess(createPuzzle);
      swal.close();
    }catch(e){
      swal("Couldn't generate level!","feel free to try a few more times", "error")
      return
    }

    let board = stack[0][0];
    let solution = stack[1]
    $('.hint').click(()=>{
      swal(solution.join("\n"))
    });
    let orig = board;
    $('.reset').click(()=>{
      swal({
        title: "Restart puzzle?",
        type: "question",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No!",
        useRejections: true,
        focusCancel: true
      }).then(() => {
        board = orig;
        $tiles = create_board(board);
        moving = false;
      });
    });

    let $tiles = create_board(board);
    let moving = false;
    $('body').keyup((e) => {
      let move: BoulderMove | undefined = undefined;
      switch (e.which) {
        case 13:
          move = BoulderMove.Shatter;
          break;
        case 32:
          move = BoulderMove.Shatter;
          break;
        case 37:
          move = BoulderMove.Left;
          break;
        case 38:
          move = BoulderMove.Up;
          break;
        case 39:
          move = BoulderMove.Right;
          break;
        case 40:
          move = BoulderMove.Down;
          break;
      }
      if (move && !moving) {
        moving = true;
        board = board.apply(move)
        $('.puzzles .boulder').each((i, e) => {
          let b = board.boulders[i];
          if (b) {
            let s = 0.1 * (b.last_mag || 0);
            $(e).css('transition', 'transform ' + s + 's ease-in')
            $(e).css('transform',  'translate(calc(var(--tsize) * '+b.x+'), calc(var(--tsize) * '+b.y+')')
            if (b.in_pit) {
              $(e).addClass('boulder--in-pit');
            } else {
              $(e).removeClass('boulder--in-pit');
            }
            setTimeout(() => {
              if (b.last_contact) {
                let t = board.getTile(b.last_contact.x, b.last_contact.y)
                let $t = $tiles[b.last_contact.x][b.last_contact.y]
                if ($t && t == Tile.Empty) {
                  $t.remove()
                }
              }
            }, s * 1000)
          }
        })
        let time = board.boulders.reduce((t, b) => Math.max(b.last_mag || 0, t), 0) * 100;
        setTimeout(() => {
          moving = false;
          for (let x = 0; x < board.width; x++) {
            for (let y = 0; y < board.height; y++) {
              let t = board.getTile(x, y)
              let $t = $tiles[x][y]
              if ($t && t == Tile.Empty) {
                $t.remove()
              }
            }
          }
          if (board.isSolved()) {
            setTimeout(() => {
              swal({
                title: "You win!",
                type: "success"
              })
            }, 400);
          }
        }, time)
      }
    })

    function getUrlVars(): { [id: string]: string } {
      var vars: { [id: string]: string } = {};
      window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
        function(m, key, value: string): string {
          vars[key] = value;
          return "";
        }
      );
      return vars;
    }
  })();

})
function create_board(board: BoulderPuzzle): JQuery[][] {
  $('.puzzle-wrapper').remove();

  let $wrapper = $('<div/>').addClass('puzzle-wrapper').appendTo('body')
  $("body").attr("style","--tsize:calc(var(--bsize) / "+board.width+")");
  $('<div/>').addClass('puzzles')
    .appendTo($wrapper)

  var $tiles: JQuery[][] = [];
  for (let x = 0; x < board.width; x++) {
    $tiles[x] = []
    for (let y = 0; y < board.height; y++) {
      let t = board.getTile(x, y)
      if (t == Tile.Empty) {
        continue;
      }
      let tileName = 'brick';
      if (t == Tile.Target) {
        tileName = 'target';
      }
      if (t == Tile.Fragile) {
        tileName = 'fragile';
      }
      if (t == Tile.Crystal) {
        tileName = 'crystal';
      }
      if (t == Tile.Pit) {
        tileName = 'pit';
      }
      let $t = $('<div/>')
        .addClass('tile')
        .addClass('tile--' + tileName)
        .css('transform', 'translate(calc(var(--tsize) * '+x+'), calc(var(--tsize) * '+y+')')
        .appendTo('.puzzles')
      $tiles[x][y] = $t
    }
  }
  for (let b of board.boulders) {
    $('.puzzles').append(
      $('<div class="boulder"/>')
        .css('transform',  'translate(calc(var(--tsize) * '+b.x+'), calc(var(--tsize) * '+b.y+')')
        .data('x', b.x)
        .data('y', b.y)
    );
  }
  return $tiles;
}
