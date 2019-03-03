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
const sound_1 = __importDefault(require("./sound"));
/*globals*/
let player_made_move = false;
let level_number = undefined;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let board;
let golden_path = null;
let moving = false;
let hint_playing = false;
let $tiles;
function runWithLoadingSwals(f, args) {
    return __awaiter(this, void 0, void 0, function* () {
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
            let stack = yield f(args);
            sweetalert2_1.default.close();
            return stack;
        }
        catch (e) {
            console.error(e);
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
                window.location.href = window.location.href.replace("game", "levelselect");
            });
            return;
        }
    });
}
function on_level_created() {
    setTimeout(() => {
        if (!player_made_move && level_number == 1) {
            jquery_1.default('.swipe-prompt-container').css('display', 'block');
            setTimeout(() => {
                jquery_1.default('.swipe-prompt-container').css('opacity', '1');
            }, 1000);
        }
    }, 2000);
}
function on_player_move() {
    if (!player_made_move) {
        player_made_move = true;
        jquery_1.default('.swipe-prompt-container').css('opacity', '');
        setTimeout(() => {
            jquery_1.default('.swipe-prompt-container').css('opacity', '');
        }, 1000);
    }
}
jquery_1.default(document).ready(() => {
    explosion_1.setUpExplosions();
    setTimeout(() => {
        jquery_1.default("#level-info").addClass("hoz-hidden");
    });
    (function () {
        return __awaiter(this, void 0, void 0, function* () {
            let params = getUrlVars();
            let stack = undefined;
            let level = params.round_id ? "challenge" : parseInt(params.level);
            if (level) {
                jquery_1.default("#level-info").text("Level " + level);
                stack = yield runWithLoadingSwals(orbPuzzleGenerator_1.createLevel, level);
                if (!stack)
                    return;
            }
            else {
                jquery_1.default("#level-info").text("Custom Level");
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
                let portals = params['portals'] == "true";
                let decoy_pits = params['decoy_pits'] == "true";
                let decoy_orbs = params['decoy_orbs'] == "true";
                let decoy_bombs = params['decoy_bombs'] == "true";
                let decoy_portals = params['decoy_portals'] == "true";
                let args = { size, orbs, depth, mindepth, fragile, crystal, pits, bombs, portals, decoy_pits, brick_density, fragile_brick_density, pit_density, decoy_orbs, decoy_bombs, decoy_portals };
                stack = yield runWithLoadingSwals(orbPuzzleGenerator_1.createOrbPuzzle, args);
                if (!stack) {
                    return;
                }
            }
            board = stack[0][0];
            golden_path = stack[0];
            jquery_1.default('.hint').click(() => {
                show_hint();
            });
            jquery_1.default('.back').click(() => {
                if (getUrlVars().round_id) {
                    window.location.href = window.location.href.replace("game", "menu");
                }
                else {
                    window.location.href = window.location.href.replace("game", "levelselect");
                }
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
                (function () {
                    return __awaiter(this, void 0, void 0, function* () {
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
                        yield apply_move(move);
                    });
                })();
            });
            on_level_created();
        });
    })();
});
function getUrlVars() {
    var vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function ({}, key, value) {
        vars[key] = value;
        return "";
    });
    return vars;
}
function show_hint() {
    return __awaiter(this, void 0, void 0, function* () {
        if (hint_playing)
            return;
        jquery_1.default('.buttons .hint').attr('disabled', 'true');
        hint_playing = true;
        if (!golden_path)
            throw "There is no golden path";
        var hint_paths = orbPuzzle_1.OrbPuzzle.getHintCoords(golden_path);
        console.log(hint_paths);
        jquery_1.default('.hint-orb').remove();
        let base_transition = "opacity 0.5s";
        var hint_length = -1;
        var orb_count = hint_paths.length;
        for (var path of hint_paths) {
            var coord = path[0][0];
            hint_length = path.length;
            var $e = jquery_1.default('<div/>').addClass('hint-orb').appendTo('.upper-layer');
            $e.css('transform', 'translate(calc(var(--tsize) * ' + coord.x + '), calc(var(--tsize) * ' + coord.y + '))');
            $e.css('transition', base_transition);
            $e.data('x', coord.x);
            $e.data('y', coord.y);
            $e.data('start_visible', coord.visible);
        }
        yield delay(50);
        jquery_1.default('.hint-orb').each((_, e) => {
            jquery_1.default(e).css('opacity', jquery_1.default(e).data('start_visible') ? 0.7 : 0);
        });
        yield delay(750);
        if (hint_length < 1)
            throw "Golden path had length of zero";
        for (var i = 0; i < hint_length; i++) {
            var wait_time = 0;
            var k = 0;
            while (true) {
                var shouldBreak = true;
                for (var n = 0; n < orb_count; n++) {
                    var $orb = jquery_1.default(jquery_1.default('.hint-orb')[n]);
                    var coord = hint_paths[n][i][k];
                    if (coord) {
                        shouldBreak = false;
                        var mag = Math.abs($orb.data('x') - coord.x) + Math.abs($orb.data('y') - coord.y);
                        $orb.data('x', coord.x);
                        $orb.data('y', coord.y);
                        var s = coord.instant ? 0 : mag * 0.1;
                        wait_time = Math.max(wait_time, s);
                        $orb.css('opacity', coord.visible ? 0.7 : 0);
                        $orb.css('transition', 'transform ' + s + 's ease-in, ' + base_transition);
                        $orb.css('transform', 'translate(calc(var(--tsize) * ' + coord.x + '), calc(var(--tsize) * ' + coord.y + '))');
                    }
                }
                wait_time += 0.1;
                yield delay(wait_time * 1000);
                if (shouldBreak)
                    break;
                k++;
            }
        }
        jquery_1.default('.hint-orb').css('opacity', 0);
        yield delay(500);
        hint_playing = false;
        jquery_1.default('.buttons .hint').attr('disabled', 'false');
    });
}
function move_orbs(n = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        jquery_1.default('.puzzle-wrapper .orb').each((i, e) => {
            (function () {
                return __awaiter(this, void 0, void 0, function* () {
                    let b = board.orbs[i];
                    if (b && !jquery_1.default(e).hasClass('orb--in-pit')) {
                        let movement = b.last_moves[n];
                        if (movement) {
                            let abs_mag = Math.max(Math.abs(movement.mag.x), Math.abs(movement.mag.y));
                            let s, wait_time = 0;
                            if (movement.instant) {
                                s = 0;
                                wait_time = 0.3;
                            }
                            else {
                                let $t = $tiles[movement.from.x][movement.from.y];
                                if ($t && $t.hasClass('tile--portal')) {
                                    if (!$t.hasClass('fadeOut')) {
                                        jquery_1.default(e).css('opacity', '');
                                        delay(200);
                                        sound_1.default['portal-out'].play();
                                        explosion_1.animatedParticlesFromElement($t, ['#931eaf', '#372f39', '#3a1f41'], 7, 15);
                                        $t.addClass('fadeOut').remove();
                                    }
                                }
                                s = 0.1 * abs_mag;
                                wait_time = s;
                            }
                            let base_transition = "background 0.5s, border 0.5s, filter 0.5s";
                            jquery_1.default(e).css('transition', 'transform ' + s + 's ease-in, ' + base_transition);
                            jquery_1.default(e).css('transform', 'translate(calc(var(--tsize) * ' + movement.to.x + '), calc(var(--tsize) * ' + movement.to.y + '))');
                            if (b.last_moves.length > 0 && (b.last_moves[0].mag.x != 0 || b.last_moves[0].mag.y != 0)) {
                                if (jquery_1.default(e).hasClass('orb--on-target')) {
                                    jquery_1.default(e).removeClass('orb--on-target');
                                    if (abs_mag > 0)
                                        sound_1.default['leave-goal'].play();
                                }
                            }
                            yield delay(wait_time * 1000);
                            if (!movement.instant) {
                                let $t = $tiles[movement.to.x][movement.to.y];
                                if ($t && $t.hasClass('tile--portal')) {
                                    if (!$t.hasClass('fadeOut')) {
                                        jquery_1.default(e).css('opacity', 0);
                                        sound_1.default['portal-in'].play();
                                        explosion_1.animatedParticlesFromElement($t, ['#931eaf', '#372f39', '#3a1f41'], 7, 15);
                                        $t.addClass('fadeOut').remove();
                                    }
                                }
                            }
                            if (board.getTile(movement.to.x, movement.to.y) == orbPuzzle_1.Tile.Target) {
                                jquery_1.default(e).addClass('orb--on-target');
                                if (abs_mag > 0)
                                    sound_1.default['hit-goal'].play();
                            }
                            if (b.in_pit) {
                                yield delay(100);
                                jquery_1.default(e).addClass('orb--in-pit');
                                if (abs_mag > 0)
                                    sound_1.default['hit-pit'].play();
                                jquery_1.default(e).removeClass('orb--on-target');
                                jquery_1.default(e).css('transform', 'translate(calc(var(--tsize) * ' + movement.to.x + '), calc(var(--tsize) * ' + movement.to.y + ')) scale(0.7)');
                            }
                            else {
                                jquery_1.default(e).removeClass('orb--in-pit');
                            }
                            if (movement.last_contact) {
                                let t = board.getTile(movement.last_contact.x, movement.last_contact.y);
                                if (abs_mag > 0 && !t)
                                    sound_1.default['hit-wall'].play();
                                let $t = $tiles[movement.last_contact.x] ?
                                    $tiles[movement.last_contact.x][movement.last_contact.y]
                                    : undefined;
                                if (abs_mag > 0 && (!$t || !$t.hasClass("portal")))
                                    sound_1.default['hit-wall'].play();
                                if ($t && $t.parent()) {
                                    if ($t.hasClass('tile--fragile') && t == orbPuzzle_1.Tile.Empty) {
                                        if (abs_mag > 0)
                                            sound_1.default['hit-fragile'].play();
                                        $t.addClass('animated');
                                        if (movement.last_contact.x > movement.to.x)
                                            $t.addClass('fadeOutRight');
                                        else if (movement.last_contact.x < movement.to.x)
                                            $t.addClass('fadeOutLeft');
                                        else if (movement.last_contact.y < movement.to.y)
                                            $t.addClass('fadeOutUp');
                                        else if (movement.last_contact.y > movement.to.y)
                                            $t.addClass('fadeOutDown');
                                        setTimeout(() => {
                                            if (movement.last_contact) {
                                                let $b = $tiles[movement.last_contact.x][movement.last_contact.y];
                                                if ($b) {
                                                    $b.remove();
                                                    $b.removeClass('tile--fragile');
                                                    $b.addClass('DELETED');
                                                }
                                            }
                                        }, 1000);
                                    }
                                    else if ($t.hasClass('tile--bomb') && t == orbPuzzle_1.Tile.Empty) {
                                        $t.addClass('animated');
                                        sound_1.default['hit-bomb'].play();
                                        $t.addClass('lit shake');
                                    }
                                }
                                else if (t === orbPuzzle_1.Tile.Empty) {
                                    if (abs_mag > 0)
                                        sound_1.default['hit-orb'].play();
                                }
                            }
                        }
                    }
                });
            })();
        });
        let time = board.orbs.reduce((t, b) => {
            let movement = b.last_moves[n];
            if (movement) {
                if (movement.instant) {
                    return 2;
                }
                return Math.max(Math.max(Math.abs(movement.mag.x), Math.abs(movement.mag.y)), t);
            }
            return t;
        }, 0) * 100;
        sound_1.default['roll'].playFor(time / 1000);
        yield delay(time);
        return time > 0;
    });
}
function apply_move(move) {
    return __awaiter(this, void 0, void 0, function* () {
        sound_1.default['swipe'].play();
        if (board.isSolved()) {
            return;
        }
        if (move && !moving && board) {
            moving = true;
            board = board.apply(move);
            let max_moves = board.orbs.reduce((max, o) => Math.max(max, o.last_moves.length), 0);
            for (let i = 0; i < max_moves; i++) {
                let any_movement = yield move_orbs(i);
                if (!any_movement) {
                    break;
                }
                else {
                    on_player_move();
                }
            }
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
                        sound_1.default['bomb'].play();
                        explosion_1.animatedParticlesFromElement($t);
                        moving = true;
                        setTimeout(() => {
                            if ($t) {
                                $t.removeClass("lit tile--bomb");
                                $t.remove();
                            }
                            moving = false;
                        }, 500);
                    }
                }
                jquery_1.default('.puzzle-wrapper .orb').each((i, e) => {
                    let b = board.orbs[i];
                    if (b.exploded && !jquery_1.default(e).hasClass("fadeOut")) {
                        jquery_1.default(e).addClass("animated fadeOut");
                    }
                });
                if (board.isSolved()) {
                    yield delay(500);
                    if (!sweetalert2_1.default.isVisible()) {
                        if (getUrlVars().level) {
                            let next_level = parseInt(getUrlVars().level) + 1;
                            let ls = localStorage;
                            if (ls.player_progress < next_level) {
                                ls.player_progress++;
                            }
                            sound_1.default["ui-victory"].play();
                            sweetalert2_1.default({
                                title: "You win!",
                                type: "success",
                                showCancelButton: true,
                                cancelButtonText: "Back to level select",
                                confirmButtonText: "Next Puzzle",
                                useRejections: true,
                            }).then(() => {
                                let base = window.location.href.split("?")[0];
                                window.location.href = base + "?level=" + next_level;
                            }).catch(() => {
                                window.location.href = window.location.href.replace("game", getUrlVars().round_id ? "menu" : "levelselect");
                            });
                        }
                        else {
                            sweetalert2_1.default({
                                title: "You win!",
                                type: "success",
                                showCancelButton: true,
                                showConfirmButton: getUrlVars().round_id === undefined,
                                cancelButtonText: getUrlVars().round_id ? "Back to menu" : "Back to settings",
                                useRejections: true,
                            }).then(() => {
                                window.location.reload();
                            }).catch(() => {
                                window.location.href = window.location.href.replace("game", getUrlVars().round_id ? "menu" : "levelselect");
                            });
                        }
                    }
                }
            }
        }
    });
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
            if (t == orbPuzzle_1.Tile.Portal) {
                tileName = 'portal';
                layer = "lower";
            }
            if (t == orbPuzzle_1.Tile.Pit) {
                tileName = 'pit';
                layer = "lower";
            }
            if (t == orbPuzzle_1.Tile.Empty) {
                tileName = 'empty';
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
            /*
            if(board.criticalTiles.find(ct => ct.x == x && ct.y == y)){
              $t.addClass("tile__critical");
            }
            */
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