"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const orbPuzzleGenerator_1 = require("../cmd/orbPuzzleGenerator");
const orbPuzzle_1 = require("../cmd/orbPuzzle");
let moves = [orbPuzzle_1.OrbMove.Up, orbPuzzle_1.OrbMove.LeftPortal];
orbPuzzleGenerator_1.from_json(require("../levels/bomb.json"), false).then(result => {
    for (var i = 0; i < 15; i++) {
        let strings = [];
        let p = result[0][0];
        p.use_fragile = true;
        strings.push(p.toString());
        try {
            for (let m of moves) {
                p = p.reverse(m);
                strings.push(p.toString());
            }
            strings.push("--------");
            for (let m of moves.reverse()) {
                p = p.apply(m);
                strings.push(p.toString());
            }
            for (let s of strings) {
                console.log(s);
                console.log("");
            }
            break;
        }
        catch (e) {
            console.log("fail...(", e, ")");
        }
    }
});
//# sourceMappingURL=testscript.js.map