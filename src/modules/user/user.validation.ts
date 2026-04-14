import { z } from "zod";
import { generalValidationFeilds } from "../../common/validation";

export const updatePasswordSchema = {
  body: z
    .strictObject({
      oldPassword: generalValidationFeilds.password,
      newPassword: generalValidationFeilds.password,
      confirmPassword: generalValidationFeilds.confirmPassword,
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
};
