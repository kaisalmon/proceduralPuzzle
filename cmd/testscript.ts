import { from_json as createPuzzle } from '../main/orbPuzzleGenerator'
import { OrbMove } from '../main/orbPuzzle'

createPuzzle(require("../levels/bomb.json"), false).then(result=>{
  let p = result[0][0];
  p.use_fragile = true;
  console.log(p.toString(true));
  p = p.reverse(OrbMove.Left);
  console.log(p.toString(true));
  p = p.reverse(OrbMove.Up);
  console.log(p.toString(true));
  p = p.reverse(OrbMove.Right);
  console.log(p.toString(true));
  p = p.reverse(OrbMove.UpBomb);
  console.log(p.toString(true));
  p = p.reverse(OrbMove.DownBomb);
  console.log(p.toString(true));
});
