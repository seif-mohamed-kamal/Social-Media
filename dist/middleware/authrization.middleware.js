"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authrization = void 0;
const domain_exception_1 = require("../common/exceptions/domain.exception");
const authrization = (accessRoles) => {
    return async (req, res, next) => {
        if (!accessRoles.includes(req.user.role)) {
            throw new domain_exception_1.ForbiddenException("Not Authorized access");
        }
        next();
    };
};
exports.authrization = authrization;
