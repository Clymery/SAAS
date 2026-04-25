"use client"

interface DashboardBackgroundProps {
  posterSrc?: string
  videoSrc?: string
}

export default function DashboardBackground({
  posterSrc = "/dashboard/background-poster.png",
  videoSrc,
}: DashboardBackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 top-16 z-0 overflow-hidden">
      <div className="absolute inset-0">
        {videoSrc ? (
          <video
            className="h-full w-full object-cover"
            src={videoSrc}
            poster={posterSrc}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          // Kept as img because this local asset may later be replaced by user-managed media.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="h-full w-full object-cover"
            src={posterSrc}
            alt="Dashboard background"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-white/15" />
    </div>
  )
}
