"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// lib/server.ts
const app_1 = __importDefault(require("./app"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const SERVER_PORT = 5000;
app_1.default.listen(SERVER_PORT, () => {
    console.log('Express server listening on port ' + SERVER_PORT);
});
app_1.default.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
//# sourceMappingURL=server.js.map