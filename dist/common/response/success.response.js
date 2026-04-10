"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = void 0;
const successResponse = ({ res, message = "Done", status = 200, result, }) => {
    return res.status(status).json({ message, status, result });
};
exports.successResponse = successResponse;
