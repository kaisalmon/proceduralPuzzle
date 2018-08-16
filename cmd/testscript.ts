import { from_json as createPuzzle } from '../main/orbPuzzleGenerator'
import { OrbMove } from '../main/orbPuzzle'


let moves:OrbMove[] = [OrbMove.Up, OrbMove.LeftPortal]

createPuzzle(require("../levels/bomb.json"), false).then(result=>{
  for(var i = 0; i < 15; i++){
    let strings:string[] = [];
    let p = result[0][0];
    p.use_fragile = true;
    strings.push(p.toString())
    try{
      for(let m of moves){
        p = p.reverse(m);
        strings.push(p.toString())
      }
      strings.push("--------");
      for(let m of moves.reverse()){
        p = p.apply(m);
        strings.push(p.toString())
      }
      for(let s of strings){
        console.log(s)
        console.log("");
      }
      break;
    }catch(e){
      console.log("fail...(",e,")");
    }
  }
});
