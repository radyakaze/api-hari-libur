import { z } from 'zod'

const maxYear = new Date().getFullYear() + 1

export const dateSchema = z.object({
  year: z.coerce
    .number()
    .min(2011, {
      message: 'Minimum year is 2011',
    })
    .max(maxYear, {
      message: `Maximum year is ${maxYear}`,
    })
    .optional(),
  month: z
    .coerce
    .number()
    .min(1, {
      message: 'Minimum month is 1',
    })
    .max(12, {
      message: 'Maximum month is 12',
    })
    .optional(),
})
