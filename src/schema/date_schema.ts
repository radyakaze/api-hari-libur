import { z } from 'zod'

export const dateSchema = z.object({
  year: z.coerce
    .number()
    .min(2011, {
      message: 'Minimum year is 2011',
    })
    .max(new Date().getFullYear() + 1, {
      message: `Maximum year is ${new Date().getFullYear() + 1}`,
    })
    .optional(),
  month: z
    .coerce
    .number()
    .min(1)
    .max(12)
    .optional(),
})
