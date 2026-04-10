import { NextFunction, Request, Response, Router } from "express";
import authService from "./auth.service";
import { successResponse } from "../../common/response";
import { ILoginResponse } from "./auth.entity";
import * as validators from "./auth.validation";
import { validation } from "../../middleware/validation.middleware";
import { IUser } from "../../common/interface";
const router = Router();
router.post(
  "/login",
  validation(validators.loginSchema),
  async (req: Request,res: Response,next: NextFunction): Promise<Response> => {
    const data = {
      email: "seif",
      password: "123",
    };
    const result = authService.login(data);
    return successResponse<ILoginResponse>({ res, status: 201, result });
  }
);

router.post(
  "/signup",
  validation(validators.signupSchema),
  async (req: Request,res: Response,next: NextFunction): Promise<Response> => {
    const data = req.body;
    const result = await authService.signup(data);
    return successResponse<IUser>({ res, status: 201, result });
  }
);

export default router;
