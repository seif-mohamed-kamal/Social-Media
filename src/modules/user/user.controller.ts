import { NextFunction, Request, Response, Router } from "express";
import { successResponse } from "../../common/response";
import { authintication } from "../../middleware";
import userService from "./user.service";
import { TokenTypeEnum } from "../../common/enum";
import { validation } from "../../middleware/validation.middleware";
import * as validators from './user.validation'
const router = Router();

router.get(
  "/profile",
  authintication(),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await userService.profile(req.user);
    return successResponse({ res, status: 200, result });
  }
);
router.post("/logout", authintication(), async (req, res, next) => {
  const { flag } = req.body;
  // console.log(req.user.sub)
  const status = await userService.logout(
    flag,
    req.user,
    req.decoded as { jti: string; iat: number; sub: string }
  );
  return successResponse({ res, status });
});

router.get(
  "/rotate-token",
  authintication({ tokenType: TokenTypeEnum.REFRESH }),
  async (req, res, next) => {
    const result = await userService.rotateToken(
      req.user,
      `${req.protocol}://${req.host}`,
      req.decoded as { jti: string; iat: number; sub: string }
    );
    return successResponse({ res, status: 200, result });
  }
);

router.patch(
    "/update-password",
    authintication(),
    validation(validators.updatePasswordSchema),
    async (req, res, next) => {
      const result = await userService.updatePassword(
        req.body,
        req.user,
        `${req.protocol}://${req.host}`
      );
      return successResponse({
        res,
        status: 200,
        result,
      });
    }
  );

export default router;
