import { from_json as createPuzzle } from '../main/orbPuzzleGenerator'
import { OrbMove } from '../main/orbPuzzle'

createPuzzle(require("../levels/bomb.json"), false).then(result=>{
  for(var i = 0; i<15; i++){
    try{
      let p = result[0][0];
      p.use_fragile = true;
      let p2 = p.reverse(OrbMove.Up);
      let p3 = p2.reverse(OrbMove.LeftBomb);
      console.log(p.toString(true));
      console.log(p2.toString(true));
      console.log(p3.toString(true));
      console.log(p3.apply(OrbMove.Left).toString(true));
      break
    }catch{
      console.log("fail...")
    }
  }
});
