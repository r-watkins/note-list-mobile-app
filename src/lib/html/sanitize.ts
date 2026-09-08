import sanitizeHtml from 'sanitize-html';

/**
 * Hermes/New-Architecture spike (Task 16): PASS. Verified on-device (Pixel_10_Pro_DEBUG,
 * SDK 57, Expo Go) with adversarial input covering <script>, inline event-handler attributes
 * (onclick/onerror), javascript: hrefs, and disallowed structural tags (img/table/a). All were
 * neutralized correctly; allowed tags (p, strong, ul/li, h1) passed through unmodified with no
 * missing-global (Buffer/process/etc.) errors or crashes under Hermes. No Node polyfills were
 * added - sanitize-html's dependency chain (htmlparser2, postcss, deepmerge, etc.) is pure JS.
 * No hand-rolled fallback sanitizer is needed.
 */
const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'];

export function sanitizeNoteHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}
