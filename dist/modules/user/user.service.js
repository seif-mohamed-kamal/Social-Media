"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = require("../../common/service");
const repository_1 = require("../../DB/repository");
const token_service_1 = require("../../common/service/token.service");
const domain_exception_1 = require("../../common/exceptions/domain.exception");
const enum_1 = require("../../common/enum");
const security_1 = require("../../common/utils/security");
class userService {
    userModel;
    redis;
    tokenService;
    constructor() {
        this.userModel = new repository_1.userRepository();
        this.redis = service_1.redisService;
        this.tokenService = new token_service_1.TokenService();
    }
    async profile(user) {
        return user;
    }
    async rotateToken(user, issuer, { jti, iat, sub }) {
        if ((iat + 60 * 60 * 24 * 365) * 1000 >= Date.now() + 5 * 60 * 1000) {
            throw new domain_exception_1.ConflictException("Current access token still valid");
        }
        await this.tokenService.createRevokeToken({
            userId: sub,
            jti,
            ttl: iat + 60 * 60 * 24 * 365,
        });
        return await this.tokenService.createLoginCredentials(user, issuer);
    }
    async logout(flag, user, { jti, iat, sub }) {
        let status = 200;
        switch (flag) {
            case enum_1.logoutEnum.All:
                user.changeCreadintialTime = new Date();
                await user.save();
                const tokenkeys = await this.redis.allKeysByPrefix(this.redis.baseRevokeTokenKey(sub));
                if (tokenkeys.length) {
                    await this.redis.deleteKey(tokenkeys);
                }
                break;
            default:
                await this.tokenService.createRevokeToken({
                    userId: sub,
                    jti,
                    ttl: iat + 60 * 60 * 24 * 365,
                });
                status = 201;
                break;
        }
        return status;
    }
    async updatePassword({ oldPassword, newPassword }, user, issuer) {
        if (!(await (0, security_1.comapareeHash)({
            plainText: oldPassword,
            ciphetText: user.password,
        }))) {
            throw new domain_exception_1.ConflictException("invalid old password");
        }
        user.password = await (0, security_1.generateHash)({ plainText: newPassword });
        user.changeCreadintialTime = new Date();
        await user.save();
        await this.redis.deleteKey(await this.redis.allKeysByPrefix(this.redis.baseRevokeTokenKey(user._id)));
        return await this.tokenService.createLoginCredentials(user, issuer);
    }
}
exports.default = new userService();
