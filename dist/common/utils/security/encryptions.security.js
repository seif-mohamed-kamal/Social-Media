"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDecrypt = exports.generateEncrypt = void 0;
const config_service_1 = require("../../../config/config.service");
const domain_exception_1 = require("../../exceptions/domain.exception");
const node_crypto_1 = __importDefault(require("node:crypto"));
const generateEncrypt = async (plainText) => {
    const iv = node_crypto_1.default.randomBytes(16);
    if (!config_service_1.ENCRYPT_KEY) {
        throw new Error("ENCRYPT_KEY is not defined");
    }
    const cipherIv = node_crypto_1.default.createCipheriv("aes-256-cbc", config_service_1.ENCRYPT_KEY, iv);
    let encrypted = cipherIv.update(plainText, "utf8", "hex");
    encrypted += cipherIv.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
};
exports.generateEncrypt = generateEncrypt;
const generateDecrypt = async (cipherText) => {
    const [iv, encryptedData] = cipherText.split(":") || [];
    if (!iv || !encryptedData) {
        throw new domain_exception_1.BadRequestException("Missing Encryption Parts");
    }
    if (!config_service_1.ENCRYPT_KEY) {
        throw new Error("ENCRYPT_KEY is not defined");
    }
    const ivBuffer = Buffer.from(iv, 'hex');
    const decipher = node_crypto_1.default.createDecipheriv("aes-256-cbc", config_service_1.ENCRYPT_KEY, ivBuffer);
    let plainText = decipher.update(encryptedData, "hex", "utf8");
    plainText += decipher.final("utf8");
    return plainText;
};
exports.generateDecrypt = generateDecrypt;
