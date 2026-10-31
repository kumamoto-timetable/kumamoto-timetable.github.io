import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import holidayJp from '@holiday-jp/holiday_jp'

dayjs.extend(utc)

const jstOffsetMinutes = 9 * 60
const specialDays = ['8/13', '8/14', '8/15', '12/29', '12/30', '12/31', '1/1', '1/2', '1/3']

export function nextServiceDate(type: 'weekday' | 'saturday' | 'holiday', baseDate?: string) {
  // 固定オフセットのDayjsへの日付加算は、端末の夏時間切り替えで検索日時が1時間ずれるため使わない。
  let date = baseDate ? dayjs.utc(baseDate) : dayjs.utc().add(9, 'hour').startOf('day')

  while (true) {
    // Dateを渡す祝日判定は端末のタイムゾーンで日付が変わるため使わない。
    const isHoliday = holidayJp.holidays[date.format('YYYY-MM-DD')] !== undefined
    const matchesType = type === 'holiday'
      ? isHoliday || date.day() === 0
      : !isHoliday && (type === 'saturday' ? date.day() === 6 : [1, 2, 3, 4, 5].includes(date.day()))

    if (!specialDays.includes(date.format('M/D')) && matchesType) {
      return dayjs(`${date.format('YYYY-MM-DD')}T00:00:00+09:00`).utcOffset(jstOffsetMinutes)
    }
    date = date.add(1, 'day')
  }
}

export function getDepartureTime(iso8601: string, serviceDate: dayjs.Dayjs) {
  const departure = dayjs(iso8601).utcOffset(jstOffsetMinutes)

  return {
    hour: departure.diff(serviceDate, 'hour'),
    minute: departure.minute(),
  }
}

export function getTravelTimeSeconds(from: string, to: string) {
  return dayjs(to).diff(dayjs(from), 'second')
}
