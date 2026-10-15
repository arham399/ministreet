import type { StoreSettings } from "@/lib/settings/store-settings";

function getServiceNotes(settings: StoreSettings) {
  return [
    `Flat Rs. ${formatAmount(settings.defaultShippingCost)} delivery · Complimentary shipping on orders of Rs. ${formatAmount(settings.freeShippingThreshold)} or more`,
    "Prepaid orders only · Cash on delivery is unavailable",
  ];
}

function ServiceNoteItems({ notes }: { notes: string[] }) {
  return notes.map((note) => (
    <span key={note} className="announcement-service-message">
      <span aria-hidden="true" className="announcement-service-dot" />
      {note}
    </span>
  ));
}

function formatAmount(amount: number) {
  return amount.toLocaleString("en-PK", { maximumFractionDigits: 2 });
}

export function AnnouncementBar({ settings }: { settings: StoreSettings }) {
  const notes = getServiceNotes(settings);
  const accessibleMessage = `${notes[0]}. ${notes[1]}.`;
  return (
    <div className="announcement-bar text-white">
      <div className="announcement-brand-line px-4 py-2 text-center text-[11px] tracking-wide sm:py-2.5 sm:text-xs">
        <p className="font-medium">{settings.announcementText}</p>
      </div>
      <div className="announcement-service-window" role="region" aria-label="Shipping and payment information">
        <span className="sr-only">{accessibleMessage}</span>
        <div className="announcement-service-track" aria-hidden="true">
          <div className="announcement-service-group"><ServiceNoteItems notes={notes} /></div>
          <div className="announcement-service-group"><ServiceNoteItems notes={notes} /></div>
        </div>
      </div>
    </div>
  );
}
