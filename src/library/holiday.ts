import { crawler } from './crawler.ts'

export const getHoliday = async (kv: Deno.Kv, year: string, month?: string) => {
  const holiday = await getHolidayYearly(kv, year)

  if (!month) {
    return holiday
  }

  return holiday.filter((item) => {
    return item.date.startsWith(`${year}-${month.padStart(2, '0')}`)
  })
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
