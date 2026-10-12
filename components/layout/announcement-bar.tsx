const serviceNotes = [
  "Flat Rs. 250 delivery · Complimentary shipping on orders of Rs. 5,000 or more",
  "Prepaid orders only · Cash on delivery is unavailable",
];

function ServiceNoteItems() {
  return serviceNotes.map((note) => (
    <span key={note} className="announcement-service-message">
      <span aria-hidden="true" className="announcement-service-dot" />
      {note}
    </span>
  ));
}

export function AnnouncementBar() {
  return (
    <div className="announcement-bar text-white">
      <div className="announcement-brand-line px-4 py-2 text-center text-[11px] tracking-wide sm:py-2.5 sm:text-xs">
        <p className="font-medium">Adorably enchanting treasures, made to sparkle with you.</p>
      </div>
      <div className="announcement-service-window" role="region" aria-label="Shipping and payment information">
        <span className="sr-only">Flat Rs. 250 delivery on orders below Rs. 5,000; complimentary shipping on orders of Rs. 5,000 or more. Prepaid orders only; cash on delivery is unavailable.</span>
        <div className="announcement-service-track" aria-hidden="true">
          <div className="announcement-service-group"><ServiceNoteItems /></div>
          <div className="announcement-service-group"><ServiceNoteItems /></div>
        </div>
      </div>
    </div>
  );
}
