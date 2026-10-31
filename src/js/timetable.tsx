import type { Dayjs } from "dayjs";
import React from "react";
import { useMemo } from "react";
import { useQRCode } from 'next-qrcode';

import { useTimetableForBetweenStopsQuery } from "../graphql/generated/graphql";
import { useTimetable } from "./use_timetable";
import { getDepartureTime, getTravelTimeSeconds, nextServiceDate } from "./utils";

import * as usageGuideImg from "../images/usage_guide.png"

function isNullable(v: unknown) {
  return v === undefined || v === null
}

type Minute = {
  uid: string;
  departure: {
    hour: number;
    minute: number;
  };
  routeIds: string[]
  route: {
    ids: string[],
    name: string
  }
  remote: {
    uid: string
  }
  stop: {
    platform: {
      code: string | null
    }
  }
  moveTimeSec: number
}
type TimeTableData = [number, Minute[]]

function stopTimeTransform(trip: ReturnType<typeof useTimetableForBetweenStopsQuery>[0]['data']['timetable']['edges'][number]['trip'], stopTime: ReturnType<typeof useTimetableForBetweenStopsQuery>[0]['data']['timetable']['edges'][number]['stopTimes'][number]) {
  return {
    uid: stopTime.uid,
    departure: stopTime.departureTime,
    route: trip.route,
    headsign: stopTime.headsign,
    remote: {
      uid: stopTime.remoteVersion.remote.uid
    },
    stop: {
      platform: {
        code: stopTime.stop.platform?.code ?? null
      }
    }
  }
}

function transform(transit: ReturnType<typeof useTimetableForBetweenStopsQuery>[0]['data']['timetable']['edges'][number], serviceDate: Dayjs): Minute {
  const fromStopTime = stopTimeTransform(transit.trip, transit.stopTimes[0])
  const toStopTime = stopTimeTransform(transit.trip, transit.stopTimes[1])

  const routeName = fromStopTime.route.longName ?? ''
  const routeIds = routeName.includes('：') ? routeName.split('：')[0].split('/') : []

  return {
    uid: fromStopTime.uid,
    departure: getDepartureTime(fromStopTime.departure, serviceDate),
    routeIds: routeIds,
    route: {
      ids: routeIds,
      name: fromStopTime.headsign,
    },
    remote: {
      uid: fromStopTime.remote.uid
    },
    stop: {
      platform: {
        code: fromStopTime.stop.platform.code
      }
    },
    moveTimeSec: getTravelTimeSeconds(fromStopTime.departure, toStopTime.departure),
  }
}

function timetableArray(rows: ReturnType<typeof transform>[]) {
  const result2: typeof rows[number][][] = [[]]
  rows.forEach((row) => {
    const prev = result2[result2.length - 1][result2[result2.length - 1].length - 1]
    if (prev === undefined) {
      result2[result2.length - 1][result2[result2.length - 1].length] = row
      return
    }

    const hourDiff = row.departure.hour - prev.departure.hour
    for (let i = 0; i < hourDiff; i++) {
      result2.push([])
    }

    result2[result2.length - 1].push(row)
  })

  if (result2[0].length === 0) return []

  const minHour = result2[0][0].departure.hour
  const result3 = result2.map((stopTimes, i) => ([minHour + i, stopTimes]))

  return result3
}

const remoteUidMap = {
  '9b1e8ca3-a9e9-4a23-a993-32fc7ba0c2bc': '熊',
  '56e25970-a23c-437f-8f49-d4af91bfc0f7': '産',
  'bb9ae20c-562b-4ade-b51f-cfa7ae667e08': '都',
  '4ec14a83-e52a-4657-b644-276ef21d2a80': '電',
} as const

const circleNumberMap = {
  '1': '①',
  '2': '②',
  '3': '③',
  '4': '④',
  '5': '⑤',
  '6': '⑥',
  '7': '⑦',
  '8': '⑧',
  '9': '⑨',
  '10': '⑩',
  '11': '⑪',
  '12': '⑫',
  '13': '⑬',
  '14': '⑭',
  '15': '⑮',
  '16': '⑯',
  '17': '⑰',
  '18': '⑱',
  '19': '⑲',
  '20': '⑳',
  '21': '㉑',
  '22': '㉒',
  '23': '㉓',
  '24': '㉔',
  '25': '㉕',
  '26': '㉖',
  '27': '㉗',
  '28': '㉘',
  '29': '㉙',
  '30': '㉚',
  '31': '㉛',
  '32': '㉜',
  '33': '㉝',
  '34': '㉞',
  '35': '㉟',
  '36': '㊱',
  '37': '㊲',
  '38': '㊳',
  '39': '㊴',
  '40': '㊵',
  '41': '㊶',
  '42': '㊷',
  '43': '㊸',
  '44': '㊹',
  '45': '㊺',
  '46': '㊻',
  '47': '㊼',
  '48': '㊽',
  '49': '㊾',
  '50': '㊿'
}

export function TimetableTable(props: {
  fromStop: { label: string, key: string, uids: string[]; }
  toStop: { label: string, key: string, uids: string[]; }
  checkboxes: { destination: boolean, routeId: boolean, companyName: boolean }
}) {
  const { Canvas } = useQRCode();
  const dates = useMemo(() => {
    const baseDate = new URL(location.href).searchParams.get('startDate') ?? undefined
    return {
      weekday: nextServiceDate('weekday', baseDate),
      saturday: nextServiceDate('saturday', baseDate),
      holiday: nextServiceDate('holiday', baseDate),
    }
  }, [])

  const { timetable: monday } = useTimetable({
    fromStopUids: props.fromStop.uids,
    topStopUids: props.toStop.uids,
    date: dates.weekday
  })
  const { timetable: saturday } = useTimetable({
    fromStopUids: props.fromStop.uids,
    topStopUids: props.toStop.uids,
    date: dates.saturday
  })
  const { timetable: sunday } = useTimetable({
    fromStopUids: props.fromStop.uids,
    topStopUids: props.toStop.uids,
    date: dates.holiday
  })

  const timetables = useMemo(() => {
    if (isNullable(monday) || isNullable(saturday) || isNullable(sunday)) return null
    if (monday.length === 0 && saturday.length === 0 && sunday.length === 0) return []

    const days = [
      timetableArray((monday ?? []).map((transit) => transform(transit, dates.weekday))) as TimeTableData[],
      timetableArray((saturday ?? []).map((transit) => transform(transit, dates.saturday))) as TimeTableData[],
      timetableArray((sunday ?? []).map((transit) => transform(transit, dates.holiday))) as TimeTableData[],
    ]

    let minHour = 23
    days.forEach(timetable => {
      if (timetable.length === 0) return
      if (timetable[0][0] < minHour) minHour = timetable[0][0]
    })
    days.forEach(timetable => {
      if (timetable.length === 0) {
        timetable.unshift([minHour, []])

        return
      }

      const minHourDiff = timetable[0][0] - minHour
      for (let i = 0; i < minHourDiff; i++) {
        timetable.unshift([timetable[0][0] - 1, []])
      }
    })

    let maxHour = 0
    days.forEach(timetable => {
      if (maxHour < timetable[timetable.length - 1][0]) maxHour = timetable[timetable.length - 1][0]
    })
    days.forEach(timetable => {
      const maxHourDiff = maxHour - timetable[timetable.length - 1][0]
      for (let i = 0; i < maxHourDiff; i++) {
        timetable.push([timetable[timetable.length - 1][0] + 1, []])
      }
    })

    if (days[0].length !== days[1].length || days[1].length !== days[2].length) return []

    const result: [number, [TimeTableData[1], TimeTableData[1], TimeTableData[1]]][] = []
    days[0].forEach((_, i) => [
      result.push([days[0][i][0], [days[0][i][1], days[1][i][1], days[2][i][1]]])
    ])
    return result
  }, [monday, saturday, sunday, dates])

  const moveCenterTimeSec = useMemo(() => {
    if (isNullable(monday) || isNullable(saturday) || isNullable(sunday)) return null

    const moveCenterTimes =
      [
        ...monday,
        ...saturday,
        ...sunday
      ].map((transit) => getTravelTimeSeconds(transit.stopTimes[0].departureTime, transit.stopTimes[1].departureTime)).sort((a, b) => a - b)

    const half = Math.floor(moveCenterTimes.length / 2);

    if (moveCenterTimes.length % 2) {
      return moveCenterTimes[half];
    } else {
      return (moveCenterTimes[half - 1] + moveCenterTimes[half]) / 2;
    }
  }, [monday, saturday, sunday])

  if (timetables === null)
    return (
      <div>
        時刻表を生成中です... しばらくお待ち下さい
      </div>
    )

  const url = new URL(location.href);
  url.searchParams.set('fromName', props.fromStop.label)
  url.searchParams.set('toName', props.toStop.label)
  url.searchParams.set('displayDestination', props.checkboxes.destination ? 'on' : 'off');
  url.searchParams.set('displayRouteId', props.checkboxes.routeId ? 'on' : 'off')
  url.searchParams.set('displayCompanyName', props.checkboxes.companyName ? 'on' : 'off')
  history.replaceState(null, null, url.href)

  if (timetables.length === 0) return (
    <div>
      この停留所区間は運行しておりません
    </div>
  )

  const qrUrl = `https://km.bus-vision.jp/kumamoto/view/approach.html?stopCdFrom=${props.fromStop.key}&stopCdTo=${props.toStop.key}`

  return (
    <div className='timetable'>
      <div className='timetable_header'>
        <div className='timetable_header_route_name'>{props.fromStop.label} → {props.toStop.label}</div>
        <div className='timetable_header_description'>所要約 <span className='timetable_header_description_minutes'>{moveCenterTimeSec / 60}</span> 分（経路・時間帯・交通状況により前後します）<>< br /><span>下線細字：所要時間が長い便です</span></></div>
        <img className="timetable_header_usage_guide" src={usageGuideImg} />
        <div className='timetable_header_qr_description'><div className="center">リアル<br />タイム<br />情報▶</div></div>
        <div className="timetable_header_qr">
          <a href={qrUrl} target="_blank" rel="noopener">
            <Canvas
              text={qrUrl}
              options={{
                type: 'image/png',
                quality: 1,
                level: 'M',
                margin: 4,
                scale: 2,
                color: {
                  dark: '#000000FF',
                  light: '#FFFFFFFF',
                },
              }}
            />
          </a>
        </div>
      </div>
      <div style={{
        width: '100%',
        display: 'flex',
      }}>
        <div className="table">
          <div className="table_header">
            <div className="table_header_hour">時</div>

            <div className="table_header_col_wrap">
              <div className="table_header_col weekday">
                <span className="day_name">平日</span><span className="day">（{dates.weekday.format('YYYY/MM/DD')}）</span>
              </div>
              <div className="table_header_col saturday">
                <span className="day_name">土曜</span><span className="day">（{dates.saturday.format('YYYY/MM/DD')}）</span>
              </div>
              <div className="table_header_col sunday">
                <span className="day_name">日祝</span><span className="day">（{dates.holiday.format('YYYY/MM/DD')}）</span>
              </div>
            </div>

            <div className="table_header_hour_right">時</div>
          </div>
          {timetables.map(([hour, timetable], hourIndex) => <>
            <div className="hour_group">
              <div className="hour">{String(hour).padStart(2, '0')}</div>

              <div className="minutes_group">
                {timetable.map((minutes, i) => {
                  const dayName = i === 0 ? 'weekday' : i === 1 ? 'saturday' : 'sunday'

                  const includedPlatformCode = minutes.some(minute => minute.stop.platform.code !== null)
                  const widthType = includedPlatformCode && props.checkboxes.companyName ? '2' : props.checkboxes.companyName || props.checkboxes.routeId ? '1' : '0'

                  return <div className={`minutes minute_width_${widthType} ${dayName} ${dayName}_${hourIndex % 2}`}>
                    {minutes.map((minute) => {
                      // 中央値×2.0以上 AND 中央値+20以上 → 除外　…桜町→市役所で52分などは除外される
                      if (moveCenterTimeSec * 2.0 <= minute.moveTimeSec && moveCenterTimeSec + 60 * 20 <= minute.moveTimeSec) return

                      // 中央値×1.5以上 AND 中央値+10以上 → 色づけ　…中央病院、健軍・県庁周りが色づけ
                      const minute_style = moveCenterTimeSec * 1.5 <= minute.moveTimeSec && moveCenterTimeSec + 60 * 10 <= minute.moveTimeSec ? 'long_time' : ''

                      const routeName = minute.route.name.split('（')[0].slice(0, 5)
                      const routeId = props.checkboxes.destination === false && props.checkboxes.routeId && minute.routeIds.length === 0 ? routeName : minute.routeIds.join('/')

                      return (
                        <div key={minute.uid} className="minute_wrap">
                          <div className={`company_name ${props.checkboxes.companyName ? '' : 'none'}`}>{remoteUidMap[minute.remote.uid]}</div>
                          <div className="stop_platform_code">{circleNumberMap[minute.stop.platform.code]}</div>
                          <div className={`minute ${minute_style}`}>{String(minute.departure.minute).padStart(2, '0')}</div>
                          <div className={`route_name ${props.checkboxes.destination ? '' : 'none'}`}>{routeName}</div>
                          <div className={`route_id ${props.checkboxes.routeId ? '' : 'none'}`}>{routeId}</div>
                        </div>
                      )
                    })}
                  </div>
                })}

                <div className="hour_right">
                  <div className="center">
                    {String(hour).padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>
          </>)}
        </div>
      </div>
    </div >
  )
}
