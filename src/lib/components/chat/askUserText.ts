// Display-only: strip markdown syntax the ask_user card can't render.
// The original text is still what gets submitted/stored.
export const plainText = (text: string | null | undefined) =>
	(text ?? '')
		.replace(/^\s*([-*_])(\s*\1){2,}\s*$/gm, '') // --- *** ___ rules
		.replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
		.replace(/^\s*>\s?/gm, '') // blockquotes
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links & images
		.replace(/(\*\*|__)(.+?)\1/g, '$2') // bold
		.replace(/(^|[^\w*])\*(?!\s)(.+?)\*(?!\w)/g, '$1$2') // *italic*
		.replace(/(^|\W)_(?!\s)(.+?)_(?!\w)/g, '$1$2') // _italic_ (keeps snake_case)
		.replace(/~~(.+?)~~/g, '$1') // strikethrough
		.replace(/`+([^`]+)`+/g, '$1') // inline code
		.replace(/\n{3,}/g, '\n\n') // keep paragraph breaks, squash blanks left by stripped rules
		.trim();
