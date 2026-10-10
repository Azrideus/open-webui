<script lang="ts" context="module">
	import { marked, type Token } from 'marked';

	type AlertType = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION' | 'ERROR' | 'CUSTOM';

	interface AlertTheme {
		border: string;
		text: string;
		icon: ComponentType;
	}

	export interface AlertData {
		type: AlertType;
		text: string;
		tokens: Token[];
		color?: string;
		title?: string;
	}

	const alertStyles: Record<Exclude<AlertType, 'CUSTOM'>, AlertTheme> = {
		NOTE: {
			border: 'border-sky-500',
			text: 'text-sky-500',
			icon: Info
		},
		TIP: {
			border: 'border-emerald-500',
			text: 'text-emerald-500',
			icon: LightBulb
		},
		IMPORTANT: {
			border: 'border-purple-500',
			text: 'text-purple-500',
			icon: Star
		},
		WARNING: {
			border: 'border-yellow-500',
			text: 'text-yellow-500',
			icon: ArrowRightCircle
		},
		CAUTION: {
			border: 'border-rose-500',
			text: 'text-rose-500',
			icon: Bolt
		},
		ERROR: {
			border: 'border-red-600',
			text: 'text-red-600',
			icon: XMark
		}
	};

	// Only plain color values (#hex, rgb()/hsl(), names) — no ';' or ':' so it can't break out of the style attribute
	const SAFE_COLOR = /^[#a-zA-Z0-9(),.%\s]+$/;

	export function alertComponent(token: Token): AlertData | false {
		const customRegExp = /^\[!CUSTOM:([^:\]\n]+):([^\]\n]*)\]\s*?\n*/i;
		const custom = token.text?.match(customRegExp);
		if (custom) {
			const color = custom[1].trim();
			const newText = token.text.replace(customRegExp, '');
			return {
				type: 'CUSTOM',
				color: SAFE_COLOR.test(color) ? color : 'currentColor',
				title: custom[2].trim(),
				text: newText,
				tokens: marked.lexer(newText)
			};
		}

		const regExpStr = `^(?:\\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|ERROR)\\])\\s*?\n*`;
		const regExp = new RegExp(regExpStr, 'i');
		const matches = token.text?.match(regExp);

		if (matches && matches.length) {
			const alertType = matches[1].toUpperCase() as AlertType;
			const newText = token.text.replace(regExp, '');
			const newTokens = marked.lexer(newText);
			return {
				type: alertType,
				text: newText,
				tokens: newTokens
			};
		}
		return false;
	}
</script>

<script lang="ts">
	import Info from '$lib/components/icons/Info.svelte';
	import Star from '$lib/components/icons/Star.svelte';
	import LightBulb from '$lib/components/icons/LightBulb.svelte';
	import Bolt from '$lib/components/icons/Bolt.svelte';
	import ArrowRightCircle from '$lib/components/icons/ArrowRightCircle.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import MarkdownTokens from './MarkdownTokens.svelte';
	import type { ComponentType } from 'svelte';

	export let token: Token;
	export let alert: AlertData;
	export let id = '';
	export let tokenIdx = 0;
	export let allowEmbeds = false;
	export let onTaskClick: ((event: MouseEvent) => void) | undefined = undefined;
	export let onSourceClick: ((event: MouseEvent) => void) | undefined = undefined;
</script>

<!--

Renders the following Markdown as alerts:

> [!NOTE]
> Example note

> [!TIP]
> Example tip

> [!IMPORTANT]
> Example important

> [!CAUTION]
> Example caution

> [!WARNING]
> Example warning

> [!ERROR]
> Example error

> [!CUSTOM:#ff8800: My custom title]
> Example custom box (any CSS color, any title)

-->
{#if alert.type === 'CUSTOM'}
	<div class="border-l-4 pl-2.5 my-0.5" style="border-color: {alert.color}">
		<div class="items-center flex gap-1 py-1.5" style="color: {alert.color}">
			<span class=" font-normal">{alert.title}</span>
		</div>
		<div class="pb-2">
			<MarkdownTokens
				id={`${id}-${tokenIdx}`}
				tokens={alert.tokens}
				{allowEmbeds}
				{onTaskClick}
				{onSourceClick}
			/>
		</div>
	</div>
{:else}
<div class={`border-l-4 pl-2.5 ${alertStyles[alert.type].border} my-0.5`}>
	<div class="{alertStyles[alert.type].text} items-center flex gap-1 py-1.5">
		<svelte:component this={alertStyles[alert.type].icon} className="inline-block size-4" />
		<span class=" font-normal">{alert.type}</span>
	</div>
	<div class="pb-2">
		<MarkdownTokens
			id={`${id}-${tokenIdx}`}
			tokens={alert.tokens}
			{allowEmbeds}
			{onTaskClick}
			{onSourceClick}
		/>
	</div>
</div>
{/if}
