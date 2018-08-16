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
const lodash_1 = __importDefault(require("lodash"));
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
class PuzzleState {
    solve() {
        return __awaiter(this, void 0, void 0, function* () {
            let closedList = {};
            let openList = {};
            openList[this.hashString()] = { state: this, totalcost: 0, bestedge: null, estimatedcost: this.getHeuristic() };
            while (Object.keys(openList).length > 0) {
                if (Math.random() < 0.01) {
                    console.log("YIELD");
                    yield sleep(0);
                }
                ;
                let current = Object.keys(openList).map(hash => openList[hash]).reduce(function (prev, current) {
                    return (prev.estimatedcost < current.estimatedcost) ? prev : current;
                });
                console.log(current.state.toString());
                console.log(current.totalcost, current.estimatedcost, Object.keys(closedList).length, Object.keys(openList).length);
                if (current.state.isSolved()) {
                    console.log("Solved!");
                    let moves = [];
                    let states = [];
                    while (true) {
                        let e = current.bestedge;
                        if (!e || e.to.hashString() === this.hashString()) {
                            return [states.reverse(), moves.reverse()];
                        }
                        moves.push(e.move);
                        states.push(e.from.state);
                        current = e.from;
                    }
                }
                let edges = current.state.getMoves().map(m => {
                    return {
                        from: current,
                        to: current.state.apply(m),
                        move: m,
                        cost: 1
                    };
                });
                for (let e of edges) {
                    let ehash = e.to.hashString();
                    if (openList[ehash]) {
                        if (openList[ehash].totalcost <= current.totalcost + e.cost) {
                            continue;
                        }
                    }
                    else if (closedList[ehash]) {
                        if (closedList[ehash].totalcost <= current.totalcost + e.cost) {
                            continue;
                        }
                        openList[ehash] = closedList[ehash];
                        delete closedList[ehash];
                    }
                    else {
                        let entry = {
                            state: e.to,
                            totalcost: current.totalcost + e.cost,
                            estimatedcost: current.totalcost + e.cost + e.to.getHeuristic(),
                            bestedge: null
                        };
                        openList[ehash] = entry;
                    }
                    openList[ehash].totalcost = current.totalcost + e.cost;
                    openList[ehash].bestedge = e;
                }
                let hash = current.state.hashString();
                closedList[hash] = openList[hash];
                delete openList[hash];
            }
            return null;
        });
    }
    recsolve(maxDepth = 5, curDepth = 1, solutionMap) {
        return __awaiter(this, void 0, void 0, function* () {
            if (curDepth == 1) {
                console.log("start solve");
            }
            console.log(curDepth + "/" + maxDepth);
            try {
                if (Math.random() < 0.002) {
                    console.log("YIELD");
                    yield sleep(0);
                }
                if (!solutionMap) {
                    solutionMap = {};
                }
                if (this.isSolved()) {
                    return [[this], []];
                }
                if (this.isFailed()) {
                    return null;
                }
                if (solutionMap[this.hashString()] !== undefined) {
                    let entry = solutionMap[this.hashString()];
                    if (entry[0] >= (maxDepth - curDepth)) {
                        return entry[1];
                    }
                }
                if (curDepth >= maxDepth) {
                    solutionMap[this.hashString()] = [maxDepth - curDepth, null];
                    return null;
                }
                let shortestSolution = undefined;
                let bestMove;
                let nexts = this.getMoves().map(m => {
                    return {
                        "move": m,
                        "state": this.apply(m),
                        "value": 0 //placeholder
                    };
                });
                nexts = nexts.map(n => {
                    return {
                        "move": n.move,
                        "state": n.state,
                        "value": n.state.getHeuristic()
                    };
                });
                nexts = nexts.sort((a, b) => {
                    return a.value - b.value;
                });
                for (let n of nexts) {
                    console.log(curDepth, "~", n.value);
                    let s = n.state;
                    if (s.hashString() === this.hashString()) {
                        continue;
                    }
                    let ss = yield s.recsolve(maxDepth, curDepth + 1, solutionMap);
                    if (ss) {
                        if (shortestSolution === undefined || ss[0].length < shortestSolution[0].length) {
                            shortestSolution = ss;
                            bestMove = n.move;
                            console.log("Depth", maxDepth, "->", (curDepth + shortestSolution.length));
                            maxDepth = curDepth + shortestSolution.length;
                        }
                    }
                }
                if (shortestSolution) {
                    if (!bestMove) {
                        throw "Assert there has been a move";
                    }
                    let arr = [this];
                    let marr = [bestMove];
                    arr = arr.concat(shortestSolution[0]);
                    marr = marr.concat(shortestSolution[1]);
                    solutionMap[this.hashString()] = [maxDepth - curDepth, [arr, marr]];
                    return [arr, marr];
                }
                else {
                    solutionMap[this.hashString()] = [maxDepth - curDepth, null];
                    return null;
                }
            }
            finally {
                if (curDepth == 1) {
                    console.log("end solve");
                }
            }
        });
    }
    getStack(depth, debug = false) {
        console.log("start stack");
        try {
            let bad_states = [];
            let bad_count = 0;
            let itr_count = 0;
            let stack = [this];
            let moves = [];
            while (stack.length < depth) {
                itr_count++;
                if (itr_count > 2000) {
                    throw "Too many iterations";
                }
                let p = stack[stack.length - 1];
                let nexts = [];
                for (let move of p.getReverseMoves()) {
                    try {
                        let next = p.reverse(move);
                        if (!next.isValid()) {
                            throw "Invalid state";
                        }
                        if (nexts.some(m => m[0].hashString() == next.hashString())) {
                            console.error("Pointless move");
                            throw "Pointless Move";
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
                            };
                        }
                        nexts.push([next, move]);
                    }
                    catch (e) {
                        if (debug) {
                            console.error(e);
                        }
                        if (e.name == "FatalError") {
                            console.error(e);
                            throw e;
                        }
                    }
                }
                if (nexts.length == 0) {
                    bad_count++;
                    if (bad_count > 1000) {
                        throw "Maximum bad states exceeded";
                    }
                    if (bad_states.indexOf(p.hashString()) === -1) {
                        bad_states.push(p.hashString());
                    }
                    let to_remove = randInt(1, stack.length - 1);
                    for (var i = 0; i < to_remove; i++) {
                        stack.pop();
                        moves.pop();
                    }
                    if (bad_states.indexOf(this.hashString()) !== -1) {
                        throw "Bad Solution State";
                    }
                }
                else {
                    let next = lodash_1.default.sample(nexts);
                    if (!next) {
                        throw "No valid options";
                    }
                    stack.push(next[0]);
                    moves.push(next[1]);
                }
            }
            return [stack.reverse(), moves.reverse()];
        }
        finally {
            console.log("end stack");
        }
    }
}
exports.default = PuzzleState;
//# sourceMappingURL=puzzleState.js.map