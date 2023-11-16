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

export const getHolidayDate = async (kv: Deno.Kv, date: Date) => {
  const current = new Date(
    date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }),
  )

  const year = current.getFullYear().toString()
  const month = (current.getMonth() + 1).toString().padStart(2, '0')
  const day = current.getDate().toString().padStart(2, '0')
  const formattedDate = `${year}-${month}-${day}`

  const holiday = await getHolidayYearly(kv, year)

  const holidayList = holiday
    .filter((item) => item.date === formattedDate)
    .map((item) => item.name)

  return {
    date: formattedDate,
    is_holiday: holidayList.length > 0,
    holiday_list: holidayList,
  }
}

export const getHolidayYearly = async (kv: Deno.Kv, year: string) => {
  const res = kv.get<{ name: string; date: string }[]>([year])

  const value = (await res).value

  if (!value) {
    const data = await getData(year)
    const expireIn = Number(year) >= new Date().getFullYear() ? 1000 * 60 * 60 * 24 * 30 : undefined

    await kv.set([year], data, {
      expireIn,
    })

    return data
  }

  return value
}

const getData = async (year: string) => {
  try {
    return await crawler(year)
  } catch {
    return []
  }
}
