require('browserify-ignore-code');

let performance:any;
try{
// browserify-ignore-start
let perf_hook_performance = require('perf_hooks').performance;
if(typeof window === "undefined"){
  performance = perf_hook_performance;
}else{
  performance = window.performance;
}
// browserify-ignore-end
}catch(e){}
import $ from 'jquery'

export async function tryUntilSuccess<T, ARGS>(f: (args: ARGS) => T, args: ARGS, debug:boolean = false): Promise<T> {

  return new Promise<T>((resolve, reject) => {
    let i = 0;
    var t0 = performance.now();
    async function  _attempt(): Promise<void> {
      try {
        let result = await f(args);
        resolve(result)
      } catch (e) {
        if(debug)console.error(e)
        for (var j = 0; j < 100; j++) {
          i++;
          if (i % 100 == 0 && debug) {
            console.warn("Over " + i + " attempts..")
          }
          var t1 = performance.now();
          if (t1-t0 > 15000) {
            reject();
            return;
          }
        }
        setTimeout(_attempt)
      }
    }
    _attempt();
  })
}

export async function localFetch(fn:string): Promise<any>{
  return new Promise<any>((res)=>{
    if(typeof window  === "undefined"){
      res(require("../"+fn));
    }else{
      res($.getJSON(fn));
    }
  });
}
