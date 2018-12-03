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
const PATH = "assets/sounds/";
lowLag.init({ 'urlPrefix': PATH });
const seffects = {
    "hit-fragile": ["AO_gameplay_break.ogg"],
    "hit-goal": ["AO_gameplay_orb_hit_goal.ogg"],
    "hit-orb": ["AO_gameplay_orb_hit_orb.ogg"],
    "hit-bomb": ["AO_gameplay_bomb_fizz.ogg"],
    "hit-pit": ["AO_gameplay_orb_hit_pit.ogg"],
    "hit-wall": [
        "AO_gameplay_orb_hit_wall_light_01.ogg",
        "AO_gameplay_orb_hit_wall_light_02.ogg",
        "AO_gameplay_orb_hit_wall_light_03.ogg",
        "AO_gameplay_orb_hit_wall_light_04.ogg",
        "AO_gameplay_orb_hit_wall_light_05.ogg",
        "AO_gameplay_orb_hit_wall_light_06.ogg"
    ],
    "leave-goal": ["AO_gameplay_orb_leave_goal.ogg"],
    "bomb": ["AO_gameplay_bomb.ogg"],
    "roll": [
        "AO_gameplay_orb_roll_01.ogg",
        "AO_gameplay_orb_roll_02.ogg",
        "AO_gameplay_orb_roll_03.ogg",
        "AO_gameplay_orb_roll_04.ogg",
        "AO_gameplay_orb_roll_05.ogg",
        "AO_gameplay_orb_roll_06.ogg"
    ],
    "swipe": [
        "AO_gameplay_swipe_01.ogg",
        "AO_gameplay_swipe_02.ogg",
        "AO_gameplay_swipe_03.ogg",
        "AO_gameplay_swipe_04.ogg"
    ],
    "portal-in": ["AO_gameplay_teleport_in.ogg"],
    "portal-out": ["AO_gameplay_teleport_out.ogg"],
    "ui-pop": ["AO_ui_pop.ogg"],
    "ui-select": ["AO_ui_select.ogg"],
    "ui-victory": ["AO_ui_victorypop.ogg"]
};
class SEffect {
    constructor(files) {
        this.audios = files.map(fn => {
            lowLag.load(fn, fn);
            return {
                currentTime: 0,
                play: () => {
                    this.tag = lowLag.play(fn);
                },
                pause: () => {
                    this.tag.pause();
                }
            };
        });
    }
    play() {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO: Do not repeat if possible
            const i = Math.floor(Math.random() * this.audios.length);
            let s = this.audios[i];
            s.currentTime = 0;
            yield s.play();
            return this.audios[i];
        });
    }
    playFor(seconds) {
        this.play().then((s) => {
            setTimeout(() => {
                s.pause();
            }, seconds * 1000);
        });
    }
}
let S_EFFECTS = {};
for (let n in seffects) {
    S_EFFECTS[n] = new SEffect(seffects[n]);
}
jquery_1.default(document).one("click", "*", function () {
    S_EFFECTS["ui-select"].playFor(0);
});
exports.default = S_EFFECTS;
//# sourceMappingURL=sound_lowlag.js.map