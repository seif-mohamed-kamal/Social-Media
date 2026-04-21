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
  generateHash,
} from "../../common/utils/security";
import { otpEmailTemplate, sendEmail } from "../../common/utils/mailer";
import { RedisService, redisService } from "../../common/service";
import { emailEnum, ProviderEnum } from "../../common/enum";
import { emitEmail } from "../../common/utils/mailer/event.mailer";
import { TokenService } from "../../common/service/token.service";
import { OAuth2Client } from "google-auth-library";

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
        phone,
        password,
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
        key: this.redis.blockUser({ email, subject: emailEnum.LOGIN_ATTEMPT }),
        value: 1,
        ttl: 5 * 60,
      });
      throw new BadRequestException(
        `sorry you reached the max trials please try again after 5 minutes`
      );
    }

    if (
      !(await comapareeHash({ plainText: password, ciphetText: user.password }))
    ) {
      await this.redis.incr(
        this.redis.maxAttemplogin({ email, subject: emailEnum.LOGIN_ATTEMPT })
      );
      throw new NotFoundException("Invalid login credintials");
    }
    const maxAttemp = await this.redis.allKeysByPrefix(
      this.redis.maxAttemplogin({ email, subject: emailEnum.LOGIN_ATTEMPT })
    );

    await this.redis.deleteKey(maxAttemp);
    return await this.tokenService.createLoginCredentials(user, issuer);
  }

  private async verifyGoogleAccount(idToken: string) {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience:
        "920851061985-v8jgoddrenaodbku25tfadgg4a83qs43.apps.googleusercontent.com", // Specify the WEB_CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    // console.log(payload);
    return payload;
  }

  public async signupWithGmail(idToken: string, issuer: string) {
    // console.log(idToken);
    const payload = (await this.verifyGoogleAccount(idToken)) as any;
    // console.log(payload);

    const checkEmailExist = await this.userModel.findOne({
      filter: { email: payload.email as string },
    });
    if (checkEmailExist) {
      if (checkEmailExist.provider != ProviderEnum.GOOGLE) {
        throw new ConflictException("invalid login provider");
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
        provider: ProviderEnum.GOOGLE,
      },
    });
    return {
      status: 201,
      credintials: await this.tokenService.createLoginCredentials(user, issuer),
    };
  }

  public async loginWithGmail(idToken: string, issuer: string) {
    console.log(idToken);
    const payload = (await this.verifyGoogleAccount(idToken)) as any;
    console.log(payload);

    const user = await this.userModel.findOne({
      filter: { email: payload.email as string, provider: ProviderEnum.GOOGLE },
    });
    console.log(user);
    if (!user) {
      throw new NotFoundException("user Not registred");
    }

    return await this.tokenService.createLoginCredentials(user, issuer);
  }

  public async forgetPassword  ({email}:{email:string})  {
    const user = await this.userModel.findOne({
      filter: {
        email,
        confirmEmail: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
    });
  
    if (!user) {
      throw new NotFoundException( "user not found",);
    }
    if (
      !(await this.redis.get(this.redis.maxAttemptOtp({ email, subject: emailEnum.FORGET_PASSWORD })))
    ) {
      await this.redis.set({
        key:this.redis.maxAttemptOtp({ email, subject: emailEnum.FORGET_PASSWORD }),
        value:0,
        ttl:360
    });
    }
    await this.sendEmailOtp({ email, subject: emailEnum.FORGET_PASSWORD });
  
    return true;
  };
  
  public async verifyForgetPasswordOtp  ({email , otp}:{email:string , otp:string}) {
    const user = await this.userModel.findOne({
      filter: {
        email,
        confirmEmail: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
    });
  
    if (!user) {
      throw new NotFoundException( "user not found or you elready vetified your account",);
    }
  
    const hashOtp = await this.redis.get(
      this.redis.redisOtp({ email, subject: emailEnum.FORGET_PASSWORD })
    );
    if (!hashOtp) {
      throw new NotFoundException( "OTP Expired" );
    }
  
    if (!(await comapareeHash({ plainText: otp, ciphetText: hashOtp }))) {
      throw new ConflictException( "Invalid OTP" );
    }
  
    return true;
  };
  
  public async resetPassword  ({email , otp , password}:{email:string , otp:string , password:string})  {
  
    await this.verifyForgetPasswordOtp({ email,otp });
  
    const user = await this.userModel.updateOne({
      filter: {
        email,
        confirmEmail: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
      update: {
        password: await generateHash({ plainText: password }),
        changeCredentialsTime: new Date(),
      },
    });
    // console.log({ user : user.password });
    console.log({ usercont: user.matchedCount });
    if (!user.matchedCount) {
      throw new NotFoundException( "User Not Found" );
    }
    const tokenKeys = await this.redis.allKeysByPrefix(
      this.redis.redisOtp({ email, subject: emailEnum.FORGET_PASSWORD })
    );
    await this.redis.deleteKey(tokenKeys);
    return true;
  };
}
export default new AuthinticationService();
