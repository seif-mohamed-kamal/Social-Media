"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const domain_exception_1 = require("../../common/exceptions/domain.exception");
const repository_1 = require("../../DB/repository");
const security_1 = require("../../common/utils/security");
const mailer_1 = require("../../common/utils/mailer");
const service_1 = require("../../common/service");
const enum_1 = require("../../common/enum");
const event_mailer_1 = require("../../common/utils/mailer/event.mailer");
const token_service_1 = require("../../common/service/token.service");
class AuthinticationService {
    userModel;
    redis;
    tokenService;
    constructor() {
        this.userModel = new repository_1.userRepository();
        this.redis = service_1.redisService;
        this.tokenService = new token_service_1.TokenService();
    }
    async sendEmailOtp({ email, subject, }) {
        const isOtpExists = await this.redis.get(this.redis.redisOtp({ email, subject }));
        if (isOtpExists) {
            throw new domain_exception_1.BadRequestException(`sorry you already have an OTP please check your email`);
        }
        const isBlockedTTL = await this.redis.ttl(this.redis.blockUser({ email, subject }));
        if (isBlockedTTL == -1) {
            throw new domain_exception_1.BadRequestException(`sorry you are blocked please try again after ${isBlockedTTL}`);
        }
        const maxTrails = await this.redis.get(this.redis.maxAttemptOtp({ email, subject }));
        if (maxTrails >= 3) {
            await this.redis.set({
                key: this.redis.blockUser({ email, subject }),
                value: 1,
                ttl: 5 * 60,
            });
            throw new domain_exception_1.BadRequestException(`sorry you reached the max trials please try again after 5 minutes`);
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        event_mailer_1.emitEmail.emit("sendEmail", async () => {
            await (0, mailer_1.sendEmail)({
                to: email,
                cc: email,
                subject,
                html: (0, mailer_1.otpEmailTemplate)({ otp, subject }),
            });
            await this.redis.incr(this.redis.maxAttemptOtp({ email, subject }));
        });
        const hashOtp = await (0, security_1.generateHash)({ plainText: otp });
        await this.redis.set({
            key: this.redis.redisOtp({ email, subject }),
            value: hashOtp,
            ttl: 120,
        });
    }
    async signup(inputs) {
        4;
        const { email, username, password, phone } = inputs;
        const checkEmail = await this.userModel.findOne({
            filter: { email },
        });
        console.log({ checkEmail });
        if (checkEmail) {
            throw new domain_exception_1.ConflictException("Dublicated Email");
        }
        const result = await this.userModel.createOne({
            data: {
                email,
                phone: await (0, security_1.generateEncrypt)(phone),
                password: await (0, security_1.generateHash)({ plainText: password }),
                username,
            },
        });
        if (!result) {
            throw new domain_exception_1.BadRequestException("FAIL TO SAVE USER");
        }
        await this.sendEmailOtp({ email, subject: enum_1.emailEnum.CONFIRM_EMAIL });
        await this.redis.set({
            key: this.redis.maxAttemptOtp({ email }),
            value: 0,
            ttl: 360,
        });
        return result.toJSON();
    }
    async cofirmEmail({ email, otp }) {
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                provider: enum_1.ProviderEnum.SYSTEM,
            },
        });
        if (!user) {
            throw new domain_exception_1.NotFoundException("user not found or you elready vetified your account");
        }
        const hashOtp = await this.redis.get(this.redis.redisOtp({ email, subject: enum_1.emailEnum.CONFIRM_EMAIL }));
        if (!hashOtp) {
            throw new domain_exception_1.NotFoundException("OTP Expired");
        }
        if (!(await (0, security_1.comapareeHash)({ plainText: otp, ciphetText: hashOtp }))) {
            throw new domain_exception_1.ConflictException("Invalid OTP");
        }
        user.confirmEmail = new Date();
        await user.save();
        await this.redis.deleteKey(await this.redis.allKeysByPrefix(this.redis.redisOtp({ email, subject: enum_1.emailEnum.CONFIRM_EMAIL })));
        return true;
    }
    async resendConfirmEmail({ email }) {
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                provider: enum_1.ProviderEnum.SYSTEM,
            },
        });
        if (!user) {
            throw new domain_exception_1.NotFoundException("user not found or you elready vetified your account");
        }
        await this.sendEmailOtp({ email, subject: enum_1.emailEnum.CONFIRM_EMAIL });
        return true;
    }
    async login(inputs, issuer) {
        const { email, password } = inputs;
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmail: { $exists: true },
                provider: enum_1.ProviderEnum.SYSTEM,
            },
        });
        if (!user) {
            throw new domain_exception_1.NotFoundException("Invalid login credintials");
        }
        const isBlockedTTL = await this.redis.ttl(this.redis.blockUser({ email, subject: enum_1.emailEnum.LOGIN_ATTEMPT }));
        if (isBlockedTTL > 0) {
            throw new domain_exception_1.BadRequestException(`sorry you are blocked please try again after ${isBlockedTTL}`);
        }
        if (!(await this.redis.get(this.redis.maxAttemplogin({ email, subject: enum_1.emailEnum.LOGIN_ATTEMPT })))) {
            await this.redis.set({
                key: this.redis.maxAttemplogin({
                    email,
                    subject: enum_1.emailEnum.LOGIN_ATTEMPT,
                }),
                value: 0,
                ttl: 600,
            });
        }
        const maxTrails = await this.redis.get(this.redis.maxAttemplogin({ email, subject: enum_1.emailEnum.LOGIN_ATTEMPT }));
        if (maxTrails >= 5) {
            await this.redis.set({
                key: this.redis.blockUser({ email, subject: enum_1.emailEnum.LOGIN_ATTEMPT }),
                value: 1,
                ttl: 5 * 60
            });
            throw new domain_exception_1.BadRequestException(`sorry you reached the max trials please try again after 5 minutes`);
        }
        if (!(await (0, security_1.comapareeHash)({ plainText: password, ciphetText: user.password }))) {
            await this.redis.incr(this.redis.maxAttemplogin({ email, subject: enum_1.emailEnum.LOGIN_ATTEMPT }));
            throw new domain_exception_1.NotFoundException("Invalid login credintials");
        }
        const maxAttemp = await this.redis.allKeysByPrefix(this.redis.maxAttemplogin({ email, subject: enum_1.emailEnum.LOGIN_ATTEMPT }));
        await this.redis.deleteKey(maxAttemp);
        return await this.tokenService.createLoginCredentials(user, issuer);
    }
}
exports.default = new AuthinticationService();
