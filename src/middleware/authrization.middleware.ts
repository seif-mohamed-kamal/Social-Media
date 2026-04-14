import { NextFunction, Request, Response } from "express";
import { ForbiddenException } from "../common/exceptions/domain.exception";
import { RoleEnum } from "../common/enum";

export const authrization = (accessRoles: RoleEnum[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!accessRoles.includes(req.user.role)) {
      throw new ForbiddenException("Not Authorized access");
    }
    next();
  };
};
