import { ArrowUp } from "lucide-react";
import Mark from "./brand/Mark";
import { TextLink } from "./ui";
import Year from "./Year";
import { CONTACT_EMAIL, CONTACT_MAILTO, GITHUB_URL, LINKEDIN_URL, REPO_URL, SITE_NAME } from "../data/site";

/**
 * The foot of every page. It does not repeat the navbar: it carries the things
 * the navbar doesn't — the profiles and address, the site's source, and a way
 * back to the top of a long page.
 */
export default function Footer() {
  return (
    <footer className="md-site-footer site-foot">
      <div className="site-foot-in">
        <div className="site-foot-id">
          <Mark size={22} />
          <span className="md-label">
            {SITE_NAME} · © <Year />
          </span>
        </div>
        <nav aria-label="Elsewhere" className="site-foot-links">
          <TextLink href={GITHUB_URL}>GitHub</TextLink>
          <TextLink href={LINKEDIN_URL}>LinkedIn</TextLink>
          <TextLink href={CONTACT_MAILTO}>{CONTACT_EMAIL}</TextLink>
          <TextLink href={REPO_URL}>Site source</TextLink>
        </nav>
        <a href="#main" className="md-btn md-btn-ghost md-btn-sm site-foot-top">
          <ArrowUp size={14} aria-hidden /> Back to top
        </a>
      </div>
    </footer>
  );
}
