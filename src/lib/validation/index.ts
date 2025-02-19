import * as z from "zod";

export const SignupVal = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(60, { message: "Name must be less than 60 characters." }),
  username: z.string()
  .min(2, { message: "Username must be at least 2 characters." })
  .max(20, { message: "Username must be less than 20 characters." })
  .regex(/^[a-zA-Z0-9._-]+$/, { message: "Username can only contain letters, numbers, underscores, dashes, periods, and no spaces." }),
  email: z.string().email(),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }).max(20, { message: "Password must be less than 20 characters." }),
});

export const SigninVal = z.object({
  id: z.string(),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }).max(20, { message: "Password must be less than 20 characters." }),
});