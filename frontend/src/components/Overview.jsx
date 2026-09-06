import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts'
import analyticsApi from '../api/analytics'
import authApi from '../api/auth'
import useAuthStore from '../store/authStore'
import { formatMoney, currentMonth, shiftMonth } from '../utils'
import { SkeletonOverview } from './ui/Skeleton'
import { useToast } from '../hooks/useToast'

const FALLBACK_COLORS = ['#E52B50', '#64A0FF', '#AA40FF', '#E8A020', '#10b981', '#2060D0']

const RADIAN = Math.PI / 180
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.07) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600} style={{ pointerEvents: 'none' }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

const Overview = ({ onQuickAdd }) => {
  const { user } = useAuthStore()
  const { t, i18n } = useTranslation()
  const showToast = useToast()
  const currency = user?.currency || 'USD'
  const month = currentMonth()
  // Month shown in the "spending by category" pie chart — independently
  // navigable, capped so it can never go past the current month.
  const [selectedMonth, setSelectedMonth] = useState(month)
  const isCurrentMonthSelected = selectedMonth >= currentMonth()
  const goPrevMonth = () => setSelectedMonth((m) => shiftMonth(m, -1))
  const goNextMonth = () => setSelectedMonth((m) => (m >= currentMonth() ? m : shiftMonth(m, 1)))
  const goToday = () => setSelectedMonth(currentMonth())

  const [editingBalance, setEditingBalance] = useState(false)
  const [editValue, setEditValue] = useState('')
  const queryClient = useQueryClient()

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['analytics', 'summary', month],
    queryFn: () => analyticsApi.summary(month),
  })

  const { data: monthSummary, isLoading: monthSumLoading } = useQuery({
    queryKey: ['analytics', 'summary', selectedMonth],
    queryFn: () => analyticsApi.summary(selectedMonth),
  })

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['analytics', 'categories', selectedMonth],
    queryFn: () => analyticsApi.categories(selectedMonth),
  })

  // Fixed 6-month lookback, used only for the "avg. expense" subtitle below.
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['analytics', 'trend', 6],
    queryFn: () => analyticsApi.trend(6),
  })

  const { data: rtData } = useQuery({
    queryKey: ['analytics', 'running-total'],
    queryFn: () => analyticsApi.runningTotal(),
  })

  const saveBalanceMutation = useMutation({
    mutationFn: (cents) => authApi.updateMe({ opening_balance_cents: cents }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'running-total'] })
      setEditingBalance(false)
      showToast(t('overview.openingBalanceSaved'))
    },
  })

  const runningTotalMV = useMotionValue(0)
  const incomeMV = useMotionValue(0)
  const expenseMV = useMotionValue(0)
  const runningTotalFmt = useTransform(runningTotalMV, v => formatMoney(Math.round(v), currency))
  const incomeFmt = useTransform(incomeMV, v => formatMoney(Math.round(v), currency))
  const expenseFmt = useTransform(expenseMV, v => formatMoney(Math.round(v), currency))

  useEffect(() => {
    animate(runningTotalMV, rtData?.running_total_cents ?? 0, { duration: 0.75, ease: [0.22, 1, 0.36, 1] })
  }, [rtData?.running_total_cents])

  useEffect(() => {
    animate(incomeMV, summary?.income_cents ?? 0, { duration: 0.75, ease: [0.22, 1, 0.36, 1] })
    animate(expenseMV, summary?.expense_cents ?? 0, { duration: 0.75, ease: [0.22, 1, 0.36, 1] })
  }, [summary?.income_cents, summary?.expense_cents])

  const pieItems = catData?.items || []

  if (sumLoading && catLoading && monthSumLoading && trendLoading) {
    return <SkeletonOverview />
  }

  const monthLabel = new Date().toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', { month: 'long' })
  const selectedMonthLabel = (() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'long', year: 'numeric', timeZone: 'UTC',
    })
  })()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Hero running total card */}
      <motion.div
        custom={0} variants={cardVariants} initial="hidden" animate="visible"
        style={{
          background: 'linear-gradient(135deg, #E52B50 0%, #A0153A 45%, #1A1060 100%)',
          borderRadius: '14px', padding: '24px', position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,160,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '35%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,160,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '6px', marginTop: 0 }}>
          {t('overview.runningTotal')}
        </p>
        <motion.p style={{ color: 'white', fontSize: '36px', fontWeight: 700, letterSpacing: '-0.5px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {runningTotalFmt}
        </motion.p>

        {/* Monthly result subtitle */}
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: '8px 0 0', fontWeight: 500 }}>
          {monthLabel}: +{formatMoney(summary?.income_cents ?? 0, currency)} / −{formatMoney(summary?.expense_cents ?? 0, currency)}
        </p>

        {/* Hint when running total looks wrong due to missing opening balance */}
        {(rtData?.running_total_cents ?? 0) < 0 && (rtData?.opening_balance_cents ?? 0) === 0 && (
          <p style={{ color: 'rgba(255,220,100,0.9)', fontSize: '11px', margin: '8px 0 0', fontWeight: 500 }}>
            💡 {t('overview.openingBalanceHint')}
          </p>
        )}

        {/* Opening balance inline edit */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {editingBalance ? (
            <>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{t('overview.openingBalance')}:</span>
              <input
                type="number"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveBalanceMutation.mutate(Math.round(parseFloat(editValue || '0') * 100))
                  if (e.key === 'Escape') setEditingBalance(false)
                }}
                style={{ width: '100px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '3px 8px', color: 'white', fontSize: '12px', outline: 'none' }}
                autoFocus
              />
              <button onClick={() => saveBalanceMutation.mutate(Math.round(parseFloat(editValue || '0') * 100))}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '12px', padding: '3px 8px', cursor: 'pointer' }}>✓</button>
              <button onClick={() => setEditingBalance(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '12px', padding: '3px 6px', cursor: 'pointer' }}>✕</button>
            </>
          ) : (
            <button
              onClick={() => { setEditValue(((rtData?.opening_balance_cents ?? 0) / 100).toFixed(2)); setEditingBalance(true) }}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '11px', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {t('overview.openingBalance')}: {formatMoney(rtData?.opening_balance_cents ?? 0, currency)} ✏️
            </button>
          )}
        </div>
      </motion.div>

      {/* Quick add buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onQuickAdd?.('income')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '14px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.08)', color: '#059669', fontSize: '14px', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1, fontWeight: 700 }}>+</span> {t('overview.addIncome')}
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onQuickAdd?.('expense')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '14px', borderRadius: '12px', border: '1px solid rgba(229,43,80,0.25)', background: 'rgba(229,43,80,0.08)', color: 'var(--icon-a-color)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1, fontWeight: 700 }}>+</span> {t('overview.addExpense')}
        </motion.button>
      </div>

      {/* Income + Expense stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border-card)', borderRadius: '14px', padding: '16px' }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--icon-b)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--icon-b-color)" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7l7-7 7 7" />
            </svg>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', marginTop: 0 }}>{t('overview.income')}</p>
          <motion.p style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{incomeFmt}</motion.p>
        </motion.div>

        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border-card)', borderRadius: '14px', padding: '16px' }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--icon-a)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--icon-a-color)" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7l-7 7-7-7" />
            </svg>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', marginTop: 0 }}>{t('overview.expenses')}</p>
          <motion.p style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expenseFmt}</motion.p>
          {trendData?.items?.length >= 2 && (() => {
            const slice = trendData.items.slice(-3)
            const avg = Math.round(slice.reduce((s, i) => s + i.expense_cents, 0) / slice.length)
            return <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '4px 0 0' }}>{t('overview.avgExpense', { amount: formatMoney(avg, currency) })}</p>
          })()}
        </motion.div>
      </div>

      {/* Monthly analytics — navigable spending-by-category pie chart */}
      <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible"
        style={{ background: 'var(--surface)', border: '0.5px solid var(--border-card)', borderRadius: '14px', padding: '20px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t('overview.spendingByCategory')}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={goPrevMonth}
              style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', background: 'var(--bg)', color: 'var(--text-muted)' }}
            >
              {t('overview.prevMonth')}
            </button>
            <button
              onClick={goToday}
              disabled={isCurrentMonthSelected}
              style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: 'none', background: 'var(--bg)', color: 'var(--text-muted)', opacity: isCurrentMonthSelected ? 0.4 : 1, cursor: isCurrentMonthSelected ? 'default' : 'pointer' }}
            >
              {t('overview.todayMonth')}
            </button>
            <button
              onClick={goNextMonth}
              disabled={isCurrentMonthSelected}
              style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, border: 'none', background: 'var(--bg)', color: 'var(--text-muted)', opacity: isCurrentMonthSelected ? 0.4 : 1, cursor: isCurrentMonthSelected ? 'default' : 'pointer' }}
            >
              {t('overview.nextMonth')}
            </button>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px', textTransform: 'capitalize' }}>{selectedMonthLabel}</p>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {t('overview.income')}: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(monthSummary?.income_cents ?? 0, currency)}</strong>
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {t('overview.expenses')}: <strong style={{ color: 'var(--text-primary)' }}>{formatMoney(monthSummary?.expense_cents ?? 0, currency)}</strong>
          </span>
        </div>

        {pieItems.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', fontSize: '13px', color: 'var(--text-muted)' }}>
            {t('overview.noExpenseData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieItems} dataKey="total_cents" nameKey="name"
                cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}
                label={renderPieLabel}
                labelLine={false}
              >
                {pieItems.map((entry, i) => (
                  <Cell key={entry.category_id || i} fill={entry.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [formatMoney(v, currency), '']} contentStyle={{ borderRadius: '10px', border: '1px solid var(--border-card)', fontSize: '12px', background: 'var(--surface)', color: 'var(--text-primary)' }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </div>
  )
}

export default Overview
