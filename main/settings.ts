import Vue from "vue";
import  $ from 'jquery'
import swal from 'sweetalert2'
Vue.component('vue-slider', require('vue-slider-component'));

function getUrlVars(): { [id: string]: string } {
  var vars: { [id: string]: string } = {};
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
    function({}, key, value: string): string {
      vars[key] = value;
      return "";
    }
  );
  return vars;
}
let level_array:any[] = [];
let ls:any = localStorage;
if(!ls.player_progress){
  ls.player_progress = 1;
}
$(document).ready(()=>{
  let url_vars = getUrlVars();
  let vm = new Vue({
    'el': '#settings',
    'data': {
      'settings_open':false,
      'cheatclick':0,
      'localStorage': ls,
      'levels':level_array,
      'size':parseInt(url_vars["size"]) || 6,
      'orbs': parseInt(url_vars["orbs"]) || 2,
      'brick_density': url_vars['brick_density'] === undefined ? 5 : parseInt(url_vars['brick_density']),
      'pit_density': url_vars['pit_density'] === undefined ? 0 : parseInt(url_vars['pit_density']),
      'fragile_brick_density': url_vars['fragile_brick_density'] === undefined ? 5 : parseInt(url_vars['fragile_brick_density']),
      'moverange': [parseInt(url_vars["mindepth"])  - 1 || 3, parseInt(url_vars["depth"])  - 1 || 4],
      'no_fragile': url_vars["fragile"] === undefined || url_vars["fragile"] === "true" ? false : true,
      'pits': url_vars["pits"] === undefined || url_vars["pits"] === "false" ? false : true,
      'bombs': url_vars["bombs"] === undefined || url_vars["bombs"] === "false" ? false : true,
      'portals': url_vars["portals"] === undefined || url_vars["portals"] === "false" ? false : true,
      'decoy_pits': url_vars["decoy_pits"] === undefined || url_vars["decoy_pits"] === "false" ? false : true,
      'decoy_orbs': url_vars["decoy_orbs"] === undefined || url_vars["decoy_orbs"] === "false" ? false : true,
      'decoy_bombs': url_vars["decoy_bombs"] === undefined || url_vars["decoy_bombs"] === "false" ? false : true,
      'decoy_portals': url_vars["decoy_portals"] === undefined || url_vars["decoy_portals"] === "false" ? false : true
    },
    'watch':{
      'size': function(){
        this.setUrl();
      },
      'orbs': function(){
        this.setUrl();
      },'moverange': function(){
        this.setUrl();
      },'no_fragile': function(){
        if(this.no_fragile){
          this.fragile_brick_density = 0;
        }else{
          this.fragile_brick_density = 5;
        }
        this.setUrl();
      },'pits': function(){
        this.setUrl();
      },'bombs': function(){
        this.setUrl();
      },'decoy_pits': function(){
        if(!this.decoy_pits){
          this.pit_density = 0;
        }else{
          this.pit_density = 5;
        }
        this.setUrl();
      },
      'decoy_orbs': function(){
      this.setUrl();
      },
      'decoy_bombs': function(){
        this.setUrl();
      },
      'decoy_portals': function(){
        if(this.decoy_portals) this.portals = false;
        this.setUrl();
      },
      'portals': function(){
        if(this.portals) this.decoy_portals = false;
        this.setUrl();
      },
      'brick_density': function(){
        this.setUrl();
      },
      'pit_density': function(){
        this.setUrl();
      },
      'fragile_brick_density': function(){
        this.setUrl();
      },
      'cheatclick':function(){
        if(this.cheatclick >= 10){
          if(ls.player_progress != 1000){
            swal({
              title:"Cheat?",
              text: "Would you like to unlock all levels?",
              type: "question",
              showCancelButton:true
            }).then(()=>{
              this.localStorage.player_progress = 1000;
              location.reload();
            })
          }
        }
      }
    },
    'computed': {
      'fragile': function(){
        return !this.no_fragile;
      },
      'range_label': function(){
        if(this.moverange[0] == this.moverange[1]) return this.moverange[0];
        return Math.min(this.moverange[0], this.moverange[1])+" - "+ Math.max(this.moverange[0], this.moverange[1])
      },
      'difficulty' : function():number{
        let d = Math.sqrt(this.orbs) * (Math.pow(this.moverange[1], 2) -  Math.pow(this.size-8, 2));
        if(this.pits){
          d *= 1.15;
        }
        return Math.max(d, 10);
      },
      'difficulty_label': function():string{
        if (this.difficulty < this.max_difficulty * 0.3) {
          return "easy"
        } else if (this.difficulty < this.max_difficulty * 0.7) {
          return "medium"
        }
        return "hard";
      },
      'max_difficulty': function(){
        return Math.sqrt(10) * Math.pow(7,2) * 1.25
      },
      'difficulty_percent': function(){
        return (this.difficulty/this.max_difficulty * 100) + "%";
      },
      'depth' : function():number{
        return  Math.max(this.moverange[0], this.moverange[1])*1 + 1;
      },
      'mindepth' : function():number{
        return  Math.min(this.moverange[0], this.moverange[1])*1 + 1;
      }
    },
    'methods': {
      'setUrl': function(){
        let base =   window.location.href.split("?")[0]
        let settings = "size="+this.size;
        settings += "&depth="+this.depth;
        settings += "&mindepth="+this.mindepth;
        settings += "&orbs="+this.orbs;
        settings += "&fragile="+this.fragile;
        settings += "&pits="+this.pits;
        settings += "&bombs="+this.bombs;
        settings += "&portals="+this.portals;
        settings += "&decoy_pits="+this.decoy_pits;
        settings += "&decoy_orbs="+this.decoy_orbs;
        settings += "&decoy_bombs="+this.decoy_bombs;
        settings += "&decoy_portals="+this.decoy_portals;
        settings += "&brick_density="+this.brick_density;
        settings += "&fragile_brick_density="+this.fragile_brick_density;
        settings += "&pit_density="+this.pit_density;
        window.history.replaceState({}, "Settings", base + "?" + settings);
      },
      'play':function(){
        let qstring = window.location.href.match(/\?.*|$/);
        let base = window.location.pathname;
        if(base.indexOf("index.html") === -1){
          base += "/index.html";
        }
        window.location.href = base.replace("index", "game") + qstring;
      }
    }
  })
  async function get_level_list(){
    let level_index = await $.getJSON("levels/level_index.json");
    for(var level = 1; level <= level_index.total_levels; level++){
      let level_data;
      let repeat = false;
      for(var j = 0; j<20; j++){
        level_data = level_index[level-j]
        if(level_data !== undefined){
          break;
        }
        repeat = true; //This means that this level is a repeat of a setting
      }
      if(level_data === undefined){
        throw "Level not found"
      }
      level_data= Object.assign({}, level_data);
      level_data.repeat = repeat;
      level_data.level_number = level;
      vm.levels.push(level_data);
    }
  };
  get_level_list();
})
