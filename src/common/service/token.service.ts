import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { userRepository } from "../../DB/repository";
import { redisService, RedisService } from "./redis.service";
import {
  JWT_SECRET,
  JWT_SECRET_ADMIN,
  JWT_SECRET_ADMIN_refresh,
  JWT_SECRET_refresh,
  JWT_SECRET_RESET,
} from "../../config/config.service";
import { HydratedDocument, Types } from "mongoose";
import { IUser } from "../interface";
import { RoleEnum, TokenTypeEnum } from "../enum";


export class TokenService {
  private readonly userModel: userRepository;
  private readonly redis: RedisService;

  constructor() {
    this.userModel = new userRepository();
    this.redis = redisService;
  }

  private async generateToken({
    payload,
    secret,
    options = {},
  }: {
    payload: object;
    secret: string;
    options?: SignOptions;
  }): Promise<string> {
    return jwt.sign(payload, secret, options);
  }

  private async verifyToken({
    token,
    secret,
  }: {
    token: string;
    secret: string;
  }): Promise<JwtPayload> {
    return jwt.verify(token, secret) as JwtPayload;
  }

  private async detectRole(role: RoleEnum ) {
    switch (role) {
      case RoleEnum.ADMIN:
        return {
          accessSignature: JWT_SECRET_ADMIN,
          refreshSignature: JWT_SECRET_ADMIN_refresh,
          resetSignature: JWT_SECRET_RESET,
        };

      default:
        return {
          accessSignature: JWT_SECRET,
          refreshSignature: JWT_SECRET_refresh,
          resetSignature: JWT_SECRET_RESET,
        };
    }
  }

  private async generateTokenSignature({
    tokenType = TokenTypeEnum.ACCESS,
    level,
  }: {
    tokenType?: TokenTypeEnum;
    level: RoleEnum;
  }): Promise<string> {
    const { accessSignature, refreshSignature, resetSignature } =
      await this.detectRole(level);

    switch (tokenType) {
      case TokenTypeEnum.REFRESH:
        return refreshSignature as string;

      case TokenTypeEnum.RESET:
        return resetSignature as string;

      default:
        return accessSignature as string;
    }
  }

  public async decodeToken({
    token,
    tokenType = TokenTypeEnum.ACCESS,
  }: {
    token: string;
    tokenType?: TokenTypeEnum;
  }) {
    const decoded = jwt.decode(token);

    if (!decoded) {
      throw new Error("Invalid token");
    }

    const decodedToken = decoded as JwtPayload;

    const [tokenApproach, level] = decodedToken.aud as [
      TokenTypeEnum,
      RoleEnum
    ];

    if (tokenType !== tokenApproach) {
      throw new Error("Unexpected token type");
    }

    const secret = await this.generateTokenSignature({
      tokenType: tokenApproach,
      level,
    });

    if (
      decodedToken.jti &&
      (await this.redis.get(
        this.redis.revokeTokenKey({
          userId: decodedToken.sub as string,
          jti: decodedToken.jti,
        })
      ))
    ) {
      throw new Error("Token revoked");
    }

    const verifiedData = await this.verifyToken({ token, secret });

    const user = await this.userModel.findOne({
      filter: { _id: verifiedData.sub },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (
      user.changeCreadintialTime &&
      verifiedData.iat &&
      user.changeCreadintialTime.getTime() > verifiedData.iat * 1000
    ) {
      throw new Error("Token expired due to credential change");
    }

    return { user, decodedToken: verifiedData };
  }

  public async createLoginCredentials(
    user: HydratedDocument<IUser>,
    issuer: string,
    tokenType?: TokenTypeEnum
  ) {
    const jwtid = randomUUID();

    if (tokenType === TokenTypeEnum.RESET) {
      return this.generateToken({
        payload: { sub: user._id },
        secret: JWT_SECRET_RESET as string,
        options: {
          audience: [TokenTypeEnum.RESET, user.role as unknown as string],
          expiresIn: "15m",
          jwtid,
        },
      });
    }

    const { accessSignature, refreshSignature } = await this.detectRole(user.role );

    const accessToken = await this.generateToken({
      payload: { sub: user._id },
      secret: accessSignature as string,
      options: {
        issuer,
        audience: [TokenTypeEnum.ACCESS, user.role as unknown as string],
        expiresIn: "30m",
        jwtid,
      },
    });

    const refreshToken = await this.generateToken({
      payload: { sub: user._id },
      secret: refreshSignature as string,
      options: {
        issuer,
        audience: [TokenTypeEnum.REFRESH, user.role as unknown as string],
        expiresIn: "365d",
        jwtid,
      },
    });

    return { accessToken, refreshToken };
  }

  public async createRevokeToken ({ userId, jti, ttl } : {userId:Types.ObjectId | string , jti:string , ttl:number}) {
    // console.log(revokeTokenKey({ userId, jti }));
    // console.log({ userId, jti, ttl });
    await this.redis.set({key:this.redis.revokeTokenKey({ userId, jti }), value:jti, ttl:ttl});
    return;
  };
}
