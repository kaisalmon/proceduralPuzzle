"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const orbPuzzleGenerator_1 = require("../cmd/orbPuzzleGenerator");
const orbPuzzle_1 = require("../cmd/orbPuzzle");
orbPuzzleGenerator_1.from_json(require("../levels/bomb.json"), false).then(result => {
    let p = result[0][0];
    p.use_fragile = true;
    console.log(p.toString(true));
    p = p.reverse(orbPuzzle_1.OrbMove.Left);
    console.log(p.toString(true));
    p = p.reverse(orbPuzzle_1.OrbMove.Up);
    console.log(p.toString(true));
    p = p.reverse(orbPuzzle_1.OrbMove.Right);
    console.log(p.toString(true));
    p = p.reverse(orbPuzzle_1.OrbMove.UpBomb);
    console.log(p.toString(true));
    p = p.reverse(orbPuzzle_1.OrbMove.DownBomb);
    console.log(p.toString(true));
});
//# sourceMappingURL=testscript.js.map