export const CONTACT_EMAIL = 'hi@a6n.ai';

const body = 'Hi a6n,\n\nWhat my business does:\n\nA good time to talk:\n';

export const BOOK_CALL_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Book a call')}&body=${encodeURIComponent(body)}`;
