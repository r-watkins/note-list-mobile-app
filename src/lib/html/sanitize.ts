import sanitizeHtml from 'sanitize-html';

/**
 * Hermes/New-Architecture spike (Task 16): PASS. Verified on-device (Pixel_10_Pro_DEBUG,
 * SDK 57, Expo Go) with adversarial input covering <script>, inline event-handler attributes
 * (onclick/onerror), javascript: hrefs, and disallowed structural tags (img/table/a). All were
 * neutralized correctly; allowed tags (p, strong, ul/li, h1) passed through unmodified with no
 * missing-global (Buffer/process/etc.) errors or crashes under Hermes. No Node polyfills were
 * added - sanitize-html's dependency chain (htmlparser2, postcss, deepmerge, etc.) is pure JS.
 * No hand-rolled fallback sanitizer is needed.
 *
 * AMENDMENT (Task 39, approved by user): extended h1-h3 to h1-h6. TenTap's built-in Toolbar
 * hardcodes its Heading submenu to H1-H6 (not overridable without forking the component), so
 * capping the sanitizer at h3 would silently strip H4-H6 formatting on save even though the
 * toolbar lets the user apply it. Spec §6.2's h1-h3 list is explicitly "suggested," not a hard
 * cap, so widening it here keeps every heading level the editor's own UI offers persistable.
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
];

export function sanitizeNoteHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}
