import { useEffect, useRef } from 'react';
import { COMPANIONS } from './companions.js';

export default function VideoAvatar({
  style = 'warm',
  isSpeaking = false,
  isListening = false,
  compact = false,
}) {
  const companion = COMPANIONS[style] || COMPANIONS.warm;
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.playbackRate = isSpeaking ? 1 : 0.7;
    const play = video.play();
    if (play?.catch) play.catch(() => {});
  }, [isSpeaking, companion.video]);

  return (
    <figure
      className={[
        'video-avatar',
        compact ? 'is-compact' : '',
        isSpeaking ? 'is-speaking' : '',
        isListening ? 'is-listening' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="video-avatar-frame">
        <video
          ref={ref}
          src={companion.video}
          poster={companion.poster}
          autoPlay
          muted
          loop
          playsInline
          aria-label={`${companion.label}, ${companion.mood} video companion`}
        />
      </div>
      <figcaption>
        <strong>{companion.label}</strong>
        <span>{companion.mood} presence</span>
      </figcaption>
    </figure>
  );
}
