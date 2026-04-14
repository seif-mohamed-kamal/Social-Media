import { NextFunction, Request, Response, Router } from "express";
import authService from "./auth.service";
import { successResponse } from "../../common/response";
import * as validators from "./auth.validation";
import { validation } from "../../middleware/validation.middleware";
import { IUser } from "../../common/interface";
const router = Router();

router.post("/login", validation(validators.loginSchema),  async (req: Request,res: Response,next: NextFunction) => {
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

router.patch("/confirmEmail",  async (req: Request,res: Response,next: NextFunction) => {
  const result = await authService.cofirmEmail(req.body);
  return successResponse({ res, status: 200,  result });
});

router.patch("/resendOtp",  async (req: Request,res: Response,next: NextFunction)=> {
  const result = await authService.resendConfirmEmail(req.body);
  return successResponse({ res, status: 200,  result });
});

router.post("/signup/gmail",  async (req: Request,res: Response,next: NextFunction) => {
  const { idToken } = req.body;
  const { status, credintials } = await authService.signupWithGmail(
    idToken,
    `${req.protocol}://${req.host}`
  );
  return successResponse({ res, status, result: {credintials}  });
});


router.post("/forgetpassword",async (req: Request,res: Response,next: NextFunction) => {
  const result = await authService.forgetPassword(req.body);
  return successResponse({ res, status: 200, result });
});

router.patch("/verify-forget-password-otp",async (req: Request,res: Response,next: NextFunction)=> {
  const result = await authService.verifyForgetPasswordOtp(req.body);
  return successResponse({ res, status: 200, result });
});

router.patch("/reset-password", async (req: Request,res: Response,next: NextFunction) => {
  const result = await authService.resetPassword(req.body);
  return successResponse({ res, status: 200, result });
});



export default router;
