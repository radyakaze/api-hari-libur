import type {
  Context,
  Env,
  MiddlewareHandler,
  TypedResponse,
  ValidationTargets,
} from 'hono'
import { validator as honoValidator } from 'hono/validator'
import type { z, ZodError, ZodSchema } from 'zod'

export type Hook<
  T,
  E extends Env,
  P extends string,
  O = Record<string, unknown>,
> = (
  result: { success: true; data: T } | {
    success: false
    error: ZodError
    data: T
  },
  c: Context<E, P>,
) =>
    | Response
    | Promise<Response>
    | void
    | Promise<Response | void>
    | TypedResponse<O>

type HasUndefined<T> = undefined extends T ? true : false

export const zodValidator = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets,
  E extends Env,
  P extends string,
  I = z.input<T>,
  O = z.output<T>,
  V extends {
    in: HasUndefined<I> extends true ? { [K in Target]?: I }
    : { [K in Target]: I }
    out: { [K in Target]: O }
  } = {
    in: HasUndefined<I> extends true ? { [K in Target]?: I }
    : { [K in Target]: I }
    out: { [K in Target]: O }
  },
>(
  target: Target,
  schema: T,
  hook?: Hook<z.infer<T>, E, P>,
): MiddlewareHandler<E, P, V> =>
  honoValidator(target, async (value, c) => {
    const result = await schema.safeParseAsync(value)

    if (hook) {
      const hookResult = hook({ data: value, ...result }, c)
      if (hookResult) {
        if (hookResult instanceof Response || hookResult instanceof Promise) {
          return hookResult
        }
        if ('response' in hookResult) {
          return hookResult.response
        }
      }
    }

    if (!result.success) {
      return c.json({
        message: 'The given data was invalid.',
        errors: formatValidationError(result.error),
      }, 422)
    }

    const data = result?.data as z.infer<T>

    return data
  })

function formatValidationError<T>(error: ZodError<T>) {
  const formatted = error.format()

  return Object.fromEntries(
    Object.keys(formatted).map((key) => {
      // @ts-expect-error key is dynamic
      return [key, formatted[key]?._errors]
    })
  )
}
