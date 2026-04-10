"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandling = void 0;
const globalErrorHandling = (error, req, res, next) => {
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message || 'internal server error', error, cause: error.cause, stack: error.stack });
};
exports.globalErrorHandling = globalErrorHandling;
