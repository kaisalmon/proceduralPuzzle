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
    "bomb": ["AO_gameplay_bomb.mp3"],
    "hit-fragile": ["AO_gameplay_break.mp3"],
    "hit-goal": ["AO_gameplay_orb_hit_goal.mp3"],
    "hit-orb": ["AO_gameplay_orb_hit_orb.mp3"],
    "hit-pit": ["AO_gameplay_orb_hit_pit.mp3"],
    "hit-wall": [
        "AO_gameplay_orb_hit_wall_01.mp3",
        "AO_gameplay_orb_hit_wall_02.mp3",
        "AO_gameplay_orb_hit_wall_03.mp3",
        "AO_gameplay_orb_hit_wall_04.mp3",
        "AO_gameplay_orb_hit_wall_05.mp3",
        "AO_gameplay_orb_hit_wall_06.mp3"
    ],
    "leave-goal": ["AO_gameplay_orb_leave_goal.mp3"],
    "roll": [
        "AO_gameplay_orb_roll_01.mp3",
        "AO_gameplay_orb_roll_02.mp3",
        "AO_gameplay_orb_roll_03.mp3",
        "AO_gameplay_orb_roll_04.mp3",
        "AO_gameplay_orb_roll_05.mp3",
        "AO_gameplay_orb_roll_06.mp3"
    ],
    "swipe": [
        "AO_gameplay_swipe_01.mp3",
        "AO_gameplay_swipe_02.mp3",
        "AO_gameplay_swipe_03.mp3",
        "AO_gameplay_swipe_04.mp3"
    ],
    "teleport": ["AO_gameplay_teleport.mp3"],
    "ui-pop": ["AO_ui_pop.mp3"],
    "ui-select": ["AO_ui_select.mp3"],
    "ui-victory": ["AO_ui_victorypop.mp3"]
};
class SEffect {
    constructor(files) {
        this.audios = files.map(fn => {
            lowLag.load(fn, fn);
            return {
                currentTime: 0,
                play: () => {
                    lowLag.play(fn);
                },
                pause: () => {
                    lowLag.pause(fn);
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
//# sourceMappingURL=sound.js.map