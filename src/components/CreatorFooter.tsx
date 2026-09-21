import { MailIcon, LinkedinIcon, WhatsAppIcon, LogoGlyph } from "./icons";
import { CONTACT, SITE } from "@/lib/site";

export function CreatorFooter() {
  return (
    <footer className="creator-footer">
      <div className="creator-info">
        <div className="creator-avatar" aria-hidden="true">
          <LogoGlyph className="h-[18px] w-[18px]" />
        </div>
        <div>
          <p className="creator-name">{CONTACT.creatorName}</p>
          <p className="creator-role">{CONTACT.creatorRole}</p>
        </div>
      </div>
      <div className="creator-links">
        <a
          className="creator-link"
          href={CONTACT.gmailCompose}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MailIcon />
          <span>تواصل عبر البريد</span>
        </a>
        <a
          className="creator-link"
          href={CONTACT.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon />
          <span>واتساب</span>
        </a>
        <a
          className="creator-link"
          href={CONTACT.linkedin}
          target="_blank"
          rel="noopener noreferrer"
        >
          <LinkedinIcon />
          LinkedIn
        </a>
      </div>
      <p className="creator-copyright">
        © 2026 {SITE.name} — {SITE.brandLine}
      </p>
    </footer>
  );
}