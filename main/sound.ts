import $ from 'jquery'

const PATH = "assets/sounds/";
const seffects: { [name: string]: string[] } = {
  "bomb": ["AO_gameplay_bomb.wav"],
  "hit-fragile": ["AO_gameplay_break.wav"],
  "hit-goal": ["AO_gameplay_orb_hit_goal.wav"],
  "hit-orb": ["AO_gameplay_orb_hit_orb.wav"],
  "hit-pit": ["AO_gameplay_orb_hit_pit.wav"],
  "hit-wall": [
    "AO_gameplay_orb_hit_wall_01.wav",
    "AO_gameplay_orb_hit_wall_02.wav",
    "AO_gameplay_orb_hit_wall_03.wav",
    "AO_gameplay_orb_hit_wall_04.wav",
    "AO_gameplay_orb_hit_wall_05.wav",
    "AO_gameplay_orb_hit_wall_06.wav"
  ],
  "leave-goal": ["AO_gameplay_orb_leave_goal.wav"],
  "roll": [
    "AO_gameplay_orb_roll_01.wav",
    "AO_gameplay_orb_roll_02.wav",
    "AO_gameplay_orb_roll_03.wav",
    "AO_gameplay_orb_roll_04.wav",
    "AO_gameplay_orb_roll_05.wav",
    "AO_gameplay_orb_roll_06.wav"
  ],
  "swipe": [
    "AO_gameplay_swipe_01.wav",
    "AO_gameplay_swipe_02.wav",
    "AO_gameplay_swipe_03.wav",
    "AO_gameplay_swipe_04.wav"
  ],
  "teleport": ["AO_gameplay_teleport.wav"],
  "ui-pop": ["AO_ui_pop.wav"],
  "ui-select": ["AO_ui_select.wav"],
  "ui-victory": ["AO_ui_victorypop.wav"]
};

class SEffect {
  audios: HTMLAudioElement[];
  constructor(files: string[]) {
    this.audios = files.map(fn => {
      let a = new Audio(PATH + fn)
      a.volume = 0.1;
      return a;
    });
  }

  async play(): Promise<HTMLAudioElement> {
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
  S_EFFECTS[n] = new SEffect(seffects[n]);
}
$(document).one( "click", "*", function() {
  S_EFFECTS["ui-select"].playFor(0);
});
export default S_EFFECTS;
