import { motion } from 'framer-motion'

const COLORS = ['#E52B50', '#64A0FF', '#10b981', '#E8A020', '#AA40FF', '#FFD700', '#FF6B84', '#8BBFFF']
const COUNT = 20

export function Confetti() {
  const pieces = Array.from({ length: COUNT }, (_, i) => {
    const angle = (i / COUNT) * 360 + (Math.random() * 30 - 15)
    const dist = 90 + (i % 4) * 35
    const rad = (angle * Math.PI) / 180
    return {
      x: Math.cos(rad) * dist,
      y: Math.sin(rad) * dist - 40,
      color: COLORS[i % COLORS.length],
      size: 6 + (i % 3) * 3,
      delay: i * 0.025,
    }
  })

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1.4, rotate: 270 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: p.delay }}
          style={{ position: 'absolute', width: p.size, height: p.size, borderRadius: i % 2 === 0 ? '50%' : '2px', background: p.color }}
        />
      ))}
    </div>
  )
}
