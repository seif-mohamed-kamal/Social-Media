"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
exports.loginSchema = {
    body: zod_1.z.strictObject({
        email: validation_1.genearalValidationFeilds.email,
        password: validation_1.genearalValidationFeilds.password,
    }),
};
exports.signupSchema = {
    body: exports.loginSchema.body.safeExtend({
        username: validation_1.genearalValidationFeilds.username,
        confirmPassword: validation_1.genearalValidationFeilds.confirmPassword,
    }).refine((data) => {
        return data.password === data.confirmPassword;
    }, { error: "password missMatch with confirmPassword" }),
};
