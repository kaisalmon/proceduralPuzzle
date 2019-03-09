"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const orbPuzzleGenerator_1 = require("./../../main/orbPuzzleGenerator");
const lib_1 = require("../../main/lib");
class Routes {
    constructor() {
        this.challengeMap = {};
    }
    routes(app) {
        app.route('/')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            res.status(200).send("Araane Orbs");
        }));
        app.route('/levelFromSettings')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const level = yield lib_1.tryUntilSuccess(orbPuzzleGenerator_1.createOrbPuzzle, req.query, false);
                res.status(200).send(level);
            }
            catch (e) {
                res.status(200).send(Object.assign({ "error": e }, e));
            }
        }));
        app.route('/level')
            .get((req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(req.query);
                let seed = req.query['seed'] ? parseInt(req.query['seed']) : undefined;
                let level = req.query['level'];
                console.log(Object.keys(this.challengeMap));
                if (level === "challenge" && seed && this.challengeMap[seed]) {
                    const result = this.challengeMap[seed];
                    res.status(200).send(result);
                }
                else {
                    const result = yield orbPuzzleGenerator_1.createLevel({ level, seed });
                    if (level === "challenge" && result && seed) {
                        this.challengeMap[seed] = result;
                    }
                    res.status(200).send(result);
                }
            }
            catch (e) {
                res.status(500).send(Object.assign({ "error": e }, e));
            }
        }));
    }
}
exports.Routes = Routes;
//# sourceMappingURL=crmRoutes.js.map