import $ from 'jquery'
declare const lowLag:any;
const PATH = "assets/sounds/";
lowLag.init({'urlPrefix':PATH});

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

interface sound {
  play: () => any,
  pause: () => any,
  currentTime: number
}

class SEffect {
  audios: sound[];
  tag: any;
  constructor(files: string[]) {
    this.audios = files.map(fn => {
      lowLag.load(fn, fn);
      return {
        currentTime: 0, //TODO: FIX SO THIS EITHER ISN'T NEEDED OR WORKS
        play: ()=>{
          this.tag =  lowLag.play(fn);
        },
        pause: ()=>{
          this.tag.pause();
        }
      }
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
  S_EFFECTS[n] = new SEffect(seffects[n]);
}
$(document).one( "click", "*", function() {
  S_EFFECTS["ui-select"].playFor(0);
});
export default S_EFFECTS;
