import { NextFunction, Request, Response, Router } from "express";
import authService from "./auth.service";
import { successResponse } from "../../common/response";
import { ILoginResponse } from "./auth.entity";
import * as validators from "./auth.validation";
import { validation } from "../../middleware/validation.middleware";
import { IUser } from "../../common/interface";
const router = Router();

router.post("/login", validation(validators.loginSchema), async (req, res, next) => {
  const result = await authService.login(req.body, `${req.protocol}://${req.host}`);
  return successResponse({ res, status: 200, result });
});

router.post(
  "/signup",
  validation(validators.signupSchema),
  async (req: Request,res: Response,next: NextFunction): Promise<Response> => {
    const data = req.body;
    const result = await authService.signup(data);
    return successResponse<IUser>({ res, status: 201, result });
  }
);

router.patch("/confirmEmail", async (req, res, next) => {
  const result = await authService.cofirmEmail(req.body);
  return successResponse({ res, status: 200,  result });
});

router.patch("/resendOtp", async (req, res, next) => {
  const result = await authService.resendConfirmEmail(req.body);
  return successResponse({ res, status: 200,  result });
});


export default router;
