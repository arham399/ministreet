export function AnnouncementBar() {
  const text = "✨ Adorably enchanting treasures, made to sparkle with you.";

  return (
    <div className="bg-[var(--brand-pink)] text-white text-center text-[11px] sm:text-xs py-2.5 px-4 tracking-wide">
      <p className="font-medium">{text}</p>
    </div>
  );
}
