import { crawler } from '@/libraries/scraper.ts'

export const getHoliday = async (kv: Deno.Kv, year: string, month?: string) => {
  const holiday = await getHolidayYearly(kv, year)

  if (!month) {
    return holiday
  }

  return holiday.filter((item) => {
    return item.date.startsWith(`${year}-${month.padStart(2, '0')}`)
  })
}

export const getHolidayToday = async (kv: Deno.Kv) => {
  const current = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
  )

  const year = current.getFullYear().toString()
  const month = (current.getMonth() + 1).toString().padStart(2, '0')
  const day = current.getDate().toString().padStart(2, '0')
  const date = `${year}-${month}-${day}`

  const holiday = await getHolidayYearly(kv, year)

  return {
    date,
    holiday_list: holiday
      .filter((item) => item.date === date)
      .map((item) => item.name),
  }
}

export const getHolidayYearly = async (kv: Deno.Kv, year: string) => {
  const res = kv.get<{ name: string; date: string }[]>([year])

  const value = (await res).value

  if (!value) {
    const data = await crawler(year)
    await kv.set([year], data, {
      expireIn: 60 * 60 * 24 * 30,
    })

    return data
  }

  return value
}
