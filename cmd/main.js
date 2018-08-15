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
const jquery_1 = __importDefault(require("jquery"));
const hammerjs_1 = __importDefault(require("hammerjs"));
const sweetalert2_1 = __importDefault(require("sweetalert2"));
const orbPuzzle_1 = require("./orbPuzzle");
const explosion_1 = require("./explosion");
const orbPuzzleGenerator_1 = require("./orbPuzzleGenerator");
function tryUntilSuccess(f, args, debug = false) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let i = 0;
            var t0 = performance.now();
            function _attempt() {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        let result = yield f(args);
                        resolve(result);
                        if (debug) {
                            var t1 = performance.now();
                            sweetalert2_1.default("Generation took " + (t1 - t0) / 1000 + " seconds.");
                        }
                    }
                    catch (e) {
                        if (debug)
                            console.error(e);
                        for (var j = 0; j < 10; j++) {
                            i++;
                            if (i % 100 == 0) {
                                console.warn("Over " + i + " attempts..");
                            }
                            if (i > 5000) {
                                reject();
                                return;
                            }
                        }
                        setTimeout(_attempt);
                    }
                });
            }
            _attempt();
        });
    });
}
/*
let stack:OrbPuzzle[] = []
let p =new OrbPuzzle(10,10)
p.grid[4][3] = Tile.Pit;
p.orbs.push(new Orb(4,4))
stack.push(p)
p = p.reverse(OrbMove.Up)
stack.push(p)
stack = stack.reverse();
*/
let board;
let moving = false;
let $tiles;
jquery_1.default(document).ready(() => {
    explosion_1.setUpExplosions();
    (function () {
        return __awaiter(this, void 0, void 0, function* () {
            let params = getUrlVars();
            let size = parseInt(params['size']) || 10;
            let orbs = parseInt(params['orbs']) || 2;
            let brick_density = params['brick_density'] === undefined ? 5 : parseInt(params['brick_density']);
            let pit_density = params['pit_density'] === undefined ? 5 : parseInt(params['pit_density']);
            let fragile_brick_density = params['fragile_brick_density'] === undefined ? 5 : parseInt(params['fragile_brick_density']);
            let depth = parseInt(params['depth']) || 4;
            let mindepth = parseInt(params['mindepth']) || depth;
            let fragile = params['fragile'] == "true";
            let crystal = params['crystal'] == "true";
            let pits = params['pits'] == "true";
            let bombs = params['bombs'] == "true";
            let decoy_pits = params['decoy_pits'] == "true";
            let decoy_orbs = params['decoy_orbs'] == "true";
            let decoy_bombs = params['decoy_bombs'] == "true";
            let stack = undefined;
            sweetalert2_1.default({
                title: 'Generating Level',
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
                onOpen: () => __awaiter(this, void 0, void 0, function* () {
                    sweetalert2_1.default.showLoading();
                })
            });
            try {
                let args = { size, orbs, depth, mindepth, fragile, crystal, pits, bombs, decoy_pits, brick_density, fragile_brick_density, pit_density, decoy_orbs, decoy_bombs };
                stack = yield tryUntilSuccess(orbPuzzleGenerator_1.createOrbPuzzle, args, false);
                sweetalert2_1.default.close();
            }
            catch (e) {
                sweetalert2_1.default({
                    title: "Couldn't generate level!",
                    text: "feel free to try a few more times",
                    type: "error",
                    showCancelButton: true,
                    cancelButtonText: "Back to settings",
                    confirmButtonText: "New Puzzle",
                    useRejections: true,
                }).then(() => {
                    window.location.reload();
                }).catch(() => {
                    window.location.href = window.location.href.replace("game", "index");
                });
                return;
            }
            board = stack[0][0];
            let solution = stack[1];
            jquery_1.default('.hint').click(() => {
                sweetalert2_1.default(solution.join("\n"));
            });
            jquery_1.default('.back').click(() => {
                window.location.href = window.location.href.replace("game", "index");
            });
            let orig = board;
            jquery_1.default('.reset').click(() => {
                sweetalert2_1.default({
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
            $tiles = create_board(board);
            jquery_1.default('body').keyup((e) => {
                let move = undefined;
                switch (e.which) {
                    case 37:
                        move = orbPuzzle_1.OrbMove.Left;
                        break;
                    case 38:
                        move = orbPuzzle_1.OrbMove.Up;
                        break;
                    case 39:
                        move = orbPuzzle_1.OrbMove.Right;
                        break;
                    case 40:
                        move = orbPuzzle_1.OrbMove.Down;
                        break;
                }
                apply_move(move);
            });
            function getUrlVars() {
                var vars = {};
                window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function ({}, key, value) {
                    vars[key] = value;
                    return "";
                });
                return vars;
            }
        });
    })();
});
function apply_move(move) {
    if (move && !moving && board) {
        moving = true;
        board = board.apply(move);
        jquery_1.default('.puzzle-wrapper .orb').each((i, e) => {
            let b = board.orbs[i];
            if (b && !jquery_1.default(e).hasClass('orb--in-pit')) {
                let s = 0.1 * (b.last_mag || 0);
                let base_transition = "background 0.5s, border 0.5s, filter 0.5s";
                jquery_1.default(e).css('transition', 'transform ' + s + 's ease-in, ' + base_transition);
                jquery_1.default(e).css('transform', 'translate(calc(var(--tsize) * ' + b.x + '), calc(var(--tsize) * ' + b.y + '))');
                if (b.last_move && (b.last_move[0] != 0 || b.last_move[1] != 0)) {
                    jquery_1.default(e).removeClass('orb--on-target');
                }
                setTimeout(() => {
                    if (board.getTile(b.x, b.y) == orbPuzzle_1.Tile.Target) {
                        jquery_1.default(e).addClass('orb--on-target');
                    }
                    if (b.in_pit) {
                        setTimeout(() => {
                            jquery_1.default(e).addClass('orb--in-pit');
                            jquery_1.default(e).removeClass('orb--on-target');
                            jquery_1.default(e).css('transform', 'translate(calc(var(--tsize) * ' + b.x + '), calc(var(--tsize) * ' + b.y + ')) scale(0.7)');
                        }, 100);
                    }
                    else {
                        jquery_1.default(e).removeClass('orb--in-pit');
                    }
                    if (b.last_contact) {
                        let t = board.getTile(b.last_contact.x, b.last_contact.y);
                        let $t = $tiles[b.last_contact.x][b.last_contact.y];
                        if ($t) {
                            if ($t.hasClass('tile--fragile') && t == orbPuzzle_1.Tile.Empty) {
                                $t.addClass('animated');
                                if (b.last_contact.x > b.x)
                                    $t.addClass('fadeOutRight');
                                else if (b.last_contact.x < b.x)
                                    $t.addClass('fadeOutLeft');
                                else if (b.last_contact.y < b.y)
                                    $t.addClass('fadeOutUp');
                                else if (b.last_contact.y > b.y)
                                    $t.addClass('fadeOutDown');
                                setTimeout(() => $t.remove, 1000);
                            }
                            else if ($t.hasClass('tile--bomb')) {
                                $t.addClass('animated');
                                $t.addClass('lit shake');
                            }
                        }
                    }
                }, s * 1000);
            }
        });
        let time = board.orbs.reduce((t, b) => Math.max(b.last_mag || 0, t), 0) * 100;
        setTimeout(() => {
            moving = false;
            for (let x = 0; x < board.width; x++) {
                for (let y = 0; y < board.height; y++) {
                    let t = board.getTile(x, y);
                    let $t = $tiles[x][y];
                    if ($t && t == orbPuzzle_1.Tile.Empty && !$t.hasClass('animated')) {
                        $t.remove();
                    }
                    if ($t && t == orbPuzzle_1.Tile.Empty && $t.hasClass('lit')) {
                        $t.addClass('fadeOut');
                        var curTransform = new WebKitCSSMatrix($t.css('transform'));
                        let offset = $t.offset();
                        if (offset) {
                            let x = offset.left + curTransform.m41;
                            let y = offset.top + curTransform.m42;
                            let h = $t.height();
                            let w = $t.width();
                            if (h)
                                y += h;
                            if (w)
                                x += w;
                            explosion_1.animateParticules(x, y);
                        }
                        setTimeout(() => $t.remove, 1000);
                        setTimeout(() => $t.removeClass("lit tile--bomb"), 1000);
                    }
                }
            }
            jquery_1.default('.puzzle-wrapper .orb').each((i, e) => {
                let b = board.orbs[i];
                if (b.exploded && !jquery_1.default(e).hasClass("fadeOut")) {
                    jquery_1.default(e).addClass("animated fadeOut");
                }
            });
            if (board.isSolved()) {
                setTimeout(() => {
                    sweetalert2_1.default({
                        title: "You win!",
                        type: "success",
                        showCancelButton: true,
                        cancelButtonText: "Back to settings",
                        confirmButtonText: "New Puzzle",
                        useRejections: true,
                    }).then(() => {
                        window.location.reload();
                    }).catch(() => {
                        window.location.href = window.location.href.replace("game", "index");
                    });
                }, 400);
            }
        }, time);
    }
}
function create_board(board) {
    jquery_1.default('.puzzle-wrapper').remove();
    let $wrapper = jquery_1.default('<div/>').addClass('puzzle-wrapper').appendTo('body');
    jquery_1.default("body").attr("style", "--tsize:calc(var(--bsize) / " + board.width + ")");
    jquery_1.default('<div/>').addClass('puzzles')
        .appendTo($wrapper);
    jquery_1.default('<div/>').addClass('upper-layer')
        .appendTo($wrapper);
    var $tiles = [];
    for (let x = 0; x < board.width; x++) {
        $tiles[x] = [];
        for (let y = 0; y < board.height; y++) {
            let t = board.getTile(x, y);
            let layer = "upper";
            if (t == orbPuzzle_1.Tile.Empty) {
                continue;
            }
            let tileName = 'brick';
            let html = '';
            if (t == orbPuzzle_1.Tile.Target) {
                tileName = 'target';
                layer = "lower";
            }
            if (t == orbPuzzle_1.Tile.Fragile) {
                tileName = 'fragile';
            }
            if (t == orbPuzzle_1.Tile.Crystal) {
                tileName = 'crystal';
            }
            if (t == orbPuzzle_1.Tile.Bomb) {
                tileName = 'bomb';
                html = '<i class="fas fa-exclamation-triangle"></i>';
            }
            if (t == orbPuzzle_1.Tile.Pit) {
                tileName = 'pit';
                layer = "lower";
            }
            let $tw = jquery_1.default('<div/>')
                .addClass('tile-wrapper')
                .appendTo(layer == "upper" ? '.upper-layer' : '.puzzles')
                .css('transform', 'translate(calc(var(--tsize) * ' + x + '), calc(var(--tsize) * ' + y + '))');
            let $t = jquery_1.default('<div/>')
                .addClass('tile')
                .addClass('tile--' + tileName)
                .appendTo($tw)
                .html(html);
            $tiles[x][y] = $t;
        }
    }
    for (let b of board.orbs) {
        let $e = jquery_1.default('<div class="orb"/>')
            .css('transform', 'translate(calc(var(--tsize) * ' + b.x + '), calc(var(--tsize) * ' + b.y + '))')
            .data('x', b.x)
            .data('y', b.y)
            .appendTo('.upper-layer');
        if (board.getTile(b.x, b.y) == orbPuzzle_1.Tile.Target) {
            $e.addClass('orb--on-target');
        }
    }
    var mc = new hammerjs_1.default($wrapper[0]);
    mc.get('swipe').set({ direction: hammerjs_1.default.DIRECTION_ALL });
    mc.on("swipeleft", function () {
        apply_move(orbPuzzle_1.OrbMove.Left);
    });
    mc.on("swiperight", function () {
        apply_move(orbPuzzle_1.OrbMove.Right);
    });
    mc.on("swipeup", function () {
        apply_move(orbPuzzle_1.OrbMove.Up);
    });
    mc.on("swipedown", function () {
        apply_move(orbPuzzle_1.OrbMove.Down);
    });
    return $tiles;
}
//# sourceMappingURL=cmd.js.map