"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_service_1 = require("../../../config/config.service");
exports.transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: config_service_1.APP_GMAIL,
        pass: config_service_1.APP_PASSWORD,
    },
});
const sendEmail = async ({ to, cc, bcc, subject, html, attachments = [], }) => {
    try {
        const info = await exports.transporter.sendMail({
            to,
            cc,
            bcc,
            subject,
            html,
            attachments,
            from: 'Social-Media✌️',
        });
        console.log("Email sent:", info.response);
    }
    catch (error) {
        console.error("Email error:", error);
        throw new Error("Failed to send OTP email");
    }
};
exports.sendEmail = sendEmail;
