import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Pie, PieChart, Sector } from 'recharts'

import analyticsApi from '../api/analytics'
import { formatMoney, currentMonth, shiftMonth } from '../utils'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const FALLBACK_COLORS = ['#E52B50', '#64A0FF', '#AA40FF', '#E8A020', '#10b981', '#2060D0']

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

// Turns a category name into a stable, CSS-custom-property-safe key
// (ChartStyle emits one `--color-<key>` variable per chartConfig entry).
const slugify = (str, i) => {
  const slug = (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return slug || `category-${i}`
}

// Donut chart of spending by category for a navigable month, built on
// shadcn/ui's Card + Chart primitives (see src/components/ui/{card,chart}.jsx).
const CategoryPieChart = ({ currency, animationIndex = 3 }) => {
  const { t, i18n } = useTranslation()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())
  const [activeIndex, setActiveIndex] = useState(null)
  const isCurrentMonthSelected = selectedMonth >= currentMonth()

  const goPrevMonth = () => setSelectedMonth((m) => shiftMonth(m, -1))
  const goNextMonth = () => setSelectedMonth((m) => (m >= currentMonth() ? m : shiftMonth(m, 1)))
  const goToday = () => setSelectedMonth(currentMonth())

  const { data: monthSummary } = useQuery({
    queryKey: ['analytics', 'summary', selectedMonth],
    queryFn: () => analyticsApi.summary(selectedMonth),
  })

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['analytics', 'categories', selectedMonth],
    queryFn: () => analyticsApi.categories(selectedMonth),
  })

  useEffect(() => {
    setActiveIndex(null)
  }, [selectedMonth])

  // The backend groups everything past the top 5 categories into a single
  // bucket with category_id: null — give it a localized label instead of
  // the raw "Other" string that came back from the API.
  const pieItems = (catData?.items || []).map((item, i) => {
    const name = item.category_id ? item.name : t('overview.otherCategory')
    return { ...item, name, key: slugify(item.category_id ? item.name : 'other', i) }
  })

  const chartConfig = pieItems.reduce((acc, item, i) => {
    acc[item.key] = { label: item.name, color: item.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }
    return acc
  }, {})

  const chartData = pieItems.map((item) => ({ ...item, fill: `var(--color-${item.key})` }))

  const toggleSlice = (i) => setActiveIndex((cur) => (cur === i ? null : i))

  const selectedMonthLabel = (() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'long', year: 'numeric', timeZone: 'UTC',
    })
  })()

  return (
    <motion.div custom={animationIndex} variants={cardVariants} initial="hidden" animate="visible">
      <Card className="rounded-[14px] border-border/60 shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-0">
          <div>
            <CardTitle className="text-[13px] font-semibold">{t('overview.spendingByCategory')}</CardTitle>
            <CardDescription className="mt-1 text-xs capitalize">{selectedMonthLabel}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label={t('overview.prevMonth')}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goToday}
              disabled={isCurrentMonthSelected}
              className="rounded-md px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              {t('overview.todayMonth')}
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              disabled={isCurrentMonthSelected}
              aria-label={t('overview.nextMonth')}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="pb-0 pt-4">
          <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
            <span>
              {t('overview.income')}: <strong className="font-semibold text-foreground">{formatMoney(monthSummary?.income_cents ?? 0, currency)}</strong>
            </span>
            <span>
              {t('overview.expenses')}: <strong className="font-semibold text-foreground">{formatMoney(monthSummary?.expense_cents ?? 0, currency)}</strong>
            </span>
          </div>

          {!catLoading && pieItems.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
              {t('overview.noExpenseData')}
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[220px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel formatter={(value) => formatMoney(value, currency)} />}
                />
                <Pie
                  data={chartData}
                  dataKey="total_cents"
                  nameKey="key"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  onClick={(_, i) => toggleSlice(i)}
                  cursor="pointer"
                  shape={({ index, outerRadius = 0, ...props }) =>
                    index === activeIndex
                      ? <Sector {...props} outerRadius={outerRadius + 8} />
                      : <Sector {...props} outerRadius={outerRadius} />
                  }
                />
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>

        {pieItems.length > 0 && (
          <CardFooter className="flex-col items-stretch gap-1 pt-4">
            {pieItems.map((item, i) => (
              <div
                key={item.key}
                onClick={() => toggleSlice(i)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors select-none',
                  activeIndex === i ? 'bg-muted' : 'hover:bg-muted/60',
                  activeIndex !== null && activeIndex !== i && 'opacity-50'
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                  />
                  <span className="truncate text-xs text-foreground">{item.name}</span>
                </div>
                <div className="flex shrink-0 items-baseline gap-2.5">
                  <span className="text-xs font-semibold text-foreground">{formatMoney(item.total_cents, currency)}</span>
                  <span className="w-[34px] text-right text-[11px] text-muted-foreground">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}

export default CategoryPieChart
