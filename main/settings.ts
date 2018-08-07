import Vue from "vue";
import  $ from 'jquery'

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

$(document).ready(()=>{
  let url_vars = getUrlVars();
  let vm = new Vue({
    'el': '#settings',
    'data': {
      'size':parseInt(url_vars["size"]) || 6,
      'boulders': parseInt(url_vars["boulders"]) || 2,
      'minmoves': parseInt(url_vars["depth"])  - 1 || 3,
      'no_fragile': url_vars["fragile"] === undefined || url_vars["fragile"] === "true" ? false : true,
      'pits': url_vars["pits"] === undefined || url_vars["pits"] === "false" ? false : true
    },
    'watch':{
      'size': function(){
        this.setUrl();
      },
      'boulders': function(){
        this.setUrl();
      },'minmoves': function(){
        this.setUrl();
      },'no_fragile': function(){
        this.setUrl();
      },'pits': function(){
        this.setUrl();
      }
    },
    'computed': {
      'fragile': function(){
        return !this.no_fragile;
      },
      'difficulty' : function():number{
        let d = Math.sqrt(this.boulders) * (Math.pow(this.minmoves, 2) -  Math.pow(this.size-8, 2));
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
        return this.minmoves*1 + 1;
      }
    },
    'methods': {
      'setUrl': function(){
        let base =   window.location.href.split("?")[0]
        let settings = "size="+this.size;
        settings += "&depth="+this.depth;
        settings += "&boulders="+this.boulders;
        settings += "&fragile="+this.fragile;
        settings += "&pits="+this.pits;
        window.history.replaceState({}, "Settings", base + "?" + settings);
      },
      'play':function(){
        window.location.href = window.location.href.replace("index", "game");
      }
    }
  })
  console.log(vm);
})
