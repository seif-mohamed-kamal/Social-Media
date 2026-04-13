"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalValidationFeilds = void 0;
const zod_1 = require("zod");
exports.generalValidationFeilds = {
    email: zod_1.z.email(),
    password: zod_1.z.string(),
    username: zod_1.z.string(),
    confirmPassword: zod_1.z.string(),
    phone: zod_1.z.string(),
    otp: zod_1.z.string().regex(/^\d[6]$/)
};
