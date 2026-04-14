"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authintication = void 0;
const enum_1 = require("../common/enum");
const token_service_1 = require("../common/service/token.service");
const authintication = ({ tokenType = enum_1.TokenTypeEnum.ACCESS } = {}) => {
    return async (req, res, next) => {
        const tokenservice = new token_service_1.TokenService();
        const [schema, creqdintials] = req.headers?.authorization?.split(" ") || [];
        const { user, decodedToken } = await tokenservice.decodeToken({
            token: creqdintials,
            tokenType,
        });
        (req.user = user), (req.decoded = decodedToken);
        next();
    };
};
exports.authintication = authintication;
