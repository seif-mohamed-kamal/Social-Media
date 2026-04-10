"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genearalValidationFeilds = void 0;
const zod_1 = require("zod");
exports.genearalValidationFeilds = {
    email: zod_1.z.email().min(2).max(20),
    password: zod_1.z.string(),
    username: zod_1.z.string(),
    confirmPassword: zod_1.z.string()
};
