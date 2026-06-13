export function Logo({ size = 28 }) {
  return (
    <img
      src="/favicon.svg"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
      alt=""
    />
  )
}
