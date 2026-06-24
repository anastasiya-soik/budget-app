const Sk = ({ w = '100%', h = '14px', r = '8px', style }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-shine) 50%, var(--skeleton-base) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear', flexShrink: 0, ...style }} />
)

export function SkeletonOverview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'linear-gradient(135deg,rgba(229,43,80,0.2),rgba(160,21,58,0.2),rgba(26,16,96,0.2))', borderRadius: '14px', padding: '24px' }}>
        <Sk w="80px" h="11px" r="4px" style={{ marginBottom: '10px', opacity: 0.5 }} />
        <Sk w="60%" h="34px" r="6px" style={{ opacity: 0.4 }} />
        <Sk w="120px" h="11px" r="4px" style={{ marginTop: '10px', opacity: 0.3 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Sk h="50px" r="12px" />
        <Sk h="50px" r="12px" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[0, 1].map(i => (
          <div key={i} style={{ background: 'var(--surface)', border: '0.5px solid var(--border-card)', borderRadius: '14px', padding: '16px' }}>
            <Sk w="36px" h="36px" r="10px" style={{ marginBottom: '12px' }} />
            <Sk w="56px" h="10px" r="4px" style={{ marginBottom: '8px' }} />
            <Sk w="90px" h="20px" r="4px" />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        {[0, 1].map(i => (
          <div key={i} style={{ background: 'var(--surface)', border: '0.5px solid var(--border-card)', borderRadius: '14px', padding: '20px' }}>
            <Sk w="130px" h="12px" r="4px" style={{ marginBottom: '18px' }} />
            <Sk h="200px" r="8px" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonTransactions() {
  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border-card)', borderRadius: '14px', overflow: 'hidden' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderTop: i !== 0 ? '1px solid var(--tx-border)' : 'none' }}>
          <Sk w="36px" h="36px" r="10px" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Sk w={`${50 + (i % 3) * 20}%`} h="12px" r="4px" />
            <Sk w="60px" h="10px" r="4px" />
          </div>
          <Sk w="70px" h="13px" r="4px" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonGoals() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} style={{ background: 'var(--surface)', border: '0.5px solid var(--border-card)', borderTop: '3px solid var(--border-card)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Sk w={`${100 + i * 30}px`} h="14px" r="4px" />
              <Sk w="80px" h="10px" r="4px" />
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Sk w="28px" h="28px" r="8px" />
              <Sk w="28px" h="28px" r="8px" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Sk w="90px" h="11px" r="4px" />
            <Sk w="110px" h="11px" r="4px" />
          </div>
          <Sk h="6px" r="99px" />
          <Sk w="80px" h="10px" r="4px" style={{ marginTop: '6px' }} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonBudget() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{ background: 'var(--surface)', border: '0.5px solid var(--border-card)', borderLeft: '3px solid var(--border-card)', borderRadius: '14px', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sk w="10px" h="10px" r="50%" />
              <Sk w={`${80 + i * 20}px`} h="13px" r="4px" />
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Sk w="26px" h="26px" r="7px" />
              <Sk w="26px" h="26px" r="7px" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Sk w="90px" h="11px" r="4px" />
            <Sk w="100px" h="11px" r="4px" />
          </div>
          <Sk h="6px" r="99px" />
        </div>
      ))}
    </div>
  )
}
