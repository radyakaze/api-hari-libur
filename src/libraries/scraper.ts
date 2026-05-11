///<reference lib="dom" />
import { DOMParser } from '@b-fuze/deno-dom'
import { MONTH_NAME } from '@/constants/month.ts'

const fetcher = async (year: string) => {
  const response = await fetch(`https://tanggalans.com/kalender-${year}`)

  if (!response.ok) {
    throw new Error('Failed to fetch tanggalan')
  }

  return await response.text()
}

export const crawler = async (year: string) => {
  const html = await fetcher(year)

  const dom = new DOMParser().parseFromString(html, 'text/html')

  const months = dom?.querySelectorAll('.entry-content .kalender-indo')

  if (!months) {
    throw new Error('Failed to parse DOM')
  }

  return Array.from(months).flatMap((item) => {
    const [monthName, year] = item
      .querySelector<HTMLAnchorElement>('.kal-title .kal-title-link')
      ?.textContent
      ?.split(' ') || []


    const month = MONTH_NAME[monthName.toLocaleLowerCase() as keyof typeof MONTH_NAME]

    return Array.from(
      item.querySelectorAll('.kal-libur-list li'),
    )
      .flatMap((holiday) => {
        const dayEl = holiday.querySelector<HTMLDivElement>('.kal-libur-day')
        const day = dayEl?.textContent.trim()
        const name = dayEl?.nextSibling?.textContent?.trim()

        if (!day || !name) return

        if (day && day.includes('-')) {
          const split = day.split('-', 2)
          const start = Number(split[0])
          const end = Number(split[1])

          return Array.from({ length: end - start + 1 })
            .fill(start)
            .flatMap((value, index) => {
              return {
                date: `${year}-${month}-${(Number(value) + index).toString().padStart(2, '0')}`,
                name,
                is_national_holiday: !name?.toLowerCase().includes('cuti bersama')
              }
            })
        }

        return {
          date: `${year}-${month}-${day?.padStart(2, '0')}`,
          name,
          is_national_holiday: !name?.toLowerCase().includes('cuti bersama'),
        }
      })
      .filter(holiday => !!holiday)
  })
}
