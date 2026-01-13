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
  day: z
    .coerce
    .number()
    .min(1, {
      message: 'Minimum day is 1',
    })
    .max(31, {
      message: 'Maximum day is 31',
    })
    .optional(),
})
  .superRefine(({ year, month, day }, ctx) => {
    if (!year) {
      year = new Date().getFullYear()
    }

    if (day) {
      if (!month) {
        ctx.addIssue({
          path: ['month'],
          code: 'custom',
          message: 'Month is required when specifying day'
        })

        return z.NEVER
      }

      const parsedDate = new Date(year, month - 1, day)

      if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) {
        ctx.addIssue({
          path: ['day'],
          code: 'custom',
          message: 'The provided date is not valid'
        })
      }
    }
  })
