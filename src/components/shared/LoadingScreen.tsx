interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({
  message = 'Loading your NearCart workspace...',
  fullScreen = false,
}: LoadingScreenProps) {
  return (
    <div
      className={[
        'flex items-center justify-center rounded-[1.75rem] border border-white/80 bg-white/85 p-8 shadow-[0_20px_70px_-45px_rgba(17,33,23,0.35)]',
        fullScreen ? 'min-h-screen rounded-none border-none shadow-none' : 'min-h-56',
      ].join(' ')}
    >
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-nearcart-100 border-t-nearcart-600" />
        <p className="text-sm font-medium text-slate-600">{message}</p>
      </div>
    </div>
  )
}
