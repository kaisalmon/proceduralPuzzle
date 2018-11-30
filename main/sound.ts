import $ from 'jquery'

const PATH = "assets/sounds/";
const seffects: { [name: string]: string[] } = {
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
