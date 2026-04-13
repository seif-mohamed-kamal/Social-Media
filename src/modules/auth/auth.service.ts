import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interface";
import {
  confurmEmailDto,
  loginDto,
  resendConfirmEmailDto,
  signupDto,
} from "./auth.dto";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/domain.exception";
import { userRepository } from "../../DB/repository";
import {
  comapareeHash,
  generateEncrypt,
  generateHash,
} from "../../common/utils/security";
import { otpEmailTemplate, sendEmail } from "../../common/utils/mailer";
import { RedisService, redisService } from "../../common/service";
import { emailEnum, ProviderEnum } from "../../common/enum";
import { emitEmail } from "../../common/utils/mailer/event.mailer";
import { TokenService } from "../../common/service/token.service";

class AuthinticationService {
  private readonly userModel: userRepository;
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;

  constructor() {
    this.userModel = new userRepository();
    this.redis = redisService;
  this.tokenService = new TokenService();

  }

  private async sendEmailOtp({
    email,
    subject,
  }: {
    email: string;
    subject: emailEnum;
  }) {
    const isOtpExists = await this.redis.get(
      this.redis.redisOtp({ email, subject })
    );
    if (isOtpExists) {
      throw new BadRequestException(
        `sorry you already have an OTP please check your email`
      );
    }
    const isBlockedTTL = await this.redis.ttl(
      this.redis.blockUser({ email, subject })
    );
    if (isBlockedTTL == -1) {
      throw new BadRequestException(
        `sorry you are blocked please try again after ${isBlockedTTL}`
      );
    }

    const maxTrails = await this.redis.get(
      this.redis.maxAttemptOtp({ email, subject })
    );
    // console.log({ maxTrails });
    if (maxTrails >= 3) {
      await this.redis.set({
        key: this.redis.blockUser({ email, subject }),
        value: 1,
        ttl: 5 * 60,
      });
      throw new BadRequestException(
        `sorry you reached the max trials please try again after 5 minutes`
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    emitEmail.emit("sendEmail", async () => {
      await sendEmail({
        to: email,
        cc: email,
        subject,
        html: otpEmailTemplate({ otp, subject }),
      });
      await this.redis.incr(this.redis.maxAttemptOtp({ email, subject }));
    });

    const hashOtp = await generateHash({ plainText: otp });
    await this.redis.set({
      key: this.redis.redisOtp({ email, subject }),
      value: hashOtp,
      ttl: 120,
    });
  }

  public async signup(inputs: signupDto): Promise<IUser> {
    4;
    const { email, username, password, phone } = inputs;
    const checkEmail = await this.userModel.findOne({
      filter: { email },
      // projection:"email",
      // options:{lean:true}
    });
    console.log({ checkEmail });
    if (checkEmail) {
      throw new ConflictException("Dublicated Email");
    }
    const result: HydratedDocument<IUser> = await this.userModel.createOne({
      data: {
        email,
        phone: await generateEncrypt(phone),
        password: await generateHash({ plainText: password }),
        username,
      },
    });
    if (!result) {
      throw new BadRequestException("FAIL TO SAVE USER");
    }
    await this.sendEmailOtp({ email, subject: emailEnum.CONFIRM_EMAIL });
    await this.redis.set({
      key: this.redis.maxAttemptOtp({ email }),
      value: 0,
      ttl: 360,
    });
    return result.toJSON();
  }

  async cofirmEmail({ email, otp }: confurmEmailDto) {
    const user = await this.userModel.findOne({
      filter: {
        email,
        confirmEmail: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    });

    if (!user) {
      throw new NotFoundException(
        "user not found or you elready vetified your account"
      );
    }

    const hashOtp = await this.redis.get(
      this.redis.redisOtp({ email, subject: emailEnum.CONFIRM_EMAIL })
    );
    if (!hashOtp) {
      throw new NotFoundException("OTP Expired");
    }

    if (!(await comapareeHash({ plainText: otp, ciphetText: hashOtp }))) {
      throw new ConflictException("Invalid OTP");
    }

    user.confirmEmail = new Date();
    await user.save();
    await this.redis.deleteKey(
      await this.redis.allKeysByPrefix(
        this.redis.redisOtp({ email, subject: emailEnum.CONFIRM_EMAIL })
      )
    );
    // await this.redis.deleteKey(await this.redis.allKeysByPrefix(this.redis.unconfirmedUser(email)));
    return true;
  }

  async resendConfirmEmail({ email }: resendConfirmEmailDto) {
    const user = await this.userModel.findOne({
      filter: {
        email,
        confirmEmail: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    });

    if (!user) {
      throw new NotFoundException(
        "user not found or you elready vetified your account"
      );
    }
    await this.sendEmailOtp({ email, subject: emailEnum.CONFIRM_EMAIL });

    return true;
  }

  public async login(inputs: loginDto, issuer: string) {
    const { email, password } = inputs;
    const user = await this.userModel.findOne({
      filter: {
        email,
        confirmEmail: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!user) {
      throw new NotFoundException("Invalid login credintials");
    }

    const isBlockedTTL = await this.redis.ttl(
      this.redis.blockUser({ email, subject: emailEnum.LOGIN_ATTEMPT })
    );
    if (isBlockedTTL > 0) {
      throw new BadRequestException(
        `sorry you are blocked please try again after ${isBlockedTTL}`
      );
    }

    if (
      !(await this.redis.get(
        this.redis.maxAttemplogin({ email, subject: emailEnum.LOGIN_ATTEMPT })
      ))
    ) {
      await this.redis.set({
        key: this.redis.maxAttemplogin({
          email,
          subject: emailEnum.LOGIN_ATTEMPT,
        }),
        value: 0,
        ttl: 600,
      });
    }

    const maxTrails = await this.redis.get(
      this.redis.maxAttemplogin({ email, subject: emailEnum.LOGIN_ATTEMPT })
    );
    // console.log({ maxTrails });
    if (maxTrails >= 5) {
      await this.redis.set({
        key:this.redis.blockUser({ email, subject: emailEnum.LOGIN_ATTEMPT }),
        value:1,
        ttl:5 * 60
    });
      throw new BadRequestException(`sorry you reached the max trials please try again after 5 minutes`,);
    }

    if (
      !(await comapareeHash({ plainText: password,  ciphetText: user.password }))
    ) {
      await this.redis.incr(this.redis.maxAttemplogin({ email, subject: emailEnum.LOGIN_ATTEMPT }));
      throw new NotFoundException( "Invalid login credintials" );
    }
    const maxAttemp = await this.redis.allKeysByPrefix(
      this.redis.maxAttemplogin({ email, subject: emailEnum.LOGIN_ATTEMPT })
    );

    await this.redis.deleteKey(maxAttemp);
    return await this.tokenService.createLoginCredentials(user, issuer);
  }
}
export default new AuthinticationService();
