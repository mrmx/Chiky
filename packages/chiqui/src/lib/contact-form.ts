// Pure helpers backing the `<ContactForm>` component (see `components/ContactForm.svelte`).
// Kept dependency-free and DOM-light so they're cheap to unit test without rendering the
// component (Svelte component rendering isn't set up in this package's test harness — see
// tests/contact-form.test.ts, same rationale as `src/lib/seo.ts`/`src/lib/media.ts`).

/** Default submission endpoint: Web3Forms (https://web3forms.com) — a public access key, not a secret. */
export const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

export type ContactFormFields = {
	name: string;
	email: string;
	message: string;
};

export type ContactFormLabels = {
	title?: string;
	subtitle?: string;
	name: string;
	email: string;
	message: string;
	send: string;
	sending: string;
	success: string;
	error: string;
	/** Shown instead of sending when no `accessKey` is configured (clean degradation). */
	notConnected: string;
};

/** English defaults — the framework imposes no i18n on the form's copy. */
export const defaultContactFormLabels: ContactFormLabels = {
	name: 'Name',
	email: 'Email',
	message: 'Message',
	send: 'Send',
	sending: 'Sending…',
	success: 'Thanks! Your message has been sent.',
	error: 'Something went wrong. Please try again.',
	notConnected: 'This form is not connected yet.'
};

/** An `accessKey` is only usable when it's a non-blank string. */
export function isAccessKeyConfigured(accessKey?: string): boolean {
	return typeof accessKey === 'string' && accessKey.trim().length > 0;
}

/** Builds the `FormData` payload posted to a Web3Forms-compatible endpoint. */
export function buildContactFormData(
	fields: ContactFormFields,
	options: { accessKey: string; subject?: string }
): FormData {
	const data = new FormData();
	data.set('access_key', options.accessKey);
	if (options.subject) data.set('subject', options.subject);
	data.set('name', fields.name);
	data.set('email', fields.email);
	data.set('message', fields.message);
	return data;
}

/** Interprets a Web3Forms-style JSON response (`{ success: boolean }`) alongside the HTTP status. */
export function resolveSubmitStatus(
	ok: boolean,
	data: { success?: boolean } | undefined
): 'success' | 'error' {
	return ok && data?.success === true ? 'success' : 'error';
}
