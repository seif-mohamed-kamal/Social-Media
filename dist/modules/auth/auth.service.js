"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const domain_exception_1 = require("../../common/exceptions/domain.exception");
const repository_1 = require("../../DB/repository");
class AuthinticationService {
    userModel;
    constructor() {
        this.userModel = new repository_1.userRepository();
    }
    login(inputs) {
        inputs.email = "ahmed";
        return inputs;
    }
    async signup(inputs) {
        const [result] = await this.userModel.create({
            data: [inputs]
        });
        if (!result) {
            throw new domain_exception_1.BadRequestException("FAIL TO SAVE USER");
        }
        return result.toJSON();
    }
}
exports.default = new AuthinticationService();
