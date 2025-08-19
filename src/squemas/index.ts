import { z } from "zod";

export const echoToolSchema = z.object({
  text: z.string(),
});
