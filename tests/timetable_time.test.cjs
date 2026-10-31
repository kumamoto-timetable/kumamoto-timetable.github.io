const assert = require('node:assert/strict')
const { test } = require('node:test')
const { nextServiceDate, getDepartureTime, getTravelTimeSeconds } = require('../.cache/tests/utils')

const timezones = ['Asia/Tokyo', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Asia/Kolkata']

function withNow(instant, run) {
  const OriginalDate = global.Date
  global.Date = class extends OriginalDate {
    constructor(...args) {
      if (args.length === 0) super(instant)
      else super(...args)
    }
    static now() { return new OriginalDate(instant).valueOf() }
  }
  try { run() } finally { global.Date = OriginalDate }
}

for (const timezone of timezones) {
  test(`始発から終発までJSTで表示する: ${timezone}`, () => {
    process.env.TZ = timezone
    const date = nextServiceDate('weekday', '2026-10-17')
    const departures = [
      '2026-10-19T06:24:00+09:00',
      '2026-10-19T06:48:00+09:00',
      '2026-10-19T07:00:00+09:00',
      '2026-10-19T12:50:00+09:00',
      '2026-10-19T22:11:00+09:00',
    ].map(departure => getDepartureTime(departure, date))
    assert.deepEqual(departures, [
      { hour: 6, minute: 24 }, { hour: 6, minute: 48 },
      { hour: 7, minute: 0 }, { hour: 12, minute: 50 }, { hour: 22, minute: 11 },
    ])
    assert.deepEqual(getDepartureTime('2026-10-18T21:24:00Z', date), { hour: 6, minute: 24 })
  })

  test(`検索対象日とAPIに渡す午前0時をJSTで選ぶ: ${timezone}`, () => {
    process.env.TZ = timezone
    const weekday = nextServiceDate('weekday', '2026-10-17')
    assert.equal(weekday.format('YYYY-MM-DD'), '2026-10-19')
    assert.equal(weekday.toISOString(), '2026-10-18T15:00:00.000Z')
    assert.equal(nextServiceDate('saturday', '2026-10-17').toISOString(), '2026-10-16T15:00:00.000Z')
    assert.equal(nextServiceDate('holiday', '2026-10-17').toISOString(), '2026-10-17T15:00:00.000Z')
  })

  test(`端末の夏時間終了をまたいでも検索日はJST午前0時になる: ${timezone}`, () => {
    process.env.TZ = timezone
    assert.equal(nextServiceDate('weekday', '2026-10-31').toISOString(), '2026-11-01T15:00:00.000Z')
  })

  test(`祝日・特別日・年またぎをJSTで判定する: ${timezone}`, () => {
    process.env.TZ = timezone
    assert.equal(nextServiceDate('holiday', '2026-11-03').format('YYYY-MM-DD'), '2026-11-03')
    assert.equal(nextServiceDate('weekday', '2026-11-03').format('YYYY-MM-DD'), '2026-11-04')
    assert.equal(nextServiceDate('saturday', '2023-02-11').format('YYYY-MM-DD'), '2023-02-18')
    assert.equal(nextServiceDate('holiday', '2026-08-13').format('YYYY-MM-DD'), '2026-08-16')
    assert.equal(nextServiceDate('weekday', '2026-12-29').format('YYYY-MM-DD'), '2027-01-04')
    assert.equal(nextServiceDate('saturday', '2026-12-29').format('YYYY-MM-DD'), '2027-01-09')
    assert.equal(nextServiceDate('holiday', '2026-12-29').format('YYYY-MM-DD'), '2027-01-10')
  })

  test(`startDate未指定時はJSTの今日を起点にする: ${timezone}`, () => {
    process.env.TZ = timezone
    withNow('2026-10-17T14:59:59Z', () => {
      assert.equal(nextServiceDate('saturday').format('YYYY-MM-DD'), '2026-10-17')
    })
    withNow('2026-10-17T15:00:00Z', () => {
      assert.equal(nextServiceDate('saturday').format('YYYY-MM-DD'), '2026-10-24')
      assert.equal(nextServiceDate('holiday').format('YYYY-MM-DD'), '2026-10-18')
    })
  })

  test(`運行日から数えて24時超の便を表示する: ${timezone}`, () => {
    process.env.TZ = timezone
    const date = nextServiceDate('weekday', '2026-10-19')
    assert.deepEqual(getDepartureTime('2026-10-19T23:50:00+09:00', date), { hour: 23, minute: 50 })
    assert.deepEqual(getDepartureTime('2026-10-20T00:30:00+09:00', date), { hour: 24, minute: 30 })
    assert.deepEqual(getDepartureTime('2026-10-20T01:05:00+09:00', date), { hour: 25, minute: 5 })
  })

  test(`JST・端末の午前0時をまたぐ便でも所要時間を保つ: ${timezone}`, () => {
    process.env.TZ = timezone
    assert.equal(getTravelTimeSeconds('2026-10-19T06:24:00+09:00', '2026-10-19T06:46:00+09:00'), 1320)
    assert.equal(getTravelTimeSeconds('2026-10-19T23:50:00+09:00', '2026-10-20T00:12:00+09:00'), 1320)
    assert.equal(getTravelTimeSeconds('2026-10-19T12:50:00+09:00', '2026-10-19T13:12:00+09:00'), 1320)
  })
}
