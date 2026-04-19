export default function ProgressBar({ progress }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: `${progress * 100}%`,
        height: '2px',
        background: 'linear-gradient(90deg, #4466ff, #8844ff, #ff44aa)',
        zIndex: 200,
        transition: 'width 0.1s linear',
        pointerEvents: 'none',
        boxShadow: '0 0 8px rgba(136,68,255,0.6)',
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  )
}
