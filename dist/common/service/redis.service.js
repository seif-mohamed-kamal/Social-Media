"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const redis_1 = require("redis");
const config_service_1 = require("../../config/config.service");
class RedisService {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({ url: config_service_1.REDIS_URI });
        this.handleError();
    }
    handleError() {
        this.client.on("error", (error) => {
            console.log(`Redis Error ---- ${error}`);
        });
        this.client.on("reedy", () => {
            console.log(`Redis Error`);
        });
    }
    async connectToRedis() {
        await this.client.connect();
        console.log("Redis connected successfully👌");
    }
}
exports.redisService = new RedisService();
