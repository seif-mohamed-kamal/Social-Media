"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const model_1 = require("../model");
const DB_repository_1 = require("./DB.repository");
class userRepository extends DB_repository_1.DataBaseRepository {
    constructor() {
        super(model_1.userModel);
    }
}
exports.userRepository = userRepository;
