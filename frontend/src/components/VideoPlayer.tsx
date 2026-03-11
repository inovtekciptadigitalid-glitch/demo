function getYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '') || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.replace('/embed/', '') || null;
      }
      return parsed.searchParams.get('v');
    }
  } catch {
    // Ignore invalid URL.
  }
  return null;
}

function toEmbedUrl(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
}

export function VideoPlayer({ url, title }: { url: string; title: string }) {
  const embedUrl = toEmbedUrl(url);

  if (embedUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <video
      src={url}
      controls
      preload="metadata"
      className="w-full rounded-xl border border-slate-200"
    />
  );
}
