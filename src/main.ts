import { type Context, Hono } from 'hono'
import { compress, serveStatic, cors } from 'hono/middleware'
import { validator } from 'hono/validator'
import { getHoliday } from '@/libraries/holiday.ts'
import { dateSchema } from '@/schema/date_schema.ts'

const kv = await Deno.openKv()

const app = new Hono()

app.use('*', compress())
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET']
}))

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
