import { z } from "zod";

export const FlashCardsValidators = z.object({
    fileId: z.string(),
    numberOfMessages: z.number().min(1).max(100),
})