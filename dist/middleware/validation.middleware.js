"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = void 0;
const domain_exception_1 = require("../common/exceptions/domain.exception");
const validation = (schema) => {
    return (req, res, next) => {
        const issues = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const error = validationResult.error;
                issues.push({
                    key,
                    issues: error.issues.map((issue) => {
                        return { path: issue.path, message: issue.message };
                    }),
                });
            }
        }
        if (issues.length) {
            throw new domain_exception_1.BadRequestException("validation Error", { cause: issues });
        }
        next();
    };
};
exports.validation = validation;
