import $ from 'jquery'
const PATH = "assets/sounds/";

const seffects: { [name: string]: string[] } = {
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
    "AO_gameplay_quickswipe_01.ogg",
    "AO_gameplay_quickswipe_02.ogg",
    "AO_gameplay_quickswipe_03.ogg",
    "AO_gameplay_quickswipe_04.ogg"
  ],
  "portal-in": ["AO_gameplay_teleport_in.ogg"],
  "portal-out": ["AO_gameplay_teleport_out.ogg"],
  "ui-pop": ["AO_ui_pop.ogg"],
  "ui-select": ["AO_ui_select.ogg"],
  "ui-victory": ["AO_ui_victorypop.ogg"]
};

const volumes:{[name:string]: number} = {
  "swipe": 0.05
}

interface sound {
  play: () => any,
  pause: () => any,
  currentTime: number
}

class SEffect {
  audios: sound[];
  constructor(files: string[], name:string) {
    this.audios = files.map(fn => {
      let a = new Audio(PATH+fn)
      a.volume = volumes[name] || 1.0;
      return a
    });
  }

  async play(): Promise<sound> {
    //TODO: Do not repeat if possible
    const i = Math.floor(Math.random() * this.audios.length)
    let s = this.audios[i];
    s.currentTime = 0;
    await s.play();
    return this.audios[i];
  }
  playFor(seconds: number) {
    this.play().then((s) => {
      setTimeout(() => {
        s.pause();
      }, seconds * 1000);
    });
  }
}

let S_EFFECTS: { [name: string]: SEffect } = {};
for (let n in seffects) {
  S_EFFECTS[n] = new SEffect(seffects[n], n);
}
$(document).one( "click", "*", function() {
  S_EFFECTS["ui-select"].playFor(0);
});
export default S_EFFECTS;
