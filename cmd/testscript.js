"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const orbPuzzleGenerator_1 = require("../cmd/orbPuzzleGenerator");
const orbPuzzle_1 = require("../cmd/orbPuzzle");
orbPuzzleGenerator_1.from_json(require("../levels/bomb.json"), false).then(result => {
    for (var i = 0; i < 15; i++) {
        try {
            let p = result[0][0];
            p.use_fragile = true;
            let p2 = p.reverse(orbPuzzle_1.OrbMove.Up);
            let p3 = p2.reverse(orbPuzzle_1.OrbMove.LeftBomb);
            console.log(p.toString(true));
            console.log(p2.toString(true));
            console.log(p3.toString(true));
            console.log(p3.apply(orbPuzzle_1.OrbMove.Left).toString(true));
            break;
        }
        catch (_a) {
            console.log("fail...");
        }
    }
});
//# sourceMappingURL=testscript.js.map