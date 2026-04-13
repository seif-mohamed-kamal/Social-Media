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
import { HydratedDocument } from "mongoose";
import { IUser } from "../interface";

// ===== ENUMS =====
export enum TOKEN_TYPE_ENUM {
  ACCESS = "access",
  REFRESH = "refresh",
  RESET = "reset",
}

export enum ROLE_ENUM {
  USER = "user",
  ADMIN = "admin",
}

// ===== SERVICE =====
export class TokenService {
  private readonly userModel: userRepository;
  private readonly redis: RedisService;

  constructor() {
    this.userModel = new userRepository();
    this.redis = redisService;
  }

  // ================= GENERATE TOKEN =================
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

  // ================= VERIFY TOKEN =================
  private async verifyToken({
    token,
    secret,
  }: {
    token: string;
    secret: string;
  }): Promise<JwtPayload> {
    return jwt.verify(token, secret) as JwtPayload;
  }

  // ================= DETECT ROLE =================
  private async detectRole(role: ROLE_ENUM) {
    switch (role) {
      case ROLE_ENUM.ADMIN:
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

  // ================= GENERATE SIGNATURE =================
  private async generateTokenSignature({
    tokenType = TOKEN_TYPE_ENUM.ACCESS,
    level,
  }: {
    tokenType?: TOKEN_TYPE_ENUM;
    level: ROLE_ENUM;
  }): Promise<string> {
    const { accessSignature, refreshSignature, resetSignature } =
      await this.detectRole(level);

    switch (tokenType) {
      case TOKEN_TYPE_ENUM.REFRESH:
        return refreshSignature as string;

      case TOKEN_TYPE_ENUM.RESET:
        return resetSignature as string;

      default:
        return accessSignature as string;
    }
  }

  // ================= DECODE TOKEN =================
  public async decodeToken({
    token,
    tokenType = TOKEN_TYPE_ENUM.ACCESS,
  }: {
    token: string;
    tokenType?: TOKEN_TYPE_ENUM;
  }) {
    const decoded = jwt.decode(token);

    if (!decoded) {
      throw new Error("Invalid token");
    }

    const decodedToken = decoded as JwtPayload;

    const [tokenApproach, level] = decodedToken.aud as [
      TOKEN_TYPE_ENUM,
      ROLE_ENUM
    ];

    // ✅ Validate token type
    if (tokenType !== tokenApproach) {
      throw new Error("Unexpected token type");
    }

    // ✅ Get correct secret
    const secret = await this.generateTokenSignature({
      tokenType: tokenApproach,
      level,
    });

    // ✅ Check revoked token
    if (
      decodedToken.jti &&
      (await this.redis.get(
        this.revokeTokenKey({
          userId: decodedToken.sub as string,
          jti: decodedToken.jti,
        })
      ))
    ) {
      throw new Error("Token revoked");
    }

    // ✅ Verify token
    const verifiedData = await this.verifyToken({ token, secret });

    // ✅ Get user
    const user = await this.userModel.findOne({
      filter: { _id: verifiedData.sub },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // ✅ Fix typo: changeCreadintialTime → changeCredentialsTime
    if (
      user.changeCreadintialTime &&
      verifiedData.iat &&
      user.changeCreadintialTime.getTime() >
        verifiedData.iat * 1000
    ) {
      throw new Error("Token expired due to credential change");
    }

    return { user, decodedToken: verifiedData };
  }

  // ================= CREATE TOKENS =================
  public async createLoginCredentials(
    user: HydratedDocument<IUser>,
    issuer: string,
    tokenType?: TOKEN_TYPE_ENUM
  ) {
    const jwtid = randomUUID(); 

    // ✅ RESET TOKEN
    if (tokenType === TOKEN_TYPE_ENUM.RESET) {
      return this.generateToken({
        payload: { sub: user._id },
        secret: JWT_SECRET_RESET as string,
        options: {
          audience: [TOKEN_TYPE_ENUM.RESET, user.role],
          expiresIn: "15m",
          jwtid,
        },
      });
    }

    const { accessSignature, refreshSignature } =
      await this.detectRole(user.role);

    // ✅ ACCESS TOKEN
    const accessToken = await this.generateToken({
      payload: { sub: user._id },
      secret: accessSignature as string,
      options: {
        issuer,
        audience: [TOKEN_TYPE_ENUM.ACCESS, user.role],
        expiresIn: "30m",
        jwtid,
      },
    });

    // ✅ REFRESH TOKEN
    const refreshToken = await this.generateToken({
      payload: { sub: user._id },
      secret: refreshSignature as string,
      options: {
        issuer,
        audience: [TOKEN_TYPE_ENUM.REFRESH, user.role],
        expiresIn: "365d",
        jwtid,
      },
    });

    return { accessToken, refreshToken };
  }

  // ================= REVOKE KEY =================
  private revokeTokenKey({
    userId,
    jti,
  }: {
    userId: string;
    jti: string;
  }) {
    return `REVOKED:${userId}:${jti}`;
  }
}

