/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { CalendarDays } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'

import {
  getPresetRange,
  matchRangePreset,
  RANGE_PRESETS,
  type RangePresetKind,
} from '../lib/time-range-presets'

interface CompactDateTimeRangePickerProps {
  start?: Date
  end?: Date
  onChange: (range: { start?: Date; end?: Date }) => void
  className?: string
  /**
   * [user-ui] When the range equals a preset (e.g. the last 7 days), show the
   * preset name ("Last 7 days") on the trigger instead of two timestamps; the
   * exact range stays in the accessible name and in the popover. Opt-in so
   * other users of this picker (audit log) keep their current label.
   */
  namePresets?: boolean
}

function toInputValue(date?: Date): string {
  return date ? dayjs(date).format('YYYY-MM-DDTHH:mm') : ''
}

function fromInputValue(value: string): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function CompactDateTimeRangePicker({
  start,
  end,
  onChange,
  className,
  namePresets = false,
}: CompactDateTimeRangePickerProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [draftStart, setDraftStart] = useState(toInputValue(start))
  const [draftEnd, setDraftEnd] = useState(toInputValue(end))

  const label = useMemo(() => {
    if (!start && !end) return t('Date Range')
    // The popover's <input type="datetime-local"> only supports minute
    // precision, so seconds are always 00 (manual pick) or 59 (preset
    // end-of-day). Hide them in the trigger label to keep the button
    // width compact while still showing the meaningful timestamp.
    const startText = start ? dayjs(start).format('YYYY-MM-DD HH:mm') : '-'
    const endText = end ? dayjs(end).format('YYYY-MM-DD HH:mm') : '-'
    return `${startText} ~ ${endText}`
  }, [end, start, t])

  const mobileLabel = useMemo(() => {
    if (!start || !end) return label
    if (dayjs(start).isSame(end, 'day')) {
      return `${dayjs(start).format('MM/DD HH:mm')}–${dayjs(end).format('HH:mm')}`
    }
    return label
  }, [start, end, label])

  // [user-ui] Preset name for the trigger (opt-in, see `namePresets`).
  const presetName = useMemo(() => {
    if (!namePresets) return undefined
    const kind = matchRangePreset(start, end)
    const preset = RANGE_PRESETS.find((item) => item.kind === kind)
    return preset ? t(preset.nameKey) : undefined
  }, [end, namePresets, start, t])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftStart(toInputValue(start))
      setDraftEnd(toInputValue(end))
    }
    setOpen(nextOpen)
  }

  const applyDraft = () => {
    onChange({
      start: fromInputValue(draftStart),
      end: fromInputValue(draftEnd),
    })
    setOpen(false)
  }

  const applyPreset = (kind: RangePresetKind) => {
    const range = getPresetRange(kind)
    setDraftStart(toInputValue(range.start))
    setDraftEnd(toInputValue(range.end))
    onChange(range)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            aria-label={presetName ? `${presetName} (${label})` : label}
            title={presetName ? label : undefined}
            className={cn(
              'w-full justify-start gap-2 px-2.5 text-sm leading-5 font-normal tabular-nums',
              !start && !end && 'text-muted-foreground',
              className
            )}
          />
        }
      >
        <CalendarDays className='text-muted-foreground size-4 shrink-0' />
        {presetName ? (
          <span className='min-w-0 truncate'>{presetName}</span>
        ) : (
          <>
            <span className='hidden truncate sm:block'>{label}</span>
            <span className='min-w-0 [overflow-wrap:anywhere] whitespace-normal sm:hidden'>
              {mobileLabel}
            </span>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='w-[min(520px,calc(100vw-2rem))] p-3'
      >
        <div className='space-y-3'>
          <div className='grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end'>
            <div className='space-y-1.5'>
              <div className='text-muted-foreground text-xs'>
                {t('Start Time')}
              </div>
              <Input
                type='datetime-local'
                value={draftStart}
                aria-label={t('Start Time')}
                onChange={(e) => setDraftStart(e.target.value)}
                className='h-8 text-sm leading-5 tabular-nums'
              />
            </div>
            <span className='text-muted-foreground hidden pb-2 text-xs sm:block'>
              ~
            </span>
            <div className='space-y-1.5'>
              <div className='text-muted-foreground text-xs'>
                {t('End Time')}
              </div>
              <Input
                type='datetime-local'
                value={draftEnd}
                aria-label={t('End Time')}
                onChange={(e) => setDraftEnd(e.target.value)}
                className='h-8 text-sm leading-5 tabular-nums'
              />
            </div>
          </div>

          <div className='flex flex-wrap gap-1.5'>
            {/* [user-ui] preset buttons come from lib/time-range-presets (same ranges as upstream) */}
            {RANGE_PRESETS.map((preset) => (
              <Button
                key={preset.kind}
                type='button'
                variant='secondary'
                size='sm'
                className='h-7 flex-1 px-2 text-xs'
                onClick={() => applyPreset(preset.kind)}
              >
                {t(preset.buttonKey)}
              </Button>
            ))}
          </div>

          <div className='flex justify-end'>
            <Button size='sm' className='h-8' onClick={applyDraft}>
              {t('Confirm')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
