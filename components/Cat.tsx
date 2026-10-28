"use client";
import { useEffect, useRef, useState } from "react";
import { Doodle } from "./Doodle";
export function Cat({ available, reaction = 0, small = false }: { available: boolean; reaction?: number; small?: boolean }) {
  const [pats, setPats] = useState(0);
  const [secret, setSecret] = useState(false);
  const [playing, setPlaying] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const sticker = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function stopIfReduced() {
      if (preference.matches) {
        video.current?.pause(); setPlaying(false);
        sticker.current?.getAnimations().forEach(animation => animation.cancel());
      }
    }
    preference.addEventListener("change", stopIfReduced);
    return () => preference.removeEventListener("change", stopIfReduced);
  }, []);
  useEffect(() => {
    const clip = video.current;
    if (!pats || !clip || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    clip.currentTime = 0;
    void clip.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [pats]);
  function pat() {
    const next = pats + 1; setPats(next);
    if (next % 5 === 0) { setSecret(true); clearTimeout(timer.current); timer.current = setTimeout(() => setSecret(false), 5500); }
  }
  const beat = pats + reaction;
  useEffect(() => {
    if (!beat || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = sticker.current?.animate([
      { scale: "1", rotate: "0deg" }, { scale: "1.05 .92", rotate: "-3deg", offset: .25 },
      { scale: ".97 1.03", rotate: "3deg", offset: .55 }, { scale: "1", rotate: "-1deg", offset: .75 },
      { scale: "1", rotate: "0deg" },
    ], { duration: 720, easing: "cubic-bezier(.2,.7,.25,1)" });
    return () => animation?.cancel();
  }, [beat]);
  return <div className={`cat-wrap ${small ? "cat-small" : ""}`}>
    <button className="cat-button" type="button" onClick={pat} aria-label="Give the cat a little pat">
      <span className="cat-sticker" ref={sticker}>
        {available && <span className="cat-media">
          {/* An unretouched frame from the supplied clip; the clip itself is intact. */}
          <img src="/cat.png" width="720" height="720" alt="Our wide-eyed, stupidly cute little orange cat" draggable="false" />
          <video ref={video} className={playing ? "cat-video playing" : "cat-video"} src="/cat.mp4" muted playsInline preload="none" aria-hidden="true" tabIndex={-1}
            onEnded={() => setPlaying(false)} onError={() => setPlaying(false)} />
        </span>}
      </span>
    </button>
    {beat > 0 && <span className="cat-hearts" key={`hearts-${beat}`} aria-hidden="true">{[0, 1, 2, 3].map(n => <Doodle key={n} className={`heart-fly heart-${n}`} kind={n === 3 ? "paw" : "heart"} />)}</span>}
    <span className={`secret handwritten ${secret ? "secret-visible" : ""}`} role="status">{secret && <>you found the secret ♡<br />i love you.</>}</span>
  </div>;
}
