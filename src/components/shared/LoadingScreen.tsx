interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({
  message = 'Loading your NearKart workspace...',
  fullScreen = false,
}: LoadingScreenProps) {
  return (
    <div
      className={[
        'flex items-center justify-center rounded-[1.75rem] border border-ink-100 bg-white p-8 shadow-[var(--shadow-card)]',
        fullScreen ? 'min-h-screen rounded-none border-none shadow-none' : 'min-h-56',
      ].join(' ')}
    >
      <div className="space-y-5 text-center">
        <div className="relative mx-auto h-14 w-14">
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-nearkart-100 border-t-nearkart-600" />
          <div
            className="absolute inset-[5px] animate-spin rounded-full border-[3px] border-transparent border-t-accent-400 [animation-direction:reverse] [animation-duration:1.1s]"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-2 w-2 animate-pulse rounded-full bg-nearkart-600" />
          </span>
        </div>
        <p className="text-sm font-semibold text-ink-600">{message}</p>
      </div>
    </div>
  )
}
