"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var PuzzleState = /** @class */ (function () {
    function PuzzleState() {
    }
    PuzzleState.prototype.getStack = function (depth, debug) {
        if (debug === void 0) { debug = false; }
        var bad_states = [];
        var bad_count = 0;
        var itr_count = 0;
        var stack = [this];
        while (stack.length < depth) {
            itr_count++;
            if (itr_count > 1000) {
                throw "Too many iterations";
            }
            var p = stack[stack.length - 1];
            var nexts = [];
            for (var _i = 0, _a = p.getMoves(); _i < _a.length; _i++) {
                var move = _a[_i];
                try {
                    var next = p.reverse(move);
                    if (!next.isValid()) {
                        throw "Invalid state";
                    }
                    nexts.push(next);
                }
                catch (e) {
                    if (debug)
                        console.error(e);
                }
            }
            if (nexts.length == 0) {
                bad_count++;
                if (bad_count > 30) {
                    throw "Maximum bad states exceeded";
                }
                if (bad_states.indexOf(p.hashString()) === -1) {
                    stack.pop();
                    bad_states.push(p.hashString());
                    if (stack.length == 0) {
                        throw "Bad Solution";
                    }
                }
                else {
                    stack = [this];
                    if (bad_states.indexOf(this.hashString()) !== -1) {
                        throw "Bad Solution";
                    }
                }
            }
            else {
                var next = _.sample(nexts);
                if (!next) {
                    throw "No valid options";
                }
                stack.push(next);
            }
        }
        return stack.reverse();
    };
    return PuzzleState;
}());
exports.PuzzleState = PuzzleState;
/*******************************************/
var Tile;
(function (Tile) {
    Tile["Empty"] = " ";
    Tile["Fragile"] = "\u25A1";
    Tile["Brick"] = "\u25A0";
    Tile["Crystal"] = "\u25C7";
    Tile["Portal"] = "\u2117";
    Tile["Pit"] = "\u25BC";
    Tile["Target"] = "\u25CE";
})(Tile = exports.Tile || (exports.Tile = {}));
var Boulder = /** @class */ (function () {
    function Boulder(x, y) {
        this.x = x;
        this.y = y;
    }
    return Boulder;
}());
exports.Boulder = Boulder;
var BoulderPuzzle = /** @class */ (function (_super) {
    __extends(BoulderPuzzle, _super);
    function BoulderPuzzle(ops) {
        var _this = _super.call(this) || this;
        _this.criticalTiles = [];
        _this.use_crystals = false;
        _this.use_pits = false;
        _this.use_portals = false;
        _this.width = ops.width;
        _this.height = ops.height;
        _this.use_pits = ops.use_pits || false;
        _this.use_portals = ops.use_portals || false;
        _this.use_crystals = ops.use_crystals || false;
        _this.grid = [];
        _this.boulders = [];
        for (var y = 0; y < _this.height; y++) {
            for (var x = 0; x < _this.width; x++) {
                if (!_this.grid[x]) {
                    _this.grid[x] = [];
                }
                _this.grid[x].push(Tile.Empty);
            }
        }
        for (var i = 0; i < _this.width * _this.height / 30; i++) {
            var x = randInt(0, _this.width);
            var y = randInt(0, _this.height);
            _this.grid[x][y] = Tile.Fragile;
        }
        for (var i = 0; i < _this.width * _this.height / 20; i++) {
            var x = randInt(0, _this.width);
            var y = randInt(0, _this.height);
            _this.grid[x][y] = Tile.Brick;
        }
        for (var i = 0; i < ops.boulders; i++) {
            var x = randInt(0, _this.width);
            var y = randInt(0, _this.height);
            _this.grid[x][y] = Tile.Target;
            _this.boulders.push(new Boulder(x, y));
        }
        return _this;
    }
    BoulderPuzzle.prototype.bouldersInVecOrder = function (vec) {
        return this.boulders.sort(function (a, b) {
            var aVal = a.x * vec[0] + a.y * vec[1];
            var bVal = b.x * vec[0] + b.y * vec[1];
            if (aVal < bVal) {
                return 1;
            }
            else {
                return -1;
            }
        });
    };
    BoulderPuzzle.prototype.toString = function () {
        var result = "";
        var _loop_1 = function (y) {
            var _loop_2 = function (x) {
                if (this_1.grid[x][y] == Tile.Target) {
                    result += this_1.boulders.some(function (b) { return b.x == x && b.y == y; }) ? "✓" : this_1.grid[x][y];
                }
                else if (this_1.grid[x][y] == Tile.Empty) {
                    //result += this.boulders.some((b)=>b.x==x && b.y==y) ? "o" : (this.criticalTiles.some((t)=>t.x==x && t.y==y) ? this.grid[x][y] : ' ');
                    result += this_1.boulders.some(function (b) { return b.x == x && b.y == y; }) ? "o" : this_1.grid[x][y];
                }
                else {
                    result += this_1.boulders.some(function (b) { return b.x == x && b.y == y; }) ? "o" : this_1.grid[x][y];
                }
            };
            for (var x = 0; x < this_1.width; x++) {
                _loop_2(x);
            }
            result += "\n";
        };
        var this_1 = this;
        for (var y = 0; y < this.height; y++) {
            _loop_1(y);
        }
        return result;
    };
    BoulderPuzzle.prototype.hashString = function () {
        return this.toString();
    };
    BoulderPuzzle.prototype.apply = function (move) {
        var result = _.cloneDeep(this);
        return this;
    };
    BoulderPuzzle.prototype.isTilePassable = function (tile) {
        return tile == Tile.Empty || tile == Tile.Target;
    };
    BoulderPuzzle.prototype.isPassable = function (x, y) {
        if (!this.isTilePassable(this.getTile(x, y))) {
            return false;
        }
        for (var _i = 0, _a = this.boulders; _i < _a.length; _i++) {
            var b = _a[_i];
            if (b.x == x && b.y == y) {
                return false;
            }
        }
        return true;
    };
    BoulderPuzzle.prototype.getTile = function (x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return undefined;
        }
        return this.grid[x][y];
    };
    BoulderPuzzle.prototype.reverseShatter = function () {
        if (this.criticalTiles.length < 8) {
            throw "Not enough critical tiles for shatter";
        }
        if (this.grid.some(function (line) { return line.some(function (tile) { return tile == Tile.Crystal; }); })) {
            throw "Crystals already present";
        }
        for (var i = 0; i < randInt(1, 4); i++) {
            var coord = _.sample(this.criticalTiles);
            if (coord) {
                if (this.getTile(coord.x, coord.y) == Tile.Empty) {
                    this.grid[coord.x][coord.y] = Tile.Crystal;
                }
            }
        }
        for (var i = 0; i < Math.min(this.height, this.width); i++) {
            var x = randInt(0, this.width);
            var y = randInt(0, this.height);
            if (this.getTile(x, y) == Tile.Empty) {
                this.grid[x][y] = Tile.Crystal;
            }
        }
        return this;
    };
    BoulderPuzzle.prototype.reverse = function (move) {
        var state = _.cloneDeep(this);
        if (move == BoulderMove.Shatter) {
            return state.reverseShatter();
        }
        var vec = this.getVec(move);
        vec[0] = -vec[0];
        vec[1] = -vec[1];
        var haveMoved = [];
        if (state.isPitMove(move)) {
            var possibleCoords = [];
            var _loop_3 = function (coord) {
                if (state.getTile(coord.x, coord.y) == Tile.Empty && state.isPassable(coord.x + vec[0], coord.y + vec[1])) {
                    if (state.boulders.some(function (b) { return b.x == coord.x && b.y == coord.y; })) {
                        return "continue";
                    }
                    possibleCoords.push(coord);
                }
            };
            for (var _i = 0, _a = this.criticalTiles; _i < _a.length; _i++) {
                var coord = _a[_i];
                _loop_3(coord);
            }
            var pit = _.sample(possibleCoords);
            if (!pit) {
                throw "No pit locations";
            }
            state.grid[pit.x][pit.y] = Tile.Pit;
            var b = new Boulder(pit.x, pit.y);
            state.boulders.push(b);
        }
        for (var _b = 0, _c = state.bouldersInVecOrder(vec); _b < _c.length; _b++) {
            var b = _c[_b];
            var ox = b.x;
            var oy = b.y;
            var mags = [];
            for (var mag_1 = 1; mag_1 < this.height; mag_1++) {
                if (state.isPassable(ox + vec[0] * mag_1, oy + vec[1] * mag_1)) {
                    mags.push(mag_1);
                }
                else {
                    break;
                }
            }
            if (!state.isPassable(ox - vec[0], oy - vec[1])) {
                mags.push(0);
            }
            var mag = _.sample(mags);
            if (mag === undefined) {
                throw "No options";
            }
            if (mag != 0) {
                haveMoved.push(b);
            }
            b.x += vec[0] * mag;
            b.y += vec[1] * mag;
            //Add path to Critical Path
            for (var i = 1; i <= mag; i++) {
                var criticalTile = { x: b.x - vec[0] * i, y: b.y - vec[1] * i };
                state.criticalTiles.push(criticalTile);
            }
            if (state.isPassable(ox - vec[0], oy - vec[1]) && state.getTile(ox, oy) != Tile.Pit) {
                if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Empty) {
                    state.grid[ox - vec[0]][oy - vec[1]] = Tile.Fragile;
                }
                else if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Target) {
                    throw "Would need to put fragile block on target";
                }
            }
            else if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Pit) {
                throw "Would need to put fragile block where a pit ia pit is";
            }
            else if (state.getTile(ox - vec[0], oy - vec[1]) == Tile.Fragile) {
                throw "Would need to put fragile block where there will already be one";
            }
        }
        if (state.isPortalMove(move)) {
            if (this.hasPortals()) {
                throw "Already has a portal pair";
            }
            var b = _.sample(haveMoved);
            if (b) {
                state.grid[b.x][b.y] = Tile.Portal;
                var possibleCoords = [];
                for (var x = 0; x < this.width; x++) {
                    for (var y = 0; y < this.height; y++) {
                        if (state.getTile(x, y) == Tile.Empty && state.isPassable(x + vec[0], y + vec[1])) {
                            possibleCoords.push({ x: x, y: y });
                        }
                    }
                }
                var portal = _.sample(possibleCoords);
                if (!portal) {
                    throw "No portal locations possible";
                }
                state.grid[portal.x][portal.y] = Tile.Portal;
                b.x = portal.x;
                b.y = portal.y;
                var mags = [];
                for (var mag_2 = 1; mag_2 < this.height; mag_2++) {
                    if (state.isPassable(b.x + vec[0] * mag_2, b.y + vec[1] * mag_2)) {
                        mags.push(mag_2);
                    }
                    else {
                        break;
                    }
                }
                var mag = _.sample(mags);
                if (!mag) {
                    throw "No where to enter portal from (Shouldn't happen)";
                }
                b.x += vec[0] * mag;
                b.y += vec[1] * mag;
            }
        }
        return state;
    };
    BoulderPuzzle.prototype.hasPortals = function () {
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.getTile(x, y) == Tile.Portal) {
                    return true;
                }
            }
        }
        return false;
    };
    BoulderPuzzle.prototype.isPitMove = function (move) {
        return move == BoulderMove.UpPit || move == BoulderMove.RightPit || move == BoulderMove.LeftPit || move == BoulderMove.DownPit;
    };
    BoulderPuzzle.prototype.isPortalMove = function (move) {
        return move == BoulderMove.UpPortal || move == BoulderMove.RightPortal || move == BoulderMove.LeftPortal || move == BoulderMove.DownPortal;
    };
    BoulderPuzzle.prototype.isValid = function () {
        for (var i = 0; i < this.boulders.length - 1; i++) {
            var b1 = this.boulders[i];
            var tile = this.getTile(b1.x, b1.y);
            if (!this.isTilePassable(tile)) {
                return false;
            }
            for (var j = i + 1; j <= this.boulders.length - 1; j++) {
                var b2 = this.boulders[j];
                if (b1.x == b2.x && b1.y == b2.y) {
                    return false;
                }
            }
        }
        return true;
    };
    BoulderPuzzle.prototype.getMoves = function () {
        var moves = [BoulderMove.Up, BoulderMove.Down, BoulderMove.Left, BoulderMove.Right];
        if (this.use_crystals) {
            moves.push(BoulderMove.Shatter);
        }
        if (this.use_portals && !this.hasPortals() && randInt(0, 3) == 0) {
            moves.push(BoulderMove.UpPortal);
            moves.push(BoulderMove.RightPortal);
            moves.push(BoulderMove.LeftPortal);
            moves.push(BoulderMove.DownPortal);
        }
        if (this.use_pits && randInt(0, 2) == 0) {
            moves.push(BoulderMove.RightPit);
            moves.push(BoulderMove.LeftPit);
            moves.push(BoulderMove.UpPit);
            moves.push(BoulderMove.DownPit);
        }
        return moves;
    };
    BoulderPuzzle.prototype.getVec = function (move) {
        switch (move) {
            case BoulderMove.Right:
                return [1, 0];
            case BoulderMove.RightPortal:
                return [1, 0];
            case BoulderMove.RightPit:
                return [1, 0];
            case BoulderMove.Left:
                return [-1, 0];
            case BoulderMove.LeftPortal:
                return [-1, 0];
            case BoulderMove.LeftPit:
                return [-1, 0];
            case BoulderMove.Up:
                return [0, -1];
            case BoulderMove.UpPortal:
                return [0, -1];
            case BoulderMove.UpPit:
                return [0, -1];
            case BoulderMove.Down:
                return [0, 1];
            case BoulderMove.DownPortal:
                return [0, 1];
            case BoulderMove.DownPit:
                return [0, 1];
            default:
                throw "Error";
        }
    };
    return BoulderPuzzle;
}(PuzzleState));
exports.BoulderPuzzle = BoulderPuzzle;
var BoulderMove;
(function (BoulderMove) {
    BoulderMove["Up"] = "Up";
    BoulderMove["UpPortal"] = "Up, using portal";
    BoulderMove["UpPit"] = "Up, into pit";
    BoulderMove["Down"] = "Down";
    BoulderMove["DownPortal"] = "Down, using portal";
    BoulderMove["DownPit"] = "Down, into pit";
    BoulderMove["Left"] = "Left";
    BoulderMove["LeftPortal"] = "Left, using portal";
    BoulderMove["LeftPit"] = "Left, into pit";
    BoulderMove["Right"] = "Right";
    BoulderMove["RightPortal"] = "Right, using portal";
    BoulderMove["RightPit"] = "Right, into pit";
    BoulderMove["Shatter"] = "Shatter";
})(BoulderMove = exports.BoulderMove || (exports.BoulderMove = {}));
function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
