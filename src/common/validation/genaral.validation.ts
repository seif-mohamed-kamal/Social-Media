import { z } from "zod";


export const genearalValidationFeilds={
    email: z.email().min(2).max(20),
    password: z.string(),
    username:z.string(),
    confirmPassword:z.string()
}