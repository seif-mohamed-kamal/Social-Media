import { z } from "zod";
import { generalValidationFeilds } from "../../common/validation";

export const confirmEmailSchema={
  body:z.strictObject({
    email: generalValidationFeilds.email,
    otp:generalValidationFeilds.otp
  })
}

export const resendConfirmEmailSchema={
  body:z.strictObject({
    email: generalValidationFeilds.email,
  })
}

export const loginSchema = {
  body: z.strictObject({
    email: generalValidationFeilds.email,
    password: generalValidationFeilds.password,
  }),
};

export const signupSchema = {
  body: loginSchema.body.safeExtend({
    username:generalValidationFeilds.username,
    confirmPassword:generalValidationFeilds.confirmPassword,
    phone:generalValidationFeilds.phone
  }).refine((data) => {
    return data.password === data.confirmPassword
  }, {error:"password missMatch with confirmPassword"}),
};