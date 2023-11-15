import { type Context, Hono } from 'hono'
import { compress, serveStatic, cors, logger } from 'hono/middleware'
import { validator } from 'hono/validator'
import { getHoliday, getHolidayToday } from '@/libraries/holiday.ts'
import { dateSchema } from '@/schema/date_schema.ts'

const kv = await Deno.openKv()

const app = new Hono()

app.use('*', compress())
app.use('*', logger())
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET']
}))

app.get(
  '/api',
  validator('query', (value, c) => {
    const parsed = dateSchema.safeParse(value)
    if (!parsed.success) {
      return c.json(parsed.error.format(), 401)
    }

    return parsed.data
  }),
  async (c: Context) => {
    const year = c.req.query('year') || new Date().getFullYear().toString()
    const month = c.req.query('month')

    try {
      return c.json(
        await getHoliday(kv, year, month),
      )
    } catch (error) {
      return c.json({
        message: error.message.toString(),
      }, 500)
    }
  },
)

app.get(
  '/api/today',
  async (c: Context) => {
    try {
      return c.json(
        await getHolidayToday(kv),
      )
    } catch (error) {
      return c.json({
        message: error.message.toString(),
      }, 500)
    }
  },
)

app.get('*', serveStatic({ root: './public' }))

Deno.serve(app.fetch)
