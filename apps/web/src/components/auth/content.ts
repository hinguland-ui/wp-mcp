/**
 * All copy for the auth pages lives here, so it can be edited without touching layout.
 * Replace `testimonials` with real customer quotes once you have them.
 */

export const brand = {
  name: 'WPConnect AI',
  headline: ['Connect securely.', 'Automate confidently.'],
  subhead: 'Connect AI assistants to your WordPress sites in minutes — with scoped permissions that keep you in control of every action.',
};

export type Testimonial = { quote: string; name: string; role: string; initials: string };

// Product highlights shown in the quote-card style. Swap in real customer quotes when available.
export const testimonials: Testimonial[] = [
  { quote: 'Pair a site with a one-time code. No passwords shared, nothing to copy into your AI app by hand.', name: 'One-click pairing', role: 'Plugin + dashboard', initials: 'PC' },
  { quote: 'Choose exactly which posts, pages and settings an AI app can read or change — per website.', name: 'Scoped permissions', role: 'Per-site access control', initials: 'SP' },
  { quote: 'Every tool call is logged with who, what and when, so nothing happens behind your back.', name: 'Activity log', role: 'Full audit trail', initials: 'AL' },
  { quote: 'Apps connect through standard OAuth 2.1 consent, and you can revoke access at any time.', name: 'OAuth 2.1 consent', role: 'Open standards', initials: 'OA' },
  { quote: 'Short-lived tokens rotate automatically and site secrets are encrypted at rest.', name: 'Secure by default', role: 'Encryption + rotation', initials: 'SD' },
];

export const worksWith = {
  title: 'Works with any MCP-compatible AI app',
  items: ['Claude', 'ChatGPT', 'Cursor', 'VS Code', 'Windsurf', 'WordPress'],
};

// Point these at real pages when you have them.
export const footerLinks = [
  { label: 'Terms', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Support', href: '#' },
];
