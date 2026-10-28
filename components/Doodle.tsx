export function Doodle({ kind = "heart", className = "" }: { kind?: "heart" | "arrow" | "paw"; className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "heart" ? <path d="M12 20S2.5 14.2 3 8.3C3.4 3.2 9.6 3.1 12 7.1c2.5-4.3 8.3-3.7 8.9 1C21.7 13.4 12 20 12 20Z" /> : kind === "arrow" ? <><path d="M4 12.5c5-.9 10 .6 16-1M14 5.5l6.2 6-5.7 6.8" /></> : <><path d="M7.1 17c-1.5 4.3 3.2 3.1 5 2.8 2 .5 6.3 1.4 5.1-2.8-1.5-5.5-7.8-5.5-10.1 0Z" /><ellipse cx="5" cy="11" rx="1.6" ry="2.2" transform="rotate(-25 5 11)" /><ellipse cx="10" cy="6.5" rx="1.6" ry="2.3" /><ellipse cx="15.5" cy="7" rx="1.6" ry="2.3" transform="rotate(15 15.5 7)" /><ellipse cx="20" cy="12" rx="1.5" ry="2.1" transform="rotate(30 20 12)" /></>}
  </svg>;
}
