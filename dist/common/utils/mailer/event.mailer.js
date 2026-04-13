"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitEmail = void 0;
const node_events_1 = require("node:events");
exports.emitEmail = new node_events_1.EventEmitter();
exports.emitEmail.on('sendEmail', async (fn) => {
    try {
        await fn();
    }
    catch (error) {
        console.log(`Error to send Email ${error}`);
    }
});
