"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationException = void 0;
class ApplicationException extends Error {
    constructor(message, statusCode, options) {
        super(message, options);
        this.name = this.constructor.name;
    }
}
exports.ApplicationException = ApplicationException;
