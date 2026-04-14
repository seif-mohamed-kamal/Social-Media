import { NextFunction, Request, Response } from "express";
import { TokenTypeEnum } from "../common/enum";
import { TokenService } from "../common/service/token.service";

export const authintication = ({ tokenType = TokenTypeEnum.ACCESS } = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tokenservice = new TokenService();
    const [schema, creqdintials] = req.headers?.authorization?.split(" ") || [];
    const { user, decodedToken } = await tokenservice.decodeToken({
      token: creqdintials as unknown as string,
      tokenType,
    });
    (req.user = user), (req.decoded = decodedToken);
    // console.log({user , decodedToken})
    next();
  };
};
