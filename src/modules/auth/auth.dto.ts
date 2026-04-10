import {z} from "zod"
import { loginSchema, signupSchema } from "./auth.validation"


export type loginDto = z.infer<typeof loginSchema.body>
export type signupDto = z.infer<typeof signupSchema.body>

// export interface loginDto{
//     email:string;
//     password:string
// }