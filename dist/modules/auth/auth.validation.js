"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupSchema = exports.loginSchema = exports.resendConfirmEmailSchema = exports.confirmEmailSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
exports.confirmEmailSchema = {
    body: zod_1.z.strictObject({
        email: validation_1.generalValidationFeilds.email,
        otp: validation_1.generalValidationFeilds.otp
    })
};
exports.resendConfirmEmailSchema = {
    body: zod_1.z.strictObject({
        email: validation_1.generalValidationFeilds.email,
    })
};
exports.loginSchema = {
    body: zod_1.z.strictObject({
        email: validation_1.generalValidationFeilds.email,
        password: validation_1.generalValidationFeilds.password,
    }),
};
exports.signupSchema = {
    body: exports.loginSchema.body.safeExtend({
        username: validation_1.generalValidationFeilds.username,
        confirmPassword: validation_1.generalValidationFeilds.confirmPassword,
        phone: validation_1.generalValidationFeilds.phone
    }).refine((data) => {
        return data.password === data.confirmPassword;
    }, { error: "password missMatch with confirmPassword" }),
};
