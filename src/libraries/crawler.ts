import { DOMParser, HTMLDocument } from 'deno-dom'
import { MONTH_NAME } from '@/constants/month.ts'

const fetcher = async (year: string) => {
  const response = await fetch(`https://www.tanggalan.com/${year}`)

  if (!response.ok) {
    throw new Error('Failed to fetch tanggalan')
  }

  return await response.text()
}

export const crawler = async (year: string) => {
  const html = await fetcher(year)

  const dom = new DOMParser().parseFromString(html, 'text/html')

  const months = dom?.querySelectorAll('#main article ul')

  if (!months) {
    throw new Error('Failed to parse DOM')
  }

  return (Array.from(months) as HTMLDocument[]).flatMap((item) => {
    const [monthName, year] = item
      .querySelector('li:first-child a')
      ?.getAttribute('href')
      ?.split('-') || []

    const month = MONTH_NAME[monthName as keyof typeof MONTH_NAME]

    return (Array.from(
      item.querySelectorAll('li:last-child table tr'),
    ) as HTMLDocument[])
      .flatMap((holiday) => {
        const day = holiday.querySelector('td:first-child')?.textContent.trim()
        const name = holiday.querySelector('td:last-child')?.textContent.trim()

        if (day && day.includes('-')) {
          const split = day.split('-', 2)
          const start = Number(split[0])
          const end = Number(split[1])

          return Array.from({ length: end - start })
            .fill(start)
            .flatMap((value, index) => {
              return {
                date: `${year}-${month}-${Number(value) + index}`,
                name,
              }
            })
        }

        return {
          date: `${year}-${month}-${day}`,
          name,
        }
      })
  })
}
