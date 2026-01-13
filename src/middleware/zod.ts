import { type ZodSchema, flattenError } from 'zod'
import { type ValidationTargets } from '@hono/hono'
import { HTTPException } from '@hono/hono/http-exception'
import { zValidator as zv } from '@hono/zod-validator'

export const zValidator = <T extends ZodSchema, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T
) =>
  zv(target, schema, (result) => {
    if (!result.success) {
      throw new HTTPException(422, {
        message: 'The given data was invalid.',
        cause: flattenError(result.error).fieldErrors,
      })
    }
  })
