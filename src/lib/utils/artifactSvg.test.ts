import { describe, expect, it } from 'vitest';
import { extractArtifactSvgs, getToolResults } from './artifactSvg';

const SVG = '<svg data-artifact="true" viewBox="0 0 10 10"><rect width="5" height="5"/></svg>';

describe('extractArtifactSvgs', () => {
	it('finds marked svgs in model text, fenced or raw', () => {
		expect(extractArtifactSvgs(`Here:\n${SVG}\n`)).toEqual([SVG]);
		expect(extractArtifactSvgs('```svg\n' + SVG + '\n```')).toEqual([SVG]);
	});

	it('ignores unmarked svgs', () => {
		expect(extractArtifactSvgs('<svg viewBox="0 0 1 1"></svg>')).toEqual([]);
	});

	it('finds svgs in html-escaped tool_calls details', () => {
		const escaped = SVG.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
		const content = `<details type="tool_calls" done="true" result="${escaped}"></details>`;
		expect(extractArtifactSvgs(content)).toEqual([SVG]);
	});

	it('anySvg takes unmarked svgs, e.g. stm32_pintools_get_svg output', () => {
		const plain = '<svg xmlns="http://www.w3.org/2000/svg" width="624"><rect/></svg>';
		const toolText = JSON.stringify({ result: plain });
		expect(extractArtifactSvgs(toolText)).toEqual([]);
		expect(extractArtifactSvgs(toolText, true)).toEqual([plain]);
	});

	it('getToolResults picks only tool results, not model text', () => {
		const plain = '<svg><rect/></svg>';
		const escaped = plain.replace(/</g, '&lt;').replace(/>/g, '&gt;');
		const message = {
			content: `Model says ${plain}\n<details type="tool_calls" done="true" result="${escaped}">\n<summary>x</summary>\n</details>`,
			output: [
				{ type: 'message', content: [{ type: 'output_text', text: '<svg><circle/></svg>' }] },
				{ type: 'function_call_output', output: [{ type: 'input_text', text: '<svg><line/></svg>' }] }
			]
		};
		expect(extractArtifactSvgs(getToolResults(message), true)).toEqual([
			'<svg><line/></svg>',
			plain
		]);
	});

	it('finds svgs in json-encoded structured tool output', () => {
		const output = [
			{
				type: 'function_call_output',
				call_id: 'c1',
				output: [{ type: 'input_text', text: JSON.stringify({ svg: SVG, pins: 3 }) }]
			}
		];
		expect(extractArtifactSvgs(output)).toEqual([SVG]);
	});
});
