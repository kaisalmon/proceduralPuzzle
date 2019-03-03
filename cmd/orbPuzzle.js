"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puzzleState_1 = __importDefault(require("./puzzleState"));
var Tile;
(function (Tile) {
    Tile["Empty"] = " ";
    Tile["Fragile"] = "\u25A1";
    Tile["Brick"] = "\u25A0";
    Tile["Crystal"] = "\u25C7";
    Tile["Portal"] = "\u2117";
    Tile["Pit"] = "\u25BC";
    Tile["Target"] = "\u25CE";
    Tile["Bomb"] = "\u26A0";
})(Tile = exports.Tile || (exports.Tile = {}));
var OrbMove;
(function (OrbMove) {
    OrbMove["Up"] = "Up";
    OrbMove["UpPortal"] = "Up, using portal";
    OrbMove["UpPit"] = "Up, into pit";
    OrbMove["UpBomb"] = "Up, into a bomb";
    OrbMove["Down"] = "Down";
    OrbMove["DownPortal"] = "Down, using portal";
    OrbMove["DownPit"] = "Down, into pit";
    OrbMove["DownBomb"] = "Down, into a bomb";
    OrbMove["Left"] = "Left";
    OrbMove["LeftPortal"] = "Left, using portal";
    OrbMove["LeftPit"] = "Left, into pit";
    OrbMove["LeftBomb"] = "Left, into a bomb";
    OrbMove["Right"] = "Right";
    OrbMove["RightPortal"] = "Right, using portal";
    OrbMove["RightPit"] = "Right, into pit";
    OrbMove["RightBomb"] = "Right, into a bomb";
    OrbMove["Shatter"] = "Shatter";
})(OrbMove = exports.OrbMove || (exports.OrbMove = {}));
class Orb {
    constructor(x, y) {
        this.index = -1;
        this.decoy = false;
        this.in_pit = false;
        this.in_portal = false;
        this.exploded = false;
        this.last_moves = [];
        this.reversed_move_count = 0;
        this.x = x;
        this.y = y;
    }
    is_frozen() {
        if (this.in_pit || this.exploded || this.in_portal) {
            return true;
        }
        return false;
    }
}
exports.Orb = Orb;
class OrbPuzzle extends puzzleState_1.default {
    constructor(width, height, seed) {
        super(seed);
        this.criticalTiles = [];
        this.use_crystals = false;
        this.use_pits = false;
        this.use_bombs = false;
        this.use_portals = false;
        this.use_fragile = false;
        this.no_basic = false;
        this.width = width;
        this.height = height;
        this.grid = [];
        this.orbs = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.grid[x]) {
                    this.grid[x] = [];
                }
                this.grid[x].push(Tile.Empty);
            }
        }
    }
    orbsInVecOrder(vec) {
        return this.orbs.sort((a, b) => {
            let aVal = a.x * vec[0] + a.y * vec[1];
            let bVal = b.x * vec[0] + b.y * vec[1];
            if (aVal < bVal) {
                return 1;
            }
            else {
                return -1;
            }
        });
    }
    toString(showCritical = false) {
        let result = "";
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[x][y] == Tile.Target) {
                    result += this.orbs.some((b) => b.x == x && b.y == y && !b.is_frozen()) ? "✓" : this.grid[x][y];
                }
                else if (this.grid[x][y] == Tile.Empty) {
                    result +=
                        this.orbs.some((b) => b.x == x && b.y == y && !b.is_frozen())
                            ? "o"
                            : showCritical && this.criticalTiles.some((ct) => ct.x == x && ct.y == y)
                                ? "."
                                : this.grid[x][y];
                }
                else if (this.grid[x][y] == Tile.Pit) {
                    result += this.orbs.some((b) => b.x == x && b.y == y) ? Tile.Empty : this.grid[x][y];
                }
                else {
                    result += this.orbs.some((b) => b.x == x && b.y == y && !b.is_frozen()) ? "o" : this.grid[x][y];
                }
            }
            result += "\n";
        }
        return result;
    }
    hashString() {
        return this.toString();
    }
    moveOrb(b, vec) {
        let result = {
            detonations: []
        };
        if (b.is_frozen()) {
            return result;
        }
        let ox = b.x;
        let oy = b.y;
        let last_contact = null;
        for (let mag = 1; mag < this.height; mag++) {
            if (this.isPassable(ox + vec[0] * mag, oy + vec[1] * mag)) {
                b.x = ox + vec[0] * mag;
                b.y = oy + vec[1] * mag;
            }
            else {
                let t = this.getTile(ox + vec[0] * mag, oy + vec[1] * mag);
                if (t == Tile.Pit && !this.any_orb_at(ox + vec[0] * mag, oy + vec[1] * mag)) {
                    b.in_pit = true;
                    b.x = ox + vec[0] * mag;
                    b.y = oy + vec[1] * mag;
                }
                if (t == Tile.Portal) {
                    b.in_portal = true;
                    b.x = ox + vec[0] * mag;
                    b.y = oy + vec[1] * mag;
                    let other_portal = null;
                    for (var x = 0; x < this.width; x++) {
                        for (var y = 0; y < this.height; y++) {
                            if (x == b.x && y == b.y)
                                continue;
                            if (this.getTile(x, y) == Tile.Portal) {
                                other_portal = { x, y };
                            }
                        }
                    }
                    if (!other_portal) {
                        throw "Can't find other portal";
                    }
                    result.portal_event = {
                        from: {
                            x: b.x,
                            y: b.y
                        },
                        to: other_portal
                    };
                }
                //don't break if we didn't move
                if (mag > 1 && t == Tile.Fragile) {
                    this.grid[ox + vec[0] * mag][oy + vec[1] * mag] = Tile.Empty;
                }
                if (mag > 1 && t == Tile.Bomb) {
                    result.detonations.push({ x: ox + vec[0] * mag, y: oy + vec[1] * mag });
                }
                break;
            }
            if (mag != 0) {
                last_contact = { x: b.x + vec[0], y: b.y + vec[1] };
            }
            else {
                last_contact = null;
            }
        }
        b.last_moves.push({
            from: { x: ox, y: oy },
            to: { x: b.x, y: b.y },
            mag: { x: b.x - ox, y: b.y - oy },
            last_contact
        });
        return result;
    }
    apply(move) {
        let state = this.clone();
        // FIRST PASS
        for (var i = 0; i < state.orbs.length; i++) {
            state.orbs[i].last_moves = [];
            state.orbs[i].index = i;
        }
        if (move == OrbMove.Shatter) {
            state.grid = state.grid.map((line) => line.map((t) => t == Tile.Crystal ? Tile.Empty : t));
            return state;
        }
        let move_results = [];
        let vec = this.getVec(move);
        for (let b of state.orbsInVecOrder(vec)) {
            let r = state.moveOrb(b, vec);
            move_results.push(r);
        }
        // SECOND PASS
        for (let result of move_results) {
            for (let d of result.detonations) {
                for (let x of [d.x - 1, d.x, d.x + 1]) {
                    for (let y of [d.y - 1, d.y, d.y + 1]) {
                        let t = state.getTile(x, y);
                        if (t == Tile.Fragile || t == Tile.Brick || t == Tile.Bomb) {
                            state.setTile(x, y, Tile.Empty);
                        }
                        state.orbs.filter(b => b.x == x && b.y == y && !b.is_frozen()).forEach(b => {
                            b.exploded = true;
                        });
                    }
                }
            }
            if (result.portal_event) {
                let o = state.any_orb_at(result.portal_event.from.x, result.portal_event.from.y);
                if (!o)
                    throw "Portaled orb not where it should be ";
                o.in_portal = false;
                state.setTile(o.x, o.y, Tile.Empty);
                o.last_moves.push({
                    from: { x: o.x, y: o.y },
                    to: result.portal_event.to,
                    instant: true,
                    mag: { x: result.portal_event.to.x - o.x, y: result.portal_event.to.y - o.y },
                    last_contact: null
                });
                o.x = result.portal_event.to.x;
                o.y = result.portal_event.to.y;
                state.setTile(o.x, o.y, Tile.Empty);
                state.moveOrb(o, vec);
            }
        }
        //Re order
        state.orbs = state.orbs.sort((a, b) => a.index - b.index);
        return state;
    }
    isTilePassable(tile) {
        return tile == Tile.Empty || tile == Tile.Target;
    }
    clone() {
        let r = Object.create(this); //Shallow clone
        // Remove all pointers from shallow clone;
        r.criticalTiles = [];
        r.orbs = [];
        r.grid = [];
        for (let ct of this.criticalTiles) {
            r.criticalTiles.push(ct);
        }
        for (var x = 0; x < this.width; x++) {
            r.grid[x] = [];
            for (var y = 0; y < this.height; y++) {
                r.grid[x][y] = this.grid[x][y];
            }
        }
        for (let o of this.orbs) {
            let new_o = Object.create(o);
            r.orbs.push(new_o);
        }
        return r;
    }
    isPassable(x, y) {
        if (!this.isTilePassable(this.getTile(x, y))) {
            if ((this.getTile(x, y) == Tile.Pit || this.getTile(x, y) == Tile.Portal) && this.any_orb_at(x, y)) {
                //that's fine
            }
            else {
                return false;
            }
        }
        for (let b of this.orbs) {
            if (b.x == x && b.y == y && !(b.is_frozen())) {
                return false;
            }
        }
        return true;
    }
    setTile(x, y, t) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }
        this.grid[x][y] = t;
    }
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return undefined;
        }
        return this.grid[x][y];
    }
    any_orb_at(x, y) {
        return (this.orbs.filter(b => b.x == x && b.y == y)).pop();
    }
    reverseShatter() {
        if (this.criticalTiles.length < 8) {
            throw "Not enough critical tiles for shatter";
        }
        if (this.grid.some(line => line.some(tile => tile == Tile.Crystal))) {
            throw "Crystals already present";
        }
        for (var i = 0; i < this.randInt(1, 4); i++) {
            let coord = this.sample(this.criticalTiles);
            if (coord) {
                if (this.getTile(coord.x, coord.y) == Tile.Empty) {
                    this.grid[coord.x][coord.y] = Tile.Crystal;
                }
            }
        }
        for (var i = 0; i < Math.min(this.height, this.width); i++) {
            let x = this.randInt(0, this.width);
            let y = this.randInt(0, this.height);
            if (this.getTile(x, y) == Tile.Empty) {
                this.grid[x][y] = Tile.Crystal;
            }
        }
        return this;
    }
    reverseBomb(vec) {
        let positions = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.criticalTiles.some(ct => ct.x == x && ct.y == y)) {
                    continue;
                }
                if (this.getTile(x, y) !== Tile.Empty) {
                    continue;
                }
                let invalid = false;
                for (let check_x of [x - 1, x, x + 1]) {
                    for (let check_y of [y - 1, y, y + 1]) {
                        if (this.getTile(check_x, check_y) == Tile.Brick || this.getTile(check_x, check_y) == Tile.Fragile) {
                            invalid = true;
                            break;
                        }
                        if (this.any_orb_at(check_x, check_y)) {
                            invalid = true;
                            break;
                        }
                    }
                    if (invalid) {
                        break;
                    }
                }
                if (invalid) {
                    continue;
                }
                positions.push({ x, y });
            }
        }
        let p = this.sample(positions);
        if (!p)
            throw "No valid bomb locations";
        this.setTile(p.x, p.y, Tile.Bomb);
        this.orbs.push(new Orb(p.x + vec[0], p.y + vec[1]));
        for (let create_x of [p.x - 1, p.x, p.x + 1]) {
            for (let create_y of [p.y - 1, p.y, p.y + 1]) {
                if (create_x == p.x && create_y == p.y)
                    continue;
                if (this.any_orb_at(create_x, create_y))
                    continue;
                if (this.getTile(create_x, create_y) !== Tile.Empty)
                    continue;
                if (this.random() > 0.3) {
                    this.setTile(create_x, create_y, Tile.Brick);
                }
                else if (this.random() > 0.3) {
                    if (this.use_fragile) {
                        this.setTile(create_x, create_y, Tile.Fragile);
                    }
                    else {
                        this.setTile(create_x, create_y, Tile.Brick);
                    }
                }
            }
        }
    }
    reverse(move, retcon) {
        let state = this.clone();
        if (move == OrbMove.Shatter) {
            return state.reverseShatter();
        }
        let vec = this.getVec(move);
        vec[0] = -vec[0];
        vec[1] = -vec[1];
        if (state.isBombMove(move)) {
            state.reverseBomb(vec);
        }
        let haveMoved = [];
        if (state.isPitMove(move)) {
            let possibleCoords = [];
            for (let coord of this.criticalTiles) {
                if (state.getTile(coord.x, coord.y) == Tile.Empty && state.isPassable(coord.x + vec[0], coord.y + vec[1])) {
                    if (state.orbs.some((b) => b.x == coord.x && b.y == coord.y)) {
                        continue; //Don't put a pit under an existing orb
                    }
                    possibleCoords.push(coord);
                }
            }
            let pit = this.sample(possibleCoords);
            if (!pit) {
                throw "No pit locations";
            }
            state.grid[pit.x][pit.y] = Tile.Pit;
            let b = new Orb(pit.x, pit.y);
            state.orbs.push(b);
        }
        for (let b of state.orbsInVecOrder(vec)) {
            let ox = b.x;
            let oy = b.y;
            let mags = [];
            if (state.isPassable(ox - vec[0], oy - vec[1]) && state.getTile(ox, oy) != Tile.Pit) {
                if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Empty) {
                    if (!state.use_fragile) {
                        //    throw "No Fragile supported"
                    }
                }
            }
            for (let mag = 1; mag < this.height; mag++) {
                if (state.isPassable(ox + vec[0] * mag, oy + vec[1] * mag)) {
                    mags.push(mag);
                }
                else {
                    break;
                }
            }
            if (!state.isPassable(ox - vec[0], oy - vec[1]) && state.getTile(ox - vec[0], oy - vec[1]) !== Tile.Bomb) {
                mags.push(0);
            }
            let mag = this.sample(mags);
            if (mag === undefined) {
                throw "No options";
            }
            if (mag != 0) {
                haveMoved.push(b);
                b.reversed_move_count++;
            }
            b.x += vec[0] * mag;
            b.y += vec[1] * mag;
            //Add path to Critical Path if not a decoy orbs
            if (!b.decoy) {
                for (var i = 1; i <= mag; i++) {
                    let criticalTile = { x: b.x - vec[0] * i, y: b.y - vec[1] * i };
                    state.criticalTiles.push(criticalTile);
                }
            }
            if (state.isPassable(ox - vec[0], oy - vec[1]) && state.getTile(ox, oy) != Tile.Pit) {
                if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Empty) {
                    if (state.use_fragile) {
                        state.grid[ox - vec[0]][oy - vec[1]] = Tile.Fragile;
                    }
                    else {
                        if (state.criticalTiles.some((t) => t.x === ox - vec[0] && t.y === oy - vec[1])) {
                            throw "Would need to retcon a brick along critical path";
                        }
                        retcon((future_state) => {
                            if (future_state.grid[ox - vec[0]][oy - vec[1]] !== Tile.Empty) {
                                throw "Would need to retcon a brick over non empty tile";
                            }
                            future_state.grid[ox - vec[0]][oy - vec[1]] = Tile.Brick;
                        });
                        state.grid[ox - vec[0]][oy - vec[1]] = Tile.Brick;
                    }
                }
                else if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Target) {
                    throw "Would need to put fragile block on target";
                }
            }
            else if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Pit) {
                throw "Would need to put fragile block where a pit is";
            }
            else if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Fragile) {
                throw "Would need to put fragile block where there will already be one";
            }
        }
        if (state.isPortalMove(move)) {
            if (this.hasPortals()) {
                throw "Already has a portal pair";
            }
            let b = this.sample(haveMoved);
            if (b) {
                state.grid[b.x][b.y] = Tile.Portal;
                let possibleCoords = [];
                for (var x = 0; x < this.width; x++) {
                    for (var y = 0; y < this.height; y++) {
                        if (state.getTile(x, y) == Tile.Empty && state.isPassable(x + vec[0], y + vec[1])) {
                            possibleCoords.push({ x: x, y: y });
                        }
                    }
                }
                let portal = this.sample(possibleCoords);
                if (!portal) {
                    throw "No portal locations possible";
                }
                state.grid[portal.x][portal.y] = Tile.Portal;
                b.x = portal.x;
                b.y = portal.y;
                let mags = [];
                for (let mag = 1; mag < this.height; mag++) {
                    if (state.isPassable(b.x + vec[0] * mag, b.y + vec[1] * mag)) {
                        mags.push(mag);
                    }
                    else {
                        break;
                    }
                }
                let mag = this.sample(mags);
                if (!mag) {
                    throw "No where to enter portal from (Shouldn't happen)";
                }
                b.x += vec[0] * mag;
                b.y += vec[1] * mag;
            }
        }
        return state;
    }
    hasPortals() {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.getTile(x, y) == Tile.Portal) {
                    return true;
                }
            }
        }
        return false;
    }
    isPitMove(move) {
        return move == OrbMove.UpPit || move == OrbMove.RightPit || move == OrbMove.LeftPit || move == OrbMove.DownPit;
    }
    isBombMove(move) {
        return move == OrbMove.UpBomb || move == OrbMove.RightBomb || move == OrbMove.LeftBomb || move == OrbMove.DownBomb;
    }
    isPortalMove(move) {
        return move == OrbMove.UpPortal || move == OrbMove.RightPortal || move == OrbMove.LeftPortal || move == OrbMove.DownPortal;
    }
    isValid() {
        for (var i = 0; i < this.orbs.length; i++) {
            let b1 = this.orbs[i];
            let tile = this.getTile(b1.x, b1.y);
            if (!this.isTilePassable(tile)) {
                if (tile == Tile.Pit && b1.in_pit) {
                    //that's fine
                }
                else {
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
    getMoves() {
        let moves = [OrbMove.Up, OrbMove.Down, OrbMove.Left, OrbMove.Right];
        if (this.use_crystals) {
            moves.push(OrbMove.Shatter);
        }
        return moves;
    }
    getReverseMoves() {
        let moves = [OrbMove.Up, OrbMove.Down, OrbMove.Left, OrbMove.Right];
        if (this.no_basic) {
            moves = [];
        }
        if (this.use_crystals) {
            moves.push(OrbMove.Shatter);
        }
        if (this.use_portals && !this.hasPortals() && this.randInt(0, 3) == 0) {
            moves.push(OrbMove.UpPortal);
            moves.push(OrbMove.RightPortal);
            moves.push(OrbMove.LeftPortal);
            moves.push(OrbMove.DownPortal);
        }
        if (this.use_pits) {
            moves.push(OrbMove.RightPit);
            moves.push(OrbMove.LeftPit);
            moves.push(OrbMove.UpPit);
            moves.push(OrbMove.DownPit);
        }
        if (this.use_bombs) {
            moves.push(OrbMove.RightBomb);
            moves.push(OrbMove.LeftBomb);
            moves.push(OrbMove.UpBomb);
            moves.push(OrbMove.DownBomb);
        }
        return moves;
    }
    getVec(move) {
        switch (move) {
            case OrbMove.Right:
                return [1, 0];
            case OrbMove.RightPortal:
                return [1, 0];
            case OrbMove.RightPit:
                return [1, 0];
            case OrbMove.RightBomb:
                return [1, 0];
            case OrbMove.Left:
                return [-1, 0];
            case OrbMove.LeftPortal:
                return [-1, 0];
            case OrbMove.LeftPit:
                return [-1, 0];
            case OrbMove.LeftBomb:
                return [-1, 0];
            case OrbMove.Up:
                return [0, -1];
            case OrbMove.UpPortal:
                return [0, -1];
            case OrbMove.UpPit:
                return [0, -1];
            case OrbMove.UpBomb:
                return [0, -1];
            case OrbMove.Down:
                return [0, 1];
            case OrbMove.DownPortal:
                return [0, 1];
            case OrbMove.DownPit:
                return [0, 1];
            case OrbMove.DownBomb:
                return [0, 1];
            default:
                throw "Cannot calculate vector";
        }
    }
    isSolved() {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.getTile(x, y) == Tile.Target) {
                    if (!this.orbs.some(b => b.x == x && b.y == y)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    isFailed() {
        // If there are more targets than unfrozen orbs, the puzzles is a failure
        let orbs = this.orbs.filter(b => !b.is_frozen()).length;
        let targets = this.grid.reduce((acc, line) => acc + line.filter(t => t == Tile.Target).length, 0);
        if (orbs < targets) {
            return true;
        }
        return false;
    }
    getHeuristic() {
        let v = 0;
        if (this.isFailed()) {
            return Number.POSITIVE_INFINITY;
        }
        for (let o of this.orbs.filter(o => !o.is_frozen())) {
            let shortestDistance = Number.POSITIVE_INFINITY;
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    if (this.getTile(x, y) == Tile.Target) {
                        let dx = x - o.x;
                        let dy = y - o.y;
                        let dist = Math.abs(dx) + Math.abs(dy);
                        if (dist < shortestDistance) {
                            shortestDistance = dist;
                        }
                    }
                }
            }
            v = Math.max(shortestDistance, v);
        }
        return v / this.width / this.height * 50;
    }
    static getNumberOfMovesForHint(minMoves) {
        if (minMoves < 3)
            return 1;
        return 2;
    }
    static getHintCoords(solution) {
        var result = [];
        var steps_to_show = OrbPuzzle.getNumberOfMovesForHint(solution.length) + 1;
        var stack = solution.slice(-steps_to_show);
        solution.forEach(s => console.log(s.toString()));
        for (var step of stack) {
            for (var i = 0; i < step.orbs.length; i++) {
                var orb = step.orbs[i];
                if (!result[i])
                    result[i] = [];
                var movements = [];
                orb.last_moves.forEach(move => {
                    var movement = {
                        x: move.to.x,
                        y: move.to.y,
                        visible: !orb.exploded,
                        instant: move.instant,
                    };
                    if (orb.last_moves.length == 0) {
                        movements.push({ x: orb.x, y: orb.y, visible: !orb.exploded });
                    }
                    movements.push(movement);
                });
                result[i].push(movements);
            }
        }
        return result;
    }
}
exports.OrbPuzzle = OrbPuzzle;
//# sourceMappingURL=orbPuzzle.js.map