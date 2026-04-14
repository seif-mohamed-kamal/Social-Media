"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswordSchema = void 0;
const zod_1 = require("zod");
const validation_1 = require("../../common/validation");
exports.updatePasswordSchema = {
    body: zod_1.z
        .strictObject({
        oldPassword: validation_1.generalValidationFeilds.password,
        newPassword: validation_1.generalValidationFeilds.password,
        confirmPassword: validation_1.generalValidationFeilds.confirmPassword,
    })
        .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    }),
};
