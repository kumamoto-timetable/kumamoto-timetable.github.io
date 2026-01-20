import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
// import Select from 'react-select'
import * as Urql from 'urql'
import { useReactToPrint } from 'react-to-print'

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import { accessTarget } from './access_target'

import { Language, NormalizeType, Order, useNormalizedStopsQuery, useFindAgenciesQuery, VersionOrderColumn } from '../graphql/generated/graphql'
import { TimetableTable } from './timetable'
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { pageView } from './google_analytics';

import * as explanationIng from "../images/explanation.png"

function App() {
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint() {
      if (selectedFrom === null || selectedTo === null) return

      (window as any).gtag('event', 'print_timetable', { origin: selectedFrom.label, destination: selectedTo.label })
    },
  });

  const [userInputted, setUserInputted] = useState<boolean>(false)

  const defaultValues = useMemo(() => {
    const url = new URL(location.href)

    return {
      fromSearchName: url.searchParams.get('fromName') ?? '',
      toSearchName: url.searchParams.get('toName') ?? '',
      displayDestination: (url.searchParams.get('displayDestination') ?? 'on') === 'on',
      displayRouteId: (url.searchParams.get('displayRouteId') ?? 'on') === 'on',
      displayCompanyName: (url.searchParams.get('displayCompanyName') ?? 'off') === 'on',
    }
  }, [])

  useEffect(() => {
    pageView(location.pathname + location.search)
  }, [location])

  const [destinationCheckbox, setDestinationCheckbox] = useState<boolean>(defaultValues.displayDestination)
  const [routeIdCheckbox, setRouteIdCheckbox] = useState<boolean>(defaultValues.displayRouteId)
  const [companyNameCheckbox, setCompanyNameCheckbox] = useState<boolean>(defaultValues.displayCompanyName)

  const [fromSearchName, setFromSearchName] = useState(defaultValues.fromSearchName)
  const [selectedFrom, setSelectedFromKey] = useState<{ label: string; key: string; value: string[] } | null>(null)

  const [toSearchName, setToSearchName] = useState(defaultValues.toSearchName)
  const [selectedTo, setSelectedToKey] = useState<{ label: string; key: string; value: string[] } | null>(null)

  const handleExchange = useCallback(() => {
    setUserInputted(true)
    setFromSearchName(toSearchName)
    setSelectedFromKey(selectedTo)
    setToSearchName(fromSearchName)
    setSelectedToKey(selectedFrom)
  }, [fromSearchName, selectedFrom, toSearchName, selectedTo])

  const [remotes] = useFindAgenciesQuery({
    variables: {
      conditions: {
        agencyIds: accessTarget.agencyIds,
      },
      pagination: {}
    }
  })
  const agencyUids = useMemo(() => remotes.data?.findAgencies.edges.map(remote => remote.uid) ?? [], [remotes.data])

  const [fromNormalizedStops] = useNormalizedStopsQuery({
    variables: {
      where: {
        agencyUids: agencyUids,
        name: fromSearchName,
      },
      options: {
        groupBy: NormalizeType.Id,
        languages: [Language.Ja, Language.En],
      },
      stopsOptions: {
        languages: [Language.Ja, Language.En],
      },
      pagination: {
        limit: 20
      },
    }
  })
  const fromStops = useMemo(() => (fromNormalizedStops.data?.searchNormalizedStops.edges ?? []).map((normalizedStop) => ({ label: normalizedStop.name, key: normalizedStop.key, value: normalizedStop.stops.edges.map(s => s.uid) })), [fromNormalizedStops.data])
  const [toNormalizedStops] = useNormalizedStopsQuery({
    variables: {
      where: {
        agencyUids: agencyUids,
        name: toSearchName,
      },
      options: {
        groupBy: NormalizeType.Id,
        languages: [Language.Ja, Language.En],
      },
      stopsOptions: {
        languages: [Language.Ja, Language.En],
      },
      pagination: {
        limit: 20
      },
    }
  })
  const toStops = useMemo(() => (toNormalizedStops.data?.searchNormalizedStops.edges ?? []).map((normalizedStop) => ({ label: normalizedStop.name, key: normalizedStop.key, value: normalizedStop.stops.edges.map(s => s.uid) })), [toNormalizedStops.data])

  useEffect(() => {
    if (!fromSearchName || !toSearchName || !fromNormalizedStops.data || !toNormalizedStops.data || userInputted) return

    if (0 < fromNormalizedStops.data.searchNormalizedStops.totalCount) {
      const stop = fromNormalizedStops.data.searchNormalizedStops.edges[0]
      setFromSearchName(stop.name)
      setUserInputted(true)
      setSelectedFromKey({
        label: stop.name,
        key: stop.key,
        value: stop.stops.edges.map(s => s.uid)
      })
    }

    if (0 < toNormalizedStops.data.searchNormalizedStops.totalCount) {
      const stop = toNormalizedStops.data.searchNormalizedStops.edges[0]
      setToSearchName(stop.name)
      setUserInputted(true)
      setSelectedToKey({
        label: stop.name,
        key: stop.key,
        value: stop.stops.edges.map(s => s.uid)
      })
    }
  }, [fromNormalizedStops.data, toNormalizedStops.data])

  useEffect(() => {
    if (selectedFrom === null || selectedTo === null) return

    (window as any).gtag('event', 'request_timetable', {
      origin: selectedFrom.key,
      destination: selectedTo.key,
    })
  }, [selectedFrom, selectedTo])

  return (
    <>
      <div className='header_notice'>
        印刷用のためPCからご利用ください。<br />
        スマートフォンからは、<a href='https://km.bus-vision.jp/kumamoto/view/searchStop.html'>バスきたくまさん(バスロケ)</a>、<a href='https://www.google.co.jp/maps/'>Google Maps(経路検索)</a>がおすすめです。
      </div>
      <div className='controller'>
        <Autocomplete
          className='fromName'
          freeSolo
          disablePortal
          size="small"
          options={fromSearchName === '' ? [] : fromStops}
          isOptionEqualToValue={(option, value) => option.key === value.key}
          filterOptions={v => v}
          renderInput={(params) => (<TextField {...params} label="出発地" />)}
          inputValue={fromSearchName}
          onInputChange={(event, value, reason) => {
            if (event === null) return
            if (reason === 'reset') return

            setUserInputted(true)
            setFromSearchName(value)
          }}
          onChange={(event, value, reason) => {
            if (typeof value === 'string' || reason === 'clear') {
              setFromSearchName('')

              return
            }

            setFromSearchName(value.label)
            setSelectedFromKey(value)
          }}
          value={selectedFrom}
        />
        <Autocomplete
          className='toName'
          freeSolo
          disablePortal
          size="small"
          options={toSearchName === '' ? [] : toStops}
          isOptionEqualToValue={(option, value) => option.key === value.key}
          filterOptions={v => v}
          renderInput={(params) => (<TextField {...params} label="到着地" />)}
          inputValue={toSearchName}
          onInputChange={(event, value, reason) => {
            if (event === null) return
            if (reason === 'reset') return

            setUserInputted(true)
            setToSearchName(value)
          }}
          onChange={(event, value, reason) => {
            if (typeof value === 'string' || reason === 'clear') {
              setToSearchName('')

              return
            }

            setToSearchName(value.label)
            setSelectedToKey(value)
          }}
          value={selectedTo}
        />
        <button className='exchange' onClick={handleExchange}>⇅</button>
        <button className='print' disabled={selectedFrom === null || selectedTo === null} onClick={handlePrint}>印刷する</button>
        <FormGroup style={{
          display: 'flex',
          flexDirection: 'row',
        }} >
          <FormControlLabel control={<Checkbox checked={destinationCheckbox} onChange={(event) => setDestinationCheckbox(event.target.checked)} />} label="行先" />
          <FormControlLabel control={<Checkbox checked={routeIdCheckbox} onChange={(event) => setRouteIdCheckbox(event.target.checked)} />} label="案内番号" />
          <FormControlLabel control={<Checkbox checked={companyNameCheckbox} onChange={(event) => setCompanyNameCheckbox(event.target.checked)} />} label="会社名" />
        </FormGroup>
        <div>◀◀印刷ボタンから、プリンタの拡大・縮小設定でページに合わせて印刷しましょう。</div>
      </div>
      {
        selectedFrom && selectedTo ?
          <div ref={componentRef} >
            <TimetableTable
              fromStop={{ label: selectedFrom.label, key: selectedFrom.key, uids: selectedFrom.value }}
              toStop={{ label: selectedTo.label, key: selectedTo.key, uids: selectedTo.value }}
              checkboxes={{ destination: destinationCheckbox, routeId: routeIdCheckbox, companyName: companyNameCheckbox }}
            />
          </div> :
          <><img src={explanationIng} />
            <div className='credit'>開発：<a href='https://t-brain.jp/'>(株)トラフィックブレイン</a>　データ提供：<a href='https://jmpo.kumamoto-toshibus.co.jp/'>共同経営推進室(九州産交バス・産交バス・熊本バス・熊本電鉄・熊本都市バス)</a><br />
              このサービスは<a href='https://km.bus-vision.jp/kumamoto/view/opendataKuma.html'>熊本のバス5社のGTFSオープンデータ</a>を用いています。
            </div>
          </>
      }
    </>
  )
}

const client = Urql.createClient({
  url: accessTarget.medas.url,
  fetchOptions: {
    headers: {
      Authorization: `Bearer ${accessTarget.medas.accessToken}`
    },
  },
})

const element = document.getElementById('root')
const root = createRoot(element)
root.render(<Urql.Provider value={client}><App /></Urql.Provider>)
