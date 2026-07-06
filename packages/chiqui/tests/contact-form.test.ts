import { describe, it, expect } from 'vitest';
import {
	WEB3FORMS_ENDPOINT,
	defaultContactFormLabels,
	isAccessKeyConfigured,
	buildContactFormData,
	resolveSubmitStatus
} from '../src/lib/contact-form.js';

describe('WEB3FORMS_ENDPOINT', () => {
	it('points at the Web3Forms submit endpoint', () => {
		expect(WEB3FORMS_ENDPOINT).toBe('https://api.web3forms.com/submit');
	});
});

describe('defaultContactFormLabels', () => {
	it('provides English defaults for every required label', () => {
		expect(defaultContactFormLabels.name).toBe('Name');
		expect(defaultContactFormLabels.email).toBe('Email');
		expect(defaultContactFormLabels.message).toBe('Message');
		expect(defaultContactFormLabels.send).toBeTruthy();
		expect(defaultContactFormLabels.sending).toBeTruthy();
		expect(defaultContactFormLabels.success).toBeTruthy();
		expect(defaultContactFormLabels.error).toBeTruthy();
		expect(defaultContactFormLabels.notConnected).toBeTruthy();
	});

	it('leaves title/subtitle unset by default', () => {
		expect(defaultContactFormLabels.title).toBeUndefined();
		expect(defaultContactFormLabels.subtitle).toBeUndefined();
	});
});

describe('isAccessKeyConfigured', () => {
	it('returns false for undefined', () => {
		expect(isAccessKeyConfigured(undefined)).toBe(false);
	});

	it('returns false for an empty string', () => {
		expect(isAccessKeyConfigured('')).toBe(false);
	});

	it('returns false for a whitespace-only string', () => {
		expect(isAccessKeyConfigured('   ')).toBe(false);
	});

	it('returns true for a non-blank string', () => {
		expect(isAccessKeyConfigured('abc123')).toBe(true);
	});
});

describe('buildContactFormData', () => {
	it('includes the access key, name, email, and message', () => {
		const data = buildContactFormData(
			{ name: 'Ada', email: 'ada@example.com', message: 'Hi' },
			{ accessKey: 'key-123' }
		);
		expect(data.get('access_key')).toBe('key-123');
		expect(data.get('name')).toBe('Ada');
		expect(data.get('email')).toBe('ada@example.com');
		expect(data.get('message')).toBe('Hi');
	});

	it('omits the subject field when none is given', () => {
		const data = buildContactFormData(
			{ name: 'Ada', email: 'ada@example.com', message: 'Hi' },
			{ accessKey: 'key-123' }
		);
		expect(data.get('subject')).toBeNull();
	});

	it('includes the subject field when given', () => {
		const data = buildContactFormData(
			{ name: 'Ada', email: 'ada@example.com', message: 'Hi' },
			{ accessKey: 'key-123', subject: 'New inquiry' }
		);
		expect(data.get('subject')).toBe('New inquiry');
	});
});

describe('resolveSubmitStatus', () => {
	it('resolves to success when ok and data.success are both true', () => {
		expect(resolveSubmitStatus(true, { success: true })).toBe('success');
	});

	it('resolves to error when ok is false, even if data.success is true', () => {
		expect(resolveSubmitStatus(false, { success: true })).toBe('error');
	});

	it('resolves to error when data.success is false', () => {
		expect(resolveSubmitStatus(true, { success: false })).toBe('error');
	});

	it('resolves to error when data is undefined', () => {
		expect(resolveSubmitStatus(true, undefined)).toBe('error');
	});
});
