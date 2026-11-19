// Records CSP violations and errors, then registers <k-mascot> from its per-element entry.
window.violations = [];
window.errors = [];
document.addEventListener('securitypolicyviolation', (e) => window.violations.push(`${e.violatedDirective} ${e.blockedURI}`));
window.addEventListener('error', (e) => window.errors.push(String(e.message)));
await import('/dist-elements/elements/mascot.js');
await customElements.whenDefined('k-mascot');
window.ready = true;
