import { z } from "zod";

export const generalValidationFeilds = {
  email: z.email(),
  password: z.string(),
  username: z.string(),
  confirmPassword: z.string(),
  phone: z.string(),
  otp:z.string().regex(/^\d{6}$/ )
};
