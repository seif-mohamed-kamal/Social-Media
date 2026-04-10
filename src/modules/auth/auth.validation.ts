import { z } from "zod";
import { genearalValidationFeilds } from "../../common/validation";

export const loginSchema = {
  body: z.strictObject({
    email: genearalValidationFeilds.email,
    password: genearalValidationFeilds.password,
  }),
};

export const signupSchema = {
  body: loginSchema.body.safeExtend({
    username:genearalValidationFeilds.username,
    confirmPassword:genearalValidationFeilds.confirmPassword,
  }).refine((data) => {
    return data.password === data.confirmPassword
  }, {error:"password missMatch with confirmPassword"}),
};