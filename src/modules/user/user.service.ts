import { HydratedDocument } from "mongoose";
import { IUser } from "../../common/interface";
import { redisService, RedisService } from "../../common/service";
import { userRepository } from "../../DB/repository";
import { TokenService } from "../../common/service/token.service";
import {
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/domain.exception";
import { logoutEnum, TokenTypeEnum } from "../../common/enum";
import { comapareeHash, generateHash } from "../../common/utils/security";
import { otpEmailTemplate, sendEmail } from "../../common/utils/mailer";

class userService {
  private readonly userModel: userRepository;
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;
  constructor() {
    this.userModel = new userRepository();
    this.redis = redisService;
    this.tokenService = new TokenService();
  }

  async profile(user: HydratedDocument<IUser>): Promise<any> {
    return user;
  }

  async rotateToken(
    user: HydratedDocument<IUser>,
    issuer: string,
    { jti, iat, sub }: { jti: string; iat: number; sub: string }
  ) {
    if ((iat + 60 * 60 * 24 * 365) * 1000 >= Date.now() + 5 * 60 * 1000) {
      throw new ConflictException("Current access token still valid");
    }
    await this.tokenService.createRevokeToken({
      userId: sub,
      jti,
      ttl: iat + 60 * 60 * 24 * 365,
    });
    return await this.tokenService.createLoginCredentials(user, issuer);
  }

  public async logout(
    flag: number,
    user: HydratedDocument<IUser>,
    { jti, iat, sub }: { jti: string; iat: number; sub: string }
  ) {
    // console.log({ jti, iat });
    let status = 200;
    // console.log({ sub });

    switch (flag) {
      case logoutEnum.All:
        user.changeCreadintialTime = new Date();
        await user.save();
        const tokenkeys = await this.redis.allKeysByPrefix(
          this.redis.baseRevokeTokenKey(sub)
        );
        // console.log({ tokenkeys });
        if (tokenkeys.length) {
          await this.redis.deleteKey(tokenkeys);
        }
        break;
      default:
        // console.log({ fun: allKeysByPrefix(baseRevokeTokenKey(sub)) });
        // console.log({ sub });
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

  public async updatePassword(
    { oldPassword, newPassword }: { oldPassword: string; newPassword: string },
    user: HydratedDocument<IUser>,
    issuer: string
  ) {
    if (
      !(await comapareeHash({
        plainText: oldPassword,
        ciphetText: user.password,
      }))
    ) {
      throw new ConflictException("invalid old password");
    }
    user.password = await generateHash({ plainText: newPassword });
    user.changeCreadintialTime = new Date();
    await user.save();
    await this.redis.deleteKey(
      await this.redis.allKeysByPrefix(this.redis.baseRevokeTokenKey(user._id))
    );
    return await this.tokenService.createLoginCredentials(user, issuer);
  }
}

export default new userService();
