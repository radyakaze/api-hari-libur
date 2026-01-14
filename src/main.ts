import { type Context, Hono } from '@hono/hono'
import { cors } from '@hono/hono/cors'
import { logger } from '@hono/hono/logger'
import { serveStatic } from '@hono/hono/deno'
import { getHoliday, getHolidayDate } from '@/libraries/holiday.ts'
import { dateSchema } from '@/schema/date_schema.ts'
import { zValidator } from '@/middleware/zod.ts'
import { HTTPException } from '@hono/hono/http-exception'

const kv = await Deno.openKv()

const app = new Hono()

app.use('*', logger())
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET'],
  }),
)

app.get(
  '/api',
  zValidator('query', dateSchema),
  async (c: Context) => {
    const year = c.req.query('year') || new Date().getFullYear().toString()
    const month = c.req.query('month')
    const day = c.req.query('day')

    if (day) {
      return c.json(
        await getHolidayDate(kv, new Date(`${year}-${month}-${day}`)),
      )
    }

    return c.json(
      await getHoliday(kv, year, month),
    )
  },
)

app.get(
  '/api/today',
  async (c: Context) => {
    return c.json(
      await getHolidayDate(kv, new Date()),
    )
  },
)

app.get(
  '/api/tomorrow',
  async (c: Context) => {
    const date = new Date()
    date.setDate(date.getDate() + 1)

    return c.json(
      await getHolidayDate(kv, date),
    )
  },
)

app.get('*', serveStatic({ root: './public' }))

app.onError((err: Error, c: Context) => {
  if (err instanceof HTTPException) {
    return c.json({
      message: err.message.toString(),
      errors: err.cause,
    }, err.status)
  }

  return c.json({
    message: err.message.toString(),
  }, 500)
})

export default {
  fetch: app.fetch,
} satisfies Deno.ServeDefaultExport;
