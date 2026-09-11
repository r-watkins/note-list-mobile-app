import { deriveNotePlainText, sanitizeNoteHtml } from '@/lib/html/sanitize';

describe('sanitizeNoteHtml', () => {
  it('preserves the allowed formatting tags', () => {
    const input =
      '<h1>Title</h1><p>Body <strong>bold</strong> <em>italic</em> <u>underline</u></p>' +
      '<ul><li>one</li></ul><ol><li>two</li></ol><b>b</b><i>i</i><h2>h2</h2><h3>h3</h3>' +
      '<h4>h4</h4><h5>h5</h5><h6>h6</h6><br>';
    // sanitize-html normalizes void elements to self-closing form.
    expect(sanitizeNoteHtml(input)).toBe(input.replace('<br>', '<br />'));
  });

  it('strips script tags and their content entirely', () => {
    expect(sanitizeNoteHtml('<p>safe</p><script>alert(1)</script>')).toBe('<p>safe</p>');
  });

  it('strips disallowed attributes while keeping the tag', () => {
    expect(sanitizeNoteHtml('<p onclick="alert(1)" style="color:red">hi</p>')).toBe('<p>hi</p>');
  });

  it('strips disallowed structural tags but keeps their text content', () => {
    expect(sanitizeNoteHtml('<table><tr><td>cell</td></tr></table>')).toBe('cell');
  });

  it('strips img tags entirely (no allowed attributes to leak a src)', () => {
    expect(sanitizeNoteHtml('<p>before</p><img src="x" onerror="alert(1)">')).toBe('<p>before</p>');
  });

  it('strips anchor tags but keeps their link text, neutralizing javascript: hrefs', () => {
    expect(sanitizeNoteHtml('<a href="javascript:alert(1)">link</a>')).toBe('link');
  });
});

describe('deriveNotePlainText', () => {
  it('joins text from adjacent block tags with a single space', () => {
    expect(deriveNotePlainText('<h2>Ingredients</h2><ul><li>Milk</li><li>Eggs</li></ul>')).toBe(
      'Ingredients Milk Eggs',
    );
  });

  it('collapses runs of internal whitespace and trims the ends', () => {
    expect(deriveNotePlainText('<p>  extra   spaces  </p>')).toBe('extra spaces');
  });

  it('returns an empty string for tags with no text content', () => {
    expect(deriveNotePlainText('<p></p><h1></h1>')).toBe('');
  });

  it('leaves plain text with no tags unchanged', () => {
    expect(deriveNotePlainText('Plain text with no tags')).toBe('Plain text with no tags');
  });
});
