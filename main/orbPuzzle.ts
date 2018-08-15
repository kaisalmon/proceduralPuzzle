import _ from "lodash";
import PuzzleState from './puzzleState'

export enum Tile {
  Empty = ' ',
  Fragile = '□',
  Brick = '■',
  Crystal = '◇',
  Portal = '℗',
  Pit = '▼',
  Target = '◎',
  Bomb = '⚠'
}

export enum OrbMove {
  Up = "Up",
  UpPortal = "Up, using portal",
  UpPit = "Up, into pit",
  UpBomb = "Up, into a bomb",
  Down = "Down",
  DownPortal = "Down, using portal",
  DownPit = "Down, into pit",
  DownBomb = "Down, into a bomb",
  Left = "Left",
  LeftPortal = "Left, using portal",
  LeftPit = "Left, into pit",
  LeftBomb = "Left, into a bomb",
  Right = "Right",
  RightPortal = "Right, using portal",
  RightPit = "Right, into pit",
  RightBomb = "Right, into a bomb",
  Shatter = "Shatter",
}

function randInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}


export class Orb {
  x: number;
  y: number;
  index: number = -1;
  decoy: boolean = false; // TO DO DECOYS DON'T DRAW CRITICAL LINES
  in_pit: boolean = false;
  exploded: boolean = false;
  last_move: [number, number] | undefined;
  last_mag: number | undefined;
  last_contact: { x: number, y: number } | undefined;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  is_frozen(): boolean {
    if (this.in_pit||this.exploded) {
      return true;
    }
    return false;
  }
}

export class OrbPuzzle extends PuzzleState<OrbMove>{
  grid: Tile[][]
  orbs: Orb[];
  criticalTiles: { x: number, y: number }[] = []
  width: number; height: number;
  midpoint: OrbPuzzle|null;

  use_crystals: boolean = false;
  use_pits: boolean = false;
  use_bombs: boolean = false;
  use_portals: boolean = false;
  use_fragile: boolean = false;
  no_basic: boolean = false;

  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
    this.grid = [];
    this.orbs = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.grid[x]) {
          this.grid[x] = []
        }
        this.grid[x].push(Tile.Empty);
      }
    }
  }

  orbsInVecOrder(vec: number[]): Orb[] {
    return this.orbs.sort((a, b) => {
      let aVal = a.x * vec[0] + a.y * vec[1]
      let bVal = b.x * vec[0] + b.y * vec[1]
      if (aVal < bVal) {
        return 1;
      } else {
        return -1;
      }
    })
  }

  toString(showCritical:boolean=false): string {
    let result = "";
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[x][y] == Tile.Target) {
          result += this.orbs.some((b) => b.x == x && b.y == y && !b.is_frozen()) ? "✓" : this.grid[x][y]
        } else if (this.grid[x][y] == Tile.Empty) {
          result +=
            this.orbs.some((b) => b.x == x && b.y == y && !b.is_frozen())
            ? "o"
            : showCritical && this.criticalTiles.some((ct) => ct.x == x && ct.y == y)
              ? "."
              : this.grid[x][y]
        } else if (this.grid[x][y] == Tile.Pit) {
          result += this.orbs.some((b) => b.x == x && b.y == y) ? Tile.Empty : this.grid[x][y]
        } else {
          result += this.orbs.some((b) => b.x == x && b.y == y && !b.is_frozen()) ? "o" : this.grid[x][y]
        }
      }
      result += "\n";
    }
    return result;
  }
  hashString(): string {
    return this.toString();
  }
  apply(move: OrbMove): OrbPuzzle {
    let state = this.clone()

    // FIRST PASS
    for (var i = 0; i < state.orbs.length; i++) {
      state.orbs[i].index = i;
    }
    if (move == OrbMove.Shatter) {
      state.grid = state.grid.map((line: Tile[]) => line.map((t: Tile) => t == Tile.Crystal ? Tile.Empty : t))
      return state;
    }

    let detonations:{x:number, y:number}[]  = [];

    let vec = this.getVec(move);

    for (let b of state.orbsInVecOrder(vec)) {
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
          if (t == Tile.Pit && !state.any_orb_at(ox + vec[0] * mag, oy + vec[1] * mag)) {
            b.in_pit = true;
            b.x = ox + vec[0] * mag;
            b.y = oy + vec[1] * mag;
            b.last_mag = mag;
          }
          //don't break if we didn't move
          if (mag > 1 && t == Tile.Fragile) {
            state.grid[ox + vec[0] * mag][oy + vec[1] * mag] = Tile.Empty;
          }
          if (mag > 1 && t == Tile.Bomb) {
            detonations.push({x: ox + vec[0] * mag, y:oy + vec[1] * mag});
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

    state.midpoint = state.clone()
    state.midpoint.midpoint = null; // We don't need to keep a horrid growing tree here

    // SECOND PASS
    for(let d of detonations){
      for(let x of [d.x-1, d.x, d.x+1]){
        for(let y of [d.y-1, d.y, d.y+1]){
          let t = state.getTile(x,y);
          if(t == Tile.Fragile || t == Tile.Brick || t == Tile.Bomb){
            state.setTile(x, y, Tile.Empty);
          }
          state.orbs.filter(b => b.x == x && b.y == y).forEach(b => {
            b.exploded = true
          });
        }
      }
    }

    state.orbs = state.orbs.sort((a: Orb, b: Orb) => a.index - b.index);
    return state;
  }
  isTilePassable(tile: Tile | undefined): boolean {
    return tile == Tile.Empty || tile == Tile.Target
  }
  clone(): OrbPuzzle{
    let r:OrbPuzzle = Object.create(this); //Shallow clone

    // Remove all pointers from shallow clone
    r.criticalTiles = [];
    r.orbs = [];
    r.grid = [];
    r.midpoint = null;

    for(let ct of this.criticalTiles){
      r.criticalTiles.push(ct);
    }
    for (var x = 0; x < this.width; x++) {
      r.grid[x] = []
      for (var y = 0; y < this.height; y++) {
        r.grid[x][y] = this.grid[x][y];
      }
    }
    for(let o of this.orbs){
      let new_o:Orb = Object.create(o);
      r.orbs.push(new_o)
    }

    return r;
  }
  isPassable(x: number, y: number): boolean {
    if (!this.isTilePassable(this.getTile(x, y))) {
      if (this.getTile(x, y) == Tile.Pit && this.any_orb_at(x, y)) {
        //that's fine
      } else {
        return false;
      }
    }
    for (let b of this.orbs) {
      if (b.x == x && b.y == y && !(b.in_pit||b.exploded)) {
        return false;
      }
    }
    return true;
  }
  setTile(x: number, y: number, t:Tile): void{
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return
    }
    this.grid[x][y] = t;
  }
  getTile(x: number, y: number): Tile | undefined {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return undefined;
    }
    return this.grid[x][y];
  }

  any_orb_at(x: number, y: number): Orb|undefined {
    return (this.orbs.filter(b => b.x == x && b.y == y)).pop()
  }


  reverseShatter(): OrbPuzzle {
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

  reverseBomb(vec:[number, number]): void{
    let positions:{x:number, y:number}[] = []
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if(!this.criticalTiles.some(ct=>ct.x == x && ct.y == y)){
          continue
        }
        if(this.getTile(x,y) !== Tile.Empty){
          continue;
        }
        let invalid = false;
        for(let check_x of [x-1, x, x+1]){
          for(let check_y of [y-1, y, y+1]){
            if(this.getTile(check_x, check_y) == Tile.Brick || this.getTile(check_x, check_y) == Tile.Fragile){
              invalid = true;
              break;
            }
            if(this.any_orb_at(check_x, check_y)){
              invalid = true;
              break;
            }
          }
          if(invalid){
            break
          }
        }
        if(invalid){
          continue
        }
        positions.push({x, y});
      }
    }
    let p = _.sample(positions);
    if(!p) throw "No valid bomb locations"
    this.setTile(p.x, p.y, Tile.Bomb);
    this.orbs.push(new Orb(p.x + vec[0], p.y + vec[1]));

    for(let create_x of [p.x-1, p.x, p.x+1]){
      for(let create_y of [p.y-1, p.y, p.y+1]){
        if(create_x == p.x && create_y == p.y)continue;
        if(this.any_orb_at(create_x, create_y))continue;
        if(this.getTile(create_x, create_y) !== Tile.Empty)continue;
        if(Math.random() > 0.3){
          this.setTile(create_x, create_y, Tile.Brick);
        }else if(Math.random() > 0.3){
          if(this.use_fragile){
            this.setTile(create_x, create_y, Tile.Fragile);
          }else{
            this.setTile(create_x, create_y, Tile.Brick);
          }
        }
      }
    }
  }

  reverse(move: OrbMove): OrbPuzzle {
    let state = this.clone();
    if (move == OrbMove.Shatter) {
      return state.reverseShatter();
    }
    let vec = this.getVec(move);
    vec[0] = -vec[0]
    vec[1] = -vec[1]

    if (state.isBombMove(move)) {
      state.reverseBomb(vec);
    }

    let haveMoved: Orb[] = [];

    if (state.isPitMove(move)) {
      let possibleCoords: { x: number, y: number }[] = [];
      for (let coord of this.criticalTiles) {
        if (state.getTile(coord.x, coord.y) == Tile.Empty && state.isPassable(coord.x + vec[0], coord.y + vec[1])) {
          if (state.orbs.some((b: Orb) => b.x == coord.x && b.y == coord.y)) {
            continue; //Don't put a pit under an existing orb
          }
          possibleCoords.push(coord)
        }
      }

      let pit = _.sample(possibleCoords);
      if (!pit) {
        throw "No pit locations";
      }
      state.grid[pit.x][pit.y] = Tile.Pit;
      let b = new Orb(pit.x, pit.y)
      state.orbs.push(b)
    }

    for (let b of state.orbsInVecOrder(vec)) {
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
      if (!state.isPassable(ox - vec[0], oy - vec[1]) && state.getTile(ox - vec[0], oy - vec[1]) !== Tile.Bomb) {
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
  isPitMove(move: OrbMove) {
    return move == OrbMove.UpPit || move == OrbMove.RightPit || move == OrbMove.LeftPit || move == OrbMove.DownPit;
  }
  isBombMove(move: OrbMove) {
    return move == OrbMove.UpBomb || move == OrbMove.RightBomb || move == OrbMove.LeftBomb || move == OrbMove.DownBomb;
  }
  isPortalMove(move: OrbMove) {
    return move == OrbMove.UpPortal || move == OrbMove.RightPortal || move == OrbMove.LeftPortal || move == OrbMove.DownPortal;
  }
  isValid(): boolean {
    for (var i = 0; i < this.orbs.length; i++) {
      let b1 = this.orbs[i];
      let tile = this.getTile(b1.x, b1.y);
      if (!this.isTilePassable(tile)) {
        if (tile == Tile.Pit && b1.in_pit) {
          //that's fine
        } else {
          return false;
        }
      }
      for (var j = i + 1; j <= this.orbs.length - 1; j++) {
        let b2 = this.orbs[j];
        if (b1.x == b2.x && b1.y == b2.y) {
          return false;
        }
      }
    }
    return true;
  }
  getMoves(): OrbMove[] {
    let moves = [OrbMove.Up, OrbMove.Down, OrbMove.Left, OrbMove.Right]
    if (this.use_crystals) {
      moves.push(OrbMove.Shatter)
    }
    return moves;
  }
  getReverseMoves(): OrbMove[] {
    let moves = [OrbMove.Up, OrbMove.Down, OrbMove.Left, OrbMove.Right]
    if (this.no_basic) {
      moves = []
    }
    if (this.use_crystals) {
      moves.push(OrbMove.Shatter)
    }
    if (this.use_portals && !this.hasPortals() && randInt(0, 3) == 0) {
      moves.push(OrbMove.UpPortal)
      moves.push(OrbMove.RightPortal)
      moves.push(OrbMove.LeftPortal)
      moves.push(OrbMove.DownPortal)
    }
    if (this.use_pits) {
      moves.push(OrbMove.RightPit)
      moves.push(OrbMove.LeftPit)
      moves.push(OrbMove.UpPit)
      moves.push(OrbMove.DownPit)
    }
    if (this.use_bombs) {
      moves.push(OrbMove.RightBomb)
      moves.push(OrbMove.LeftBomb)
      moves.push(OrbMove.UpBomb)
      moves.push(OrbMove.DownBomb)
    }
    return moves;
  }
  getVec(move: OrbMove): [number, number]{
    switch (move) {
      case OrbMove.Right:
        return [1, 0]
      case OrbMove.RightPortal:
        return [1, 0]
      case OrbMove.RightPit:
        return [1, 0]
      case OrbMove.RightBomb:
        return [1, 0]
      case OrbMove.Left:
        return [-1, 0]
      case OrbMove.LeftPortal:
        return [-1, 0]
      case OrbMove.LeftPit:
        return [-1, 0]
      case OrbMove.LeftBomb:
        return [-1, 0]
      case OrbMove.Up:
        return [0, -1]
      case OrbMove.UpPortal:
        return [0, -1]
      case OrbMove.UpPit:
        return [0, -1]
      case OrbMove.UpBomb:
        return [0, -1]
      case OrbMove.Down:
        return [0, 1]
      case OrbMove.DownPortal:
        return [0, 1]
      case OrbMove.DownPit:
        return [0, 1]
      case OrbMove.DownBomb:
        return [0, 1]
      default:
        throw "Cannot calculate vector"
    }
  }
  isSolved(): boolean {
    for (var x = 0; x < this.width; x++) {
      for (var y = 0; y < this.height; y++) {
        if (this.getTile(x, y) == Tile.Target) {
          if (!this.orbs.some(b => b.x == x && b.y == y)) {
            return false
          }
        }
      }
    }
    return true;
  }

  isFailed(): boolean {
    // If there are more targets than unfrozen orbs, the puzzles is a failure
    let orbs = this.orbs.filter(b => !b.is_frozen()).length;
    let targets = this.grid.reduce((acc, line) => acc + line.filter(t=>t == Tile.Target).length, 0);
    if(orbs < targets){
      return true;
    }

    return false;
  }

  getHeuristic(): number{
    let v= 0;
    if(this.isFailed()){
      return Number.POSITIVE_INFINITY;
    }
    for(let o of this.orbs.filter(o => !o.is_frozen())){
      let shortestDistance = Number.POSITIVE_INFINITY;
      for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
          if (this.getTile(x, y) == Tile.Target) {
            let dx = x-o.x;
            let dy = y-o.y
            let dist = Math.abs(dx)+Math.abs(dy);
            if(dist < shortestDistance){
              shortestDistance = dist;
            }
          }
        }
      }
      v = Math.max(shortestDistance, v);
    }
    return v/this.width/this.height * 50
  }
}
