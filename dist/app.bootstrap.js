"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const modules_1 = require("./modules");
const middleware_1 = require("./middleware");
const config_service_1 = require("./config/config.service");
const DB_1 = require("./DB");
const service_1 = require("./common/service");
const cors_1 = __importDefault(require("cors"));
const bootstrap = async () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)(), express_1.default.json());
    await (0, DB_1.connectToDB)();
    await service_1.redisService.connectToRedis();
    app.use("/auth", modules_1.authRouter);
    app.use("/user", modules_1.userRouter);
    app.get("/", (req, res, next) => {
        res.status(200).json({ message: "Landing Page" });
    });
    app.use(middleware_1.globalErrorHandling);
    app.listen(config_service_1.port, () => {
        console.log(`App running successfully on port ${config_service_1.port}`);
    });
};
exports.default = bootstrap;
