import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import CodeBlock from "@/components/bbcode/CodeBlock";

interface BBCodeRendererProps {
  content: string;
}

const SpoilerBlock = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-md my-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium bg-muted/50 hover:bg-muted transition-colors rounded-t-md"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {title || "Спойлер"}
      </button>
      {open && <div className="px-3 py-2 text-sm">{children}</div>}
    </div>
  );
};

const extractYouTubeId = (value: string) => {
  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_-]{6,}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/i);
  return match?.[1] || null;
};

const extractRutubeId = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/rutube\.ru\/video\/(?:private\/)?([a-z0-9-]+)/i);
  return match?.[1] || null;
};

const extractVkVideo = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/video(-?\d+)_(-?\d+)/i);
  if (!match) return null;
  return { oid: match[1], id: match[2] };
};

const resolveMedia = (value: string) => {
  const trimmed = value.trim();
  const youtubeId = extractYouTubeId(trimmed);
  if (youtubeId) {
    return { type: "iframe" as const, src: `https://www.youtube.com/embed/${youtubeId}`, title: "YouTube video" };
  }

  const rutubeId = extractRutubeId(trimmed);
  if (rutubeId) {
    return { type: "iframe" as const, src: `https://rutube.ru/play/embed/${rutubeId}`, title: "Rutube video" };
  }

  const vkVideo = extractVkVideo(trimmed);
  if (vkVideo) {
    return {
      type: "iframe" as const,
      src: `https://vkvideo.ru/video_ext.php?oid=${vkVideo.oid}&id=${vkVideo.id}&hd=2&autoplay=0`,
      title: "VK Video",
    };
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch?.[1]) {
    return { type: "iframe" as const, src: `https://player.vimeo.com/video/${vimeoMatch[1]}`, title: "Vimeo video" };
  }

  const dailymotionMatch = trimmed.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/i);
  if (dailymotionMatch?.[1]) {
    return { type: "iframe" as const, src: `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`, title: "Dailymotion video" };
  }

  if (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(trimmed)) {
    return { type: "image" as const, src: trimmed, title: "Embedded image" };
  }

  return null;
};

const MediaEmbed = ({ value }: { value: string }) => {
  const media = resolveMedia(value);

  if (!media) {
    return (
      <a href={value.trim()} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 break-all">
        {value.trim()}
      </a>
    );
  }

  if (media.type === "image") {
    return <img src={media.src} alt="embedded media" className="max-w-full rounded-md my-2" loading="lazy" />;
  }

  return (
    <div className="my-2 aspect-video w-full max-w-3xl overflow-hidden rounded-md border border-border/60 bg-card">
      <iframe
        src={media.src}
        title={media.title}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
};

const parseBBCode = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Process sequentially with regex
  const patterns: Array<{
    regex: RegExp;
    render: (match: RegExpMatchArray) => React.ReactNode;
  }> = [
    // QUOTE
    {
      regex: /\[QUOTE="([^"]+)"\]([\s\S]*?)\[\/QUOTE\]/gi,
      render: (m) => (
        <div key={key++} className="border-l-4 border-primary/50 bg-muted/50 rounded-r-md p-3 my-2">
          <p className="text-xs font-semibold text-primary mb-1">{m[1]} написал(а):</p>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            <BBCodeRenderer content={m[2].trim()} />
          </div>
        </div>
      ),
    },
    // SPOILER
    {
      regex: /\[SPOILER(?:="([^"]*)")?\]([\s\S]*?)\[\/SPOILER\]/gi,
      render: (m) => (
        <SpoilerBlock key={key++} title={m[1] || "Спойлер"}>
          <BBCodeRenderer content={m[2].trim()} />
        </SpoilerBlock>
      ),
    },
    // OFFTOPIC
    {
      regex: /\[OFFTOPIC\]([\s\S]*?)\[\/OFFTOPIC\]/gi,
      render: (m) => (
        <div key={key++} className="border-l-4 border-muted-foreground/30 bg-muted/30 rounded-r-md p-3 my-2 opacity-75">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Оффтоп:</p>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            <BBCodeRenderer content={m[1].trim()} />
          </div>
        </div>
      ),
    },
    // CODE
    {
      regex: /\[CODE\]([\s\S]*?)\[\/CODE\]/gi,
      render: (m) => <CodeBlock key={key++} code={m[1]} />,
    },
    // IMG
    {
      regex: /\[IMG\]([\s\S]*?)\[\/IMG\]/gi,
      render: (m) => (
        <img key={key++} src={m[1].trim()} alt="image" className="max-w-full rounded-md my-2" loading="lazy" />
      ),
    },
    // URL with text
    {
      regex: /\[URL="?([^"\]]+)"?\]([\s\S]*?)\[\/URL\]/gi,
      render: (m) => (
        <a key={key++} href={m[1]} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
          {m[2]}
        </a>
      ),
    },
    // URL without text
    {
      regex: /\[URL\]([\s\S]*?)\[\/URL\]/gi,
      render: (m) => (
        <a key={key++} href={m[1].trim()} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
          {m[1].trim()}
        </a>
      ),
    },
    // COLOR
    {
      regex: /\[COLOR="?([^"\]]+)"?\]([\s\S]*?)\[\/COLOR\]/gi,
      render: (m) => <span key={key++} style={{ color: m[1] }}>{m[2]}</span>,
    },
    // SIZE
    {
      regex: /\[SIZE="?(\d+)"?\]([\s\S]*?)\[\/SIZE\]/gi,
      render: (m) => {
        const size = Math.min(Math.max(parseInt(m[1]), 8), 36);
        return <span key={key++} style={{ fontSize: `${size}px` }}>{m[2]}</span>;
      },
    },
    // LIST with items
    {
      regex: /\[LIST\]([\s\S]*?)\[\/LIST\]/gi,
      render: (m) => {
        const items = m[1].split(/\[\*\]/).filter((s) => s.trim());
        return (
          <ul key={key++} className="list-disc list-inside my-2 space-y-1">
            {items.map((item, i) => (
              <li key={i} className="text-sm">{item.trim()}</li>
            ))}
          </ul>
        );
      },
    },
    // BOLD
    {
      regex: /\[B\]([\s\S]*?)\[\/B\]/gi,
      render: (m) => <strong key={key++}>{m[1]}</strong>,
    },
    // ITALIC
    {
      regex: /\[I\]([\s\S]*?)\[\/I\]/gi,
      render: (m) => <em key={key++}>{m[1]}</em>,
    },
    // UNDERLINE
    {
      regex: /\[U\]([\s\S]*?)\[\/U\]/gi,
      render: (m) => <u key={key++}>{m[1]}</u>,
    },
    // STRIKETHROUGH
    {
      regex: /\[S\]([\s\S]*?)\[\/S\]/gi,
      render: (m) => <s key={key++}>{m[1]}</s>,
    },
    // HEADING
    {
      regex: /\[H(\d)\]([\s\S]*?)\[\/H\1\]/gi,
      render: (m) => {
        const Tag = `h${m[1]}` as keyof JSX.IntrinsicElements;
        return <Tag key={key++} className="font-bold my-2">{m[2]}</Tag>;
      },
    },
    // CENTER
    {
      regex: /\[CENTER\]([\s\S]*?)\[\/CENTER\]/gi,
      render: (m) => <div key={key++} className="text-center">{m[1]}</div>,
    },
    // LEFT
    {
      regex: /\[LEFT\]([\s\S]*?)\[\/LEFT\]/gi,
      render: (m) => <div key={key++} className="text-left">{m[1]}</div>,
    },
    // RIGHT
    {
      regex: /\[RIGHT\]([\s\S]*?)\[\/RIGHT\]/gi,
      render: (m) => <div key={key++} className="text-right">{m[1]}</div>,
    },
    // INDENT
    {
      regex: /\[INDENT\]([\s\S]*?)\[\/INDENT\]/gi,
      render: (m) => <div key={key++} className="pl-6">{m[1]}</div>,
    },
    // MEDIA with explicit provider
    {
      regex: /\[MEDIA=(youtube|rutube|vk|vimeo|dailymotion)\]([\s\S]*?)\[\/MEDIA\]/gi,
      render: (m) => <MediaEmbed key={key++} value={m[2].trim()} />,
    },
    // MEDIA by URL
    {
      regex: /\[MEDIA\]([\s\S]*?)\[\/MEDIA\]/gi,
      render: (m) => <MediaEmbed key={key++} value={m[1].trim()} />,
    },
    // VIDEO alias
    {
      regex: /\[VIDEO\]([\s\S]*?)\[\/VIDEO\]/gi,
      render: (m) => <MediaEmbed key={key++} value={m[1].trim()} />,
    },
  ];

  // Process the text by finding the first matching pattern, splitting, rendering, repeat
  const processText = (input: string): React.ReactNode[] => {
    if (!input) return [];

    let firstMatch: { index: number; match: RegExpMatchArray; pattern: typeof patterns[0] } | null = null;

    for (const pattern of patterns) {
      pattern.regex.lastIndex = 0;
      const match = pattern.regex.exec(input);
      if (match && (firstMatch === null || match.index < firstMatch.index)) {
        firstMatch = { index: match.index, match, pattern };
      }
    }

    if (!firstMatch) {
      return [<span key={key++} className="whitespace-pre-wrap break-words">{input}</span>];
    }

    const result: React.ReactNode[] = [];
    const before = input.slice(0, firstMatch.index);
    if (before) {
      result.push(<span key={key++} className="whitespace-pre-wrap break-words">{before}</span>);
    }
    result.push(firstMatch.pattern.render(firstMatch.match));
    const after = input.slice(firstMatch.index + firstMatch.match[0].length);
    if (after) {
      result.push(...processText(after));
    }
    return result;
  };

  return processText(text);
};

const BBCodeRenderer = ({ content }: BBCodeRendererProps) => {
  const rendered = useMemo(() => {
    if (!content) return null;
    const nodes = parseBBCode(content);
    return nodes.length === 1 ? nodes[0] : <>{nodes}</>;
  }, [content]);

  return <div>{rendered}</div>;
};

export default BBCodeRenderer;
