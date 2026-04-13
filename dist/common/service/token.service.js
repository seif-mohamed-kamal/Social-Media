"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = exports.ROLE_ENUM = exports.TOKEN_TYPE_ENUM = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const repository_1 = require("../../DB/repository");
const redis_service_1 = require("./redis.service");
const config_service_1 = require("../../config/config.service");
var TOKEN_TYPE_ENUM;
(function (TOKEN_TYPE_ENUM) {
    TOKEN_TYPE_ENUM["ACCESS"] = "access";
    TOKEN_TYPE_ENUM["REFRESH"] = "refresh";
    TOKEN_TYPE_ENUM["RESET"] = "reset";
})(TOKEN_TYPE_ENUM || (exports.TOKEN_TYPE_ENUM = TOKEN_TYPE_ENUM = {}));
var ROLE_ENUM;
(function (ROLE_ENUM) {
    ROLE_ENUM["USER"] = "user";
    ROLE_ENUM["ADMIN"] = "admin";
})(ROLE_ENUM || (exports.ROLE_ENUM = ROLE_ENUM = {}));
class TokenService {
    userModel;
    redis;
    constructor() {
        this.userModel = new repository_1.userRepository();
        this.redis = redis_service_1.redisService;
    }
    async generateToken({ payload, secret, options = {}, }) {
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    async verifyToken({ token, secret, }) {
        return jsonwebtoken_1.default.verify(token, secret);
    }
    async detectRole(role) {
        switch (role) {
            case ROLE_ENUM.ADMIN:
                return {
                    accessSignature: config_service_1.JWT_SECRET_ADMIN,
                    refreshSignature: config_service_1.JWT_SECRET_ADMIN_refresh,
                    resetSignature: config_service_1.JWT_SECRET_RESET,
                };
            default:
                return {
                    accessSignature: config_service_1.JWT_SECRET,
                    refreshSignature: config_service_1.JWT_SECRET_refresh,
                    resetSignature: config_service_1.JWT_SECRET_RESET,
                };
        }
    }
    async generateTokenSignature({ tokenType = TOKEN_TYPE_ENUM.ACCESS, level, }) {
        const { accessSignature, refreshSignature, resetSignature } = await this.detectRole(level);
        switch (tokenType) {
            case TOKEN_TYPE_ENUM.REFRESH:
                return refreshSignature;
            case TOKEN_TYPE_ENUM.RESET:
                return resetSignature;
            default:
                return accessSignature;
        }
    }
    async decodeToken({ token, tokenType = TOKEN_TYPE_ENUM.ACCESS, }) {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded) {
            throw new Error("Invalid token");
        }
        const decodedToken = decoded;
        const [tokenApproach, level] = decodedToken.aud;
        if (tokenType !== tokenApproach) {
            throw new Error("Unexpected token type");
        }
        const secret = await this.generateTokenSignature({
            tokenType: tokenApproach,
            level,
        });
        if (decodedToken.jti &&
            (await this.redis.get(this.revokeTokenKey({
                userId: decodedToken.sub,
                jti: decodedToken.jti,
            })))) {
            throw new Error("Token revoked");
        }
        const verifiedData = await this.verifyToken({ token, secret });
        const user = await this.userModel.findOne({
            filter: { _id: verifiedData.sub },
        });
        if (!user) {
            throw new Error("User not found");
        }
        if (user.changeCreadintialTime &&
            verifiedData.iat &&
            user.changeCreadintialTime.getTime() >
                verifiedData.iat * 1000) {
            throw new Error("Token expired due to credential change");
        }
        return { user, decodedToken: verifiedData };
    }
    async createLoginCredentials(user, issuer, tokenType) {
        const jwtid = (0, crypto_1.randomUUID)();
        if (tokenType === TOKEN_TYPE_ENUM.RESET) {
            return this.generateToken({
                payload: { sub: user._id },
                secret: config_service_1.JWT_SECRET_RESET,
                options: {
                    audience: [TOKEN_TYPE_ENUM.RESET, user.role],
                    expiresIn: "15m",
                    jwtid,
                },
            });
        }
        const { accessSignature, refreshSignature } = await this.detectRole(user.role);
        const accessToken = await this.generateToken({
            payload: { sub: user._id },
            secret: accessSignature,
            options: {
                issuer,
                audience: [TOKEN_TYPE_ENUM.ACCESS, user.role],
                expiresIn: "30m",
                jwtid,
            },
        });
        const refreshToken = await this.generateToken({
            payload: { sub: user._id },
            secret: refreshSignature,
            options: {
                issuer,
                audience: [TOKEN_TYPE_ENUM.REFRESH, user.role],
                expiresIn: "365d",
                jwtid,
            },
        });
        return { accessToken, refreshToken };
    }
    revokeTokenKey({ userId, jti, }) {
        return `REVOKED:${userId}:${jti}`;
    }
}
exports.TokenService = TokenService;
