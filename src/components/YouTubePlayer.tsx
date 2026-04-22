'use client'

type YouTubePlayerProps = {
  videoId: string
  title?: string
}

export default function YouTubePlayer({ videoId, title }: YouTubePlayerProps) {
  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title || 'YouTube video player'}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
