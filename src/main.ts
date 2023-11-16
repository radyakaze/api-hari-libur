import { type Context, Hono } from 'hono'
import { cors, logger, serveStatic } from 'hono/middleware'
import { zodValidator } from '@/libraries/validation.ts'
import { getHoliday, getHolidayDate } from '@/libraries/holiday.ts'
import { dateSchema } from '@/schema/date_schema.ts'

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

app.use('/api/*', async (c, next) => {
  const CACHE = await caches.open('api-libur-cache')

  c.res.headers.set('cache-control', 'public, max-age=900') // 15 minutes

  const res = await CACHE.match(c.req.url)

  if (res) {
    return new Response(res.body, res)
  }

  await next()

  if (!c.res.ok) {
    return
  }

  c.res.headers.set('x-cache-hit', 'true')

  await CACHE.put(c.req.url, c.res.clone())
})

app.get(
  '/api',
  zodValidator('query', dateSchema),
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
  return c.json({
    message: err.message.toString(),
  }, 500)
})

Deno.serve(app.fetch)
