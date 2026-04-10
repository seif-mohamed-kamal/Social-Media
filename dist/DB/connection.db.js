"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDB = void 0;
const mongoose_1 = require("mongoose");
const config_service_1 = require("../config/config.service");
const connectToDB = async () => {
    try {
        await (0, mongoose_1.connect)(config_service_1.DB_URI);
        console.log('DB Connected Successfully👌');
    }
    catch (error) {
        console.log(`Fail to connect To DB ... ${error}`);
    }
};
exports.connectToDB = connectToDB;
