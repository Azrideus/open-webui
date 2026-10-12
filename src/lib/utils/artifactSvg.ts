import { decode } from 'html-entities';

// ponytail: lazy match stops at the first </svg>, so nested <svg> elements get cut short
const ANY_SVG_RE = /<svg\b[\s\S]*?<\/svg>/gi;
const MARKED_SVG_RE = /<svg\b[^>]*\bdata-artifact\b[\s\S]*?<\/svg>/gi;

/**
 * Find <svg> elements anywhere in a value: plain text, HTML-escaped tool results
 * (<details result="&lt;svg ...">), JSON-encoded tool outputs, or structured
 * message.output items. Only <svg data-artifact> unless anySvg is set.
 */
export const extractArtifactSvgs = (value: unknown, anySvg = false): string[] => {
	const re = anySvg ? ANY_SVG_RE : MARKED_SVG_RE;
	const found = new Set<string>();

	const scan = (v: unknown) => {
		if (typeof v === 'string') {
			const text = decode(v);
			try {
				const parsed = JSON.parse(text);
				if (parsed && typeof parsed === 'object') return scan(parsed);
				if (typeof parsed === 'string') return scan(parsed);
			} catch {
				// not JSON, scan as text
			}
			for (const svg of text.match(re) ?? []) found.add(svg);
		} else if (v && typeof v === 'object') {
			Object.values(v).forEach(scan);
		}
	};

	scan(value);
	return [...found];
};

/** Tool results of an assistant message: structured outputs plus legacy <details type="tool_calls"> tags. */
export const getToolResults = (message: { content?: string; output?: unknown[] }): unknown[] => [
	...(message?.output ?? []).filter((item: any) => item?.type === 'function_call_output'),
	// the result attribute is HTML-escaped, so the opening tag never contains a raw '>'
	...((message?.content ?? '').match(/<details\b[^>]*type="tool_calls"[^>]*>/gi) ?? [])
];
