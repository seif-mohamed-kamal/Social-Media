"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_1 = require("../../common/response");
const middleware_1 = require("../../middleware");
const user_service_1 = __importDefault(require("./user.service"));
const enum_1 = require("../../common/enum");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const validators = __importStar(require("./user.validation"));
const router = (0, express_1.Router)();
router.get("/profile", (0, middleware_1.authintication)(), async (req, res, next) => {
    const result = await user_service_1.default.profile(req.user);
    return (0, response_1.successResponse)({ res, status: 200, result });
});
router.post("/logout", (0, middleware_1.authintication)(), async (req, res, next) => {
    const { flag } = req.body;
    const status = await user_service_1.default.logout(flag, req.user, req.decoded);
    return (0, response_1.successResponse)({ res, status });
});
router.get("/rotate-token", (0, middleware_1.authintication)({ tokenType: enum_1.TokenTypeEnum.REFRESH }), async (req, res, next) => {
    const result = await user_service_1.default.rotateToken(req.user, `${req.protocol}://${req.host}`, req.decoded);
    return (0, response_1.successResponse)({ res, status: 200, result });
});
router.patch("/update-password", (0, middleware_1.authintication)(), (0, validation_middleware_1.validation)(validators.updatePasswordSchema), async (req, res, next) => {
    const result = await user_service_1.default.updatePassword(req.body, req.user, `${req.protocol}://${req.host}`);
    return (0, response_1.successResponse)({
        res,
        status: 200,
        result,
    });
});
exports.default = router;
