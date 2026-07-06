import { describe, it, expect } from 'vitest';
import { isVideoSrc } from '../src/lib/media.js';

describe('isVideoSrc', () => {
	it('detects .mp4 as a video', () => {
		expect(isVideoSrc('/media/clip.mp4')).toBe(true);
	});

	it('detects .webm as a video', () => {
		expect(isVideoSrc('/media/clip.webm')).toBe(true);
	});

	it('is case-insensitive', () => {
		expect(isVideoSrc('/media/CLIP.MP4')).toBe(true);
		expect(isVideoSrc('/media/clip.WebM')).toBe(true);
	});

	it('ignores a query string after the extension', () => {
		expect(isVideoSrc('/media/clip.mp4?v=2')).toBe(true);
	});

	it('ignores a hash fragment after the extension', () => {
		expect(isVideoSrc('/media/clip.webm#t=5')).toBe(true);
	});

	it('ignores both a query string and hash fragment', () => {
		expect(isVideoSrc('/media/clip.mp4?v=2#t=5')).toBe(true);
	});

	it('treats .png as an image', () => {
		expect(isVideoSrc('/media/photo.png')).toBe(false);
	});

	it('treats .jpg as an image', () => {
		expect(isVideoSrc('/media/photo.jpg')).toBe(false);
	});

	it('treats .svg as an image', () => {
		expect(isVideoSrc('/img/logo.svg')).toBe(false);
	});

	it('treats an unrecognized extension as an image', () => {
		expect(isVideoSrc('/media/document.pdf')).toBe(false);
	});

	it('treats a path with no extension as an image', () => {
		expect(isVideoSrc('/media/no-extension')).toBe(false);
	});

	it('picks the last extension when there are several', () => {
		expect(isVideoSrc('/media/clip.mp4.jpg')).toBe(false);
	});
});
