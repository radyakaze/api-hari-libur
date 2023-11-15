import { DOMParser, HTMLDocument } from 'deno-dom'
import { MONTH_NAME } from '../constants/month.ts'

const fetcher = async (year: string) => {
  console.log('panggil dari crawler', year)
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
      .map((holiday) => {
        const day = holiday.querySelector('td:first-child')?.textContent.trim()
        const name = holiday.querySelector('td:last-child')?.textContent.trim()

        return {
          date: `${year}-${month}-${day}`,
          name,
        }
      })
  })
}
