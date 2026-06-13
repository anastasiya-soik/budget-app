export function Logo({ size = 28, dark = false }) {
  const c = dark ? '#FF6B84' : '#E52B50'
  const lc = dark ? '#FF9EAD' : '#FF6B84'

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes purrse-blink {
          0%, 88%, 100% { transform: scaleY(1); }
          93% { transform: scaleY(0.08); }
        }
        @keyframes purrse-ear-l {
          0%, 80%, 100% { transform: rotate(0deg); }
          85% { transform: rotate(-12deg); }
          92% { transform: rotate(4deg); }
        }
        @keyframes purrse-ear-r {
          0%, 82%, 100% { transform: rotate(0deg); }
          87% { transform: rotate(12deg); }
          94% { transform: rotate(-4deg); }
        }
        .purrse-eye {
          animation: purrse-blink 4s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .purrse-ear-l {
          animation: purrse-ear-l 5s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: 50% 100%;
        }
        .purrse-ear-r {
          animation: purrse-ear-r 5s ease-in-out infinite 0.4s;
          transform-box: fill-box;
          transform-origin: 50% 100%;
        }
      `}</style>

      {/* Background */}
      <circle cx="32" cy="32" r="32" fill={c}/>

      {/* Ears */}
      <polygon className="purrse-ear-l" points="10,24 19,8 25,27" fill={lc}/>
      <polygon className="purrse-ear-r" points="54,24 45,8 39,27" fill={lc}/>

      {/* Face */}
      <ellipse cx="32" cy="37" rx="20" ry="18" fill={lc}/>

      {/* Eyes white */}
      <ellipse className="purrse-eye" cx="24" cy="33" rx="3.5" ry="4" fill="white"/>
      <ellipse className="purrse-eye" cx="40" cy="33" rx="3.5" ry="4" fill="white"/>

      {/* Pupils */}
      <ellipse cx="24.8" cy="34" rx="1.5" ry="2" fill="#1a0a10"/>
      <ellipse cx="40.8" cy="34" rx="1.5" ry="2" fill="#1a0a10"/>

      {/* Eye shine */}
      <circle cx="25.5" cy="32.5" r="0.8" fill="white"/>
      <circle cx="41.5" cy="32.5" r="0.8" fill="white"/>

      {/* Nose */}
      <ellipse cx="32" cy="40" rx="2" ry="1.5" fill={c}/>

      {/* Mouth */}
      <path d="M28 43 Q32 47 36 43" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

      {/* Whiskers */}
      <line x1="11" y1="39" x2="24" y2="41" stroke="white" strokeWidth="1" opacity="0.65"/>
      <line x1="11" y1="43" x2="24" y2="43" stroke="white" strokeWidth="1" opacity="0.65"/>
      <line x1="53" y1="39" x2="40" y2="41" stroke="white" strokeWidth="1" opacity="0.65"/>
      <line x1="53" y1="43" x2="40" y2="43" stroke="white" strokeWidth="1" opacity="0.65"/>
    </svg>
  )
}
