import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'nazmo-ambient-music'

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = 0.35

    if (localStorage.getItem(STORAGE_KEY) === 'on') {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }, [])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      setPlaying(false)
      localStorage.setItem(STORAGE_KEY, 'off')
    } else {
      audio
        .play()
        .then(() => {
          setPlaying(true)
          localStorage.setItem(STORAGE_KEY, 'on')
        })
        .catch(() => setPlaying(false))
    }
  }

  return (
    <>
      <audio ref={audioRef} src="/audio/ambient-loop.m4a" loop preload="none" />
      <button
        type="button"
        className={`music-toggle${playing ? ' is-playing' : ''}`}
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? 'Pause background music' : 'Play soft background music'}
        title={playing ? 'Pause ambient music' : 'Play soft ambient music'}
      >
        <span className="music-toggle-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
    </>
  )
}
