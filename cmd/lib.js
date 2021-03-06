"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('browserify-ignore-code');
let performance;
try {
    // browserify-ignore-start
    if (typeof window === "undefined") {
        let perf_hook_performance = require('perf_hooks').performance;
        performance = perf_hook_performance;
    }
    else {
        performance = window.performance;
    }
    // browserify-ignore-end
}
catch (e) {
}
const jquery_1 = __importDefault(require("jquery"));
function tryUntilSuccess(f, args, debug = false, time = 15) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let i = 0;
            var t0 = performance.now();
            function _attempt() {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        i++;
                        let result = yield f(args);
                        resolve(result);
                    }
                    catch (e) {
                        if (debug)
                            console.error(e);
                        if (i % 25 == 0 && debug) {
                            console.warn("Over " + i + " attempts..");
                        }
                        var t1 = performance.now();
                        if (t1 - t0 > time * 1000) {
                            reject();
                            return;
                        }
                        setTimeout(_attempt);
                    }
                });
            }
            _attempt();
        });
    });
}
exports.tryUntilSuccess = tryUntilSuccess;
function localFetch(fn) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((res) => {
            if (typeof window === "undefined") {
                res(require("../" + fn));
            }
            else {
                res(jquery_1.default.getJSON(fn));
            }
        });
    });
}
exports.localFetch = localFetch;
//# sourceMappingURL=lib.js.map