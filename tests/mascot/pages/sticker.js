// Records CSP violations and errors, then registers <k-sticker> from its per-element entry.
window.violations = [];
window.errors = [];
document.addEventListener('securitypolicyviolation', (e) => window.violations.push(`${e.violatedDirective} ${e.blockedURI}`));
window.addEventListener('error', (e) => window.errors.push(String(e.message)));
await import('/dist-elements/elements/sticker.js');
await customElements.whenDefined('k-sticker');
window.ready = true;
