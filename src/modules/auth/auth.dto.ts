import { z } from "zod";
import {
  confirmEmailSchema,
  loginSchema,
  resendConfirmEmailSchema,
  signupSchema,
} from "./auth.validation";

export type loginDto = z.infer<typeof loginSchema.body>;
export type signupDto = z.infer<typeof signupSchema.body>;
export type confurmEmailDto = z.infer<typeof confirmEmailSchema.body>;
export type resendConfirmEmailDto = z.infer<typeof resendConfirmEmailSchema.body>;

// export interface loginDto{
//     email:string;
//     password:string
// }
