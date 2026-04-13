"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHash = generateHash;
exports.comapareeHash = comapareeHash;
const bcrypt_1 = require("bcrypt");
const config_service_1 = require("../../../config/config.service");
async function generateHash({ plainText, salt = config_service_1.SALT_ROUND }) {
    return await (0, bcrypt_1.hash)(plainText, salt);
}
async function comapareeHash({ plainText, ciphetText, }) {
    return await (0, bcrypt_1.compare)(plainText, ciphetText);
}
