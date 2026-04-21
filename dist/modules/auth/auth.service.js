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
const google_auth_library_1 = require("google-auth-library");
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
                phone,
                password,
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
                ttl: 5 * 60,
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
    async verifyGoogleAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: "920851061985-v8jgoddrenaodbku25tfadgg4a83qs43.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();
        return payload;
    }
    async signupWithGmail(idToken, issuer) {
        const payload = (await this.verifyGoogleAccount(idToken));
        const checkEmailExist = await this.userModel.findOne({
            filter: { email: payload.email },
        });
        if (checkEmailExist) {
            if (checkEmailExist.provider != enum_1.ProviderEnum.GOOGLE) {
                throw new domain_exception_1.ConflictException("invalid login provider");
            }
            return {
                status: 200,
                credintials: await this.loginWithGmail(idToken, issuer),
            };
        }
        const user = await this.userModel.createOne({
            data: {
                firstName: payload.given_name,
                lastName: payload.family_name,
                email: payload.email,
                profilePicture: payload.picture,
                provider: enum_1.ProviderEnum.GOOGLE,
            },
        });
        return {
            status: 201,
            credintials: await this.tokenService.createLoginCredentials(user, issuer),
        };
    }
    async loginWithGmail(idToken, issuer) {
        console.log(idToken);
        const payload = (await this.verifyGoogleAccount(idToken));
        console.log(payload);
        const user = await this.userModel.findOne({
            filter: { email: payload.email, provider: enum_1.ProviderEnum.GOOGLE },
        });
        console.log(user);
        if (!user) {
            throw new domain_exception_1.NotFoundException("user Not registred");
        }
        return await this.tokenService.createLoginCredentials(user, issuer);
    }
    async forgetPassword({ email }) {
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmail: { $exists: true },
                provider: enum_1.ProviderEnum.SYSTEM,
            },
        });
        if (!user) {
            throw new domain_exception_1.NotFoundException("user not found");
        }
        if (!(await this.redis.get(this.redis.maxAttemptOtp({ email, subject: enum_1.emailEnum.FORGET_PASSWORD })))) {
            await this.redis.set({
                key: this.redis.maxAttemptOtp({ email, subject: enum_1.emailEnum.FORGET_PASSWORD }),
                value: 0,
                ttl: 360
            });
        }
        await this.sendEmailOtp({ email, subject: enum_1.emailEnum.FORGET_PASSWORD });
        return true;
    }
    ;
    async verifyForgetPasswordOtp({ email, otp }) {
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmail: { $exists: true },
                provider: enum_1.ProviderEnum.SYSTEM,
            },
        });
        if (!user) {
            throw new domain_exception_1.NotFoundException("user not found or you elready vetified your account");
        }
        const hashOtp = await this.redis.get(this.redis.redisOtp({ email, subject: enum_1.emailEnum.FORGET_PASSWORD }));
        if (!hashOtp) {
            throw new domain_exception_1.NotFoundException("OTP Expired");
        }
        if (!(await (0, security_1.comapareeHash)({ plainText: otp, ciphetText: hashOtp }))) {
            throw new domain_exception_1.ConflictException("Invalid OTP");
        }
        return true;
    }
    ;
    async resetPassword({ email, otp, password }) {
        await this.verifyForgetPasswordOtp({ email, otp });
        const user = await this.userModel.updateOne({
            filter: {
                email,
                confirmEmail: { $exists: true },
                provider: enum_1.ProviderEnum.SYSTEM,
            },
            update: {
                password: await (0, security_1.generateHash)({ plainText: password }),
                changeCredentialsTime: new Date(),
            },
        });
        console.log({ usercont: user.matchedCount });
        if (!user.matchedCount) {
            throw new domain_exception_1.NotFoundException("User Not Found");
        }
        const tokenKeys = await this.redis.allKeysByPrefix(this.redis.redisOtp({ email, subject: enum_1.emailEnum.FORGET_PASSWORD }));
        await this.redis.deleteKey(tokenKeys);
        return true;
    }
    ;
}
exports.default = new AuthinticationService();
