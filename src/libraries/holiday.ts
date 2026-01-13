import { crawler } from '@/libraries/scraper.ts'

type Holiday = { name: string; date: string }

export const getHoliday = async (
  kv: Deno.Kv,
  year: string,
  month?: string
): Promise<Holiday[]> => {
  const holidays = await getHolidayYearly(kv, year)

  if (!month) return holidays

  const monthPadded = month.padStart(2, '0')
  const prefix = `${year}-${monthPadded}`

  return holidays.filter(item => item.date.startsWith(prefix))
}

export const getHolidayDate = async (
  kv: Deno.Kv,
  date: Date
) => {
  const current = new Date(
    date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  )

  const year = current.getFullYear().toString()
  const month = (current.getMonth() + 1).toString().padStart(2, '0')
  const day = current.getDate().toString().padStart(2, '0')
  const formattedDate = `${year}-${month}-${day}`

  const holidays = await getHolidayYearly(kv, year)
  const holidayList = holidays
    .filter(item => item.date === formattedDate)
    .map(item => item.name)

  return {
    date: formattedDate,
    is_holiday: holidayList.length > 0,
    holiday_list: holidayList,
  }
}

export const getHolidayYearly = async (
  kv: Deno.Kv,
  year: string
): Promise<Holiday[]> => {
  const cached = await kv.get<Holiday[]>([year])

  if (cached.value) return cached.value

  const data = await getData(year)

  if (data.length === 0) return data

  const currentYear = new Date().getFullYear()
  const expireIn = Number(year) >= currentYear
    ? 1000 * 60 * 60 * 24 * 30
    : undefined

  await kv.set([year], data, { expireIn })

  return data
}

const getData = async (year: string): Promise<Holiday[]> => {
  try {
    return await crawler(year)
  } catch {
    return []
  }
}
