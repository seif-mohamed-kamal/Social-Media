import { createClient, RedisClientType } from "redis";
import { REDIS_URI } from "../../config/config.service";
import { Types } from "mongoose";
import { emailEnum } from "../enum";

export class RedisService {
  private readonly client: RedisClientType;
  constructor() {
    this.client = createClient({ url: REDIS_URI });
    this.handleError();
  }

  private handleError() {
    this.client.on("error", (error) => {
      console.log(`Redis Error ---- ${error}`);
    });
    this.client.on("reedy", () => {
      console.log(`Redis Error`);
    });
  }

  public async connectToRedis() {
    await this.client.connect();
    console.log("Redis connected successfully👌");
  }

  public baseRevokeTokenKey(userId: string | Types.ObjectId) {
    return `user:RevokeToken:${userId}`;
  }

  public resetTokenKey(email: string) {
    return `user:resetToken:${email}`;
  }

  public unconfirmedUser(email: string) {
    return `${this.baseUnconfirmedUser()}:${email}`;
  }

  public baseUnconfirmedUser() {
    return "user:unconfirmedUser";
  }

  public revokeTokenKey({
    userId,
    jti,
  }: {
    userId: string | Types.ObjectId;
    jti: string;
  }) {
    return `${this.baseRevokeTokenKey(userId)}:${jti}`;
  }

  public redisOtp({
    email,
    subject = emailEnum.CONFIRM_EMAIL,
  }: {
    email: string;
    subject: emailEnum;
  }):string{
    return `OTP:Code:${email}:${subject}`;
  }

  public maxAttemptOtp({
    email,
    subject = emailEnum.CONFIRM_EMAIL,
  }: {
    email: string;
    subject?: emailEnum;
  }) {
    return `${this.redisOtp({ email, subject })}:maxAttempt`;
  }

  public  blockUser({
    email,
    subject = emailEnum.CONFIRM_EMAIL,
  }: {
    email: string;
    subject: emailEnum;
  }) {
    return `${this.redisOtp({ email, subject })}:blockUser`;
  }

  public  maxAttemplogin({
    email,
    subject = emailEnum.LOGIN_ATTEMPT,
  }: {
    email: string;
    subject: emailEnum;
  }) {
    return `${this.redisOtp({ email, subject })}:maxAttempt`;
  }

  public async set({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: any;
    ttl?: number | undefined;
  }) {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);

      if (ttl && Number.isInteger(ttl)) {
        // TTL in seconds
        await this.client.setEx(key, ttl, data);
      } else {
        await this.client.set(key, data);
      }
      return true;
    } catch (error) {
      console.error("Redis SET error:", error);
      return false;
    }
  }
  public async get(key: string) {
    try {
      const data = await this.client.get(key);
      if (!data) return null;

      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch (error) {
      console.error("Redis GET error:", error);
      return null;
    }
  }

  public async update({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string ;
    ttl?: number | undefined;
  }) {
    try {
      const exists = await this.client.exists(key);
      if (!exists) return false;
      return await this.set({key, value, ttl});
    } catch (error) {
      console.error("Redis UPDATE error:", error);
      return false;
    }
  }

  public async deleteKey(key: string | string[]) {
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error("Redis DELETE error:", error);
      return false;
    }
  }

  public async expire({ key, ttl }: { key: string; ttl: number }) {
    try {
      const result = await this.client.expire(key, ttl);
      return result;
    } catch (error) {
      console.error("Redis EXPIRE error:", error);
      return false;
    }
  }

  public async ttl(key: string) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error("Redis TTL error:", error);
      return -2;
    }
  }

  public async exists(key: string) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error("Redis exists error:", error);
      return -2;
    }
  }

  public async incr(key: string) {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error("Redis incr error:", error);
      return -2;
    }
  }

  public async allKeysByPrefix(baseKey: string) {
    return await this.client.keys(`${baseKey}*`);
  }
}

export const redisService = new RedisService();
