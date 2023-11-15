import { type Context, Hono } from 'hono'
import { cache, compress, serveStatic } from 'hono/middleware'
import { validator } from 'hono/validator'
import { getHoliday } from './library/holiday.ts'
import { dateSchema } from './schema/date_schema.ts'

const kv = await Deno.openKv()

const app = new Hono()

app.use('*', compress())

app.get(
  '/api/*',
  cache({
    cacheName: 'my-app',
    cacheControl: 'max-age=86400',
    wait: true,
  }),
)

app.get('*', serveStatic({ root: './public' }))

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

Deno.serve(app.fetch)
