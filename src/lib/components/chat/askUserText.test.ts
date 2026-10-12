import { describe, expect, it } from 'vitest';
import { plainText } from './askUserText';

describe('plainText', () => {
	it('strips markdown markers but keeps the words', () => {
		expect(plainText('**Pick** a *mode*\n\n---\n## Notes `x` [doc](http://a)')).toBe(
			'Pick a mode\nNotes x doc'
		);
	});

	it('leaves snake_case, math and empty input alone', () => {
		expect(plainText('use my_var_name, 2 * 3 * 4')).toBe('use my_var_name, 2 * 3 * 4');
		expect(plainText(undefined)).toBe('');
	});
});
