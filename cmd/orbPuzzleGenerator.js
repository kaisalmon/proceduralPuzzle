"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const orbPuzzle_1 = require("./orbPuzzle");
const jquery_1 = __importDefault(require("jquery"));
function load_level(fn) {
    return __awaiter(this, void 0, void 0, function* () {
        let json = yield jquery_1.default.getJSON("levels/" + fn);
        let level = yield from_json(json, false);
        return level;
    });
}
exports.load_level = load_level;
function from_json(json, solve = true, maxDepth) {
    return __awaiter(this, void 0, void 0, function* () {
        let o = new orbPuzzle_1.OrbPuzzle(json.width, json.height);
        for (var i = 0; i < json.grid.length; i++) {
            for (var j = 0; j < json.grid[0].length; j++) {
                o.grid[i][j] = json.grid[i][j];
            }
        }
        for (let orb of json.orbs) {
            o.orbs.push(new orbPuzzle_1.Orb(orb.x, orb.y));
        }
        if (solve) {
            let s = yield o.solve(maxDepth);
            if (s === null) {
                throw "Unsolvable";
            }
            return [s[0], s[1]];
        }
        else {
            return [[o], []];
        }
    });
}
exports.from_json = from_json;
function createOrbPuzzle(args) {
    return __awaiter(this, void 0, void 0, function* () {
        let p = new orbPuzzle_1.OrbPuzzle(args.size, args.size, args.seed);
        for (let i = 0; i < p.width * p.height / 100 * args.fragile_brick_density; i++) {
            let x = p.randInt(0, p.width);
            let y = p.randInt(0, p.height);
            p.grid[x][y] = orbPuzzle_1.Tile.Fragile;
        }
        for (let i = 0; i < p.width * p.height / 100 * args.brick_density; i++) {
            let x = p.randInt(0, p.width);
            let y = p.randInt(0, p.height);
            p.grid[x][y] = orbPuzzle_1.Tile.Brick;
        }
        if (args.decoy_pits) {
            for (let i = 0; i < p.width * p.height / 100 * args.pit_density; i++) {
                let x = p.randInt(0, p.width);
                let y = p.randInt(0, p.height);
                p.grid[x][y] = orbPuzzle_1.Tile.Pit;
            }
        }
        let bomb_density = 3;
        if (args.decoy_bombs) {
            for (let i = 0; i < p.width * p.height / 100 * bomb_density; i++) {
                let x = p.randInt(0, p.width);
                let y = p.randInt(0, p.height);
                p.grid[x][y] = orbPuzzle_1.Tile.Bomb;
            }
        }
        if (args.decoy_portals) {
            for (let i = 0; i < 2; i++) {
                let x = p.randInt(0, p.width);
                let y = p.randInt(0, p.height);
                p.grid[x][y] = orbPuzzle_1.Tile.Portal;
            }
        }
        if (args.decoy_orbs) {
            let x = p.randInt(0, p.width);
            let y = p.randInt(0, p.height);
            p.grid[x][y] = orbPuzzle_1.Tile.Empty;
            p.orbs.push(new orbPuzzle_1.Orb(x, y));
        }
        for (let i = 0; i < args.orbs; i++) {
            let x = p.randInt(0, p.width);
            let y = p.randInt(0, p.height);
            p.grid[x][y] = orbPuzzle_1.Tile.Target;
            p.orbs.push(new orbPuzzle_1.Orb(x, y));
        }
        p.use_fragile = args.fragile;
        p.use_crystals = args.crystal;
        p.use_pits = args.pits;
        p.use_bombs = args.bombs;
        p.use_portals = args.portals;
        let stack = p.getStack(args.depth);
        //var t0 = performance.now();
        let solutionResult = yield stack[0][0].solve(args.depth);
        //var t1 = performance.now();
        //alert("Call to solve took " + (t1 - t0)/1000 + "seconds.")
        if (!solutionResult) {
            throw "Couldn't solve";
        }
        let fastestSolvedState = solutionResult[0].pop();
        if (fastestSolvedState) {
            if (!args.decoy_bombs) {
                if (fastestSolvedState.grid.some(line => line.some(tile => tile == orbPuzzle_1.Tile.Bomb))) {
                    throw "Unused Bombs";
                }
            }
        }
        let solution;
        solution = solutionResult[1];
        if (!solution || solution.length < args.mindepth - 1) {
            console.error("too short", solution.length, args.mindepth);
            throw "too short ";
        }
        let board = stack[0][0];
        if (args.crystal && !board.grid.some(line => line.some(tile => tile == orbPuzzle_1.Tile.Crystal))) {
            throw "No crystals";
        }
        if (args.depth > 2) {
            if (args.pits && !board.grid.some(line => line.some(tile => tile == orbPuzzle_1.Tile.Pit))) {
                throw "No Pits";
            }
            if (p.use_bombs && !board.grid.some(line => line.some(tile => tile == orbPuzzle_1.Tile.Bomb))) {
                throw "No Bombs";
            }
            if ((p.use_portals || args.decoy_portals) && !board.grid.some(line => line.some(tile => tile == orbPuzzle_1.Tile.Portal))) {
                throw "No Portals";
            }
            if (p.use_portals && fastestSolvedState.grid.some(line => line.some(tile => tile == orbPuzzle_1.Tile.Portal))) {
                throw "Unused Portals after fasted solution";
            }
            if (args.pits && !stack[1].some((m => [orbPuzzle_1.OrbMove.DownPit, orbPuzzle_1.OrbMove.UpPit, orbPuzzle_1.OrbMove.LeftPit, orbPuzzle_1.OrbMove.RightPit].indexOf(m) !== -1))) {
                throw "No Pit USED in solution";
            }
            if (p.use_bombs && !stack[1].some((m => [orbPuzzle_1.OrbMove.DownBomb, orbPuzzle_1.OrbMove.UpBomb, orbPuzzle_1.OrbMove.LeftBomb, orbPuzzle_1.OrbMove.RightBomb].indexOf(m) !== -1))) {
                throw "No Bombs";
            }
        }
        console.log(">>>", stack[0][0]);
        console.log("successful seed", p.seed);
        return [stack[0], solution];
    });
}
exports.createOrbPuzzle = createOrbPuzzle;
//# sourceMappingURL=orbPuzzleGenerator.js.map