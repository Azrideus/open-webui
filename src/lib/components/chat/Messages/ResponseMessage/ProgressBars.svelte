<script context="module">
	// Reaching total (eg set_progress(id, 100)) finishes the bar; no separate end event needed.
	// Exported so Chat.svelte can stamp `ended_at` when a bar finishes.
	export const isDone = (bar) =>
		bar?.done || (bar?.value != null && bar.value >= (bar?.total || 100));

	// Elapsed time from `started_at` (stamped on first event) to `ended_at` or now, eg "8s", "1m 05s", "1h 02m".
	// Exported for StatusHistory's finished tool-call rows.
	export const elapsed = (bar, now = Date.now()) => {
		if (!bar?.started_at) return '';
		const sec = Math.max(0, Math.floor(((bar.ended_at ?? now) - bar.started_at) / 1000));
		const pad = (n) => String(n).padStart(2, '0');
		if (sec < 60) return `${sec}s`;
		if (sec < 3600) return `${Math.floor(sec / 60)}m ${pad(sec % 60)}s`;
		return `${Math.floor(sec / 3600)}h ${pad(Math.floor(sec / 60) % 60)}m`;
	};
</script>

<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import Spinner from '$lib/components/common/Spinner.svelte';

	// Progress bars streamed via `chat:message:progress` events, updated in place by id.
	export let bars = [];
	// Outer padding; StatusHistory's tool slot passes '' to stay compact.
	export let className = 'py-1';

	// Ticks every 500ms: drives the elapsed time and removes finished bars promptly after LINGER_MS.
	let now = Date.now();
	onMount(() => {
		const timer = setInterval(() => (now = Date.now()), 500);
		return () => clearInterval(timer);
	});

	const percent = (bar) =>
		isDone(bar) ? 100 : Math.max(0, ((bar?.value ?? 0) / (bar?.total || 100)) * 100);

	// Finished bars disappear unless the sender set `keep_bar`; failed bars stay so errors stay visible.
	// A finished bar lingers 0.5s after `ended_at` so its fill can animate up to 100% before it goes.
	const LINGER_MS = 500;
	$: visibleBars = bars.filter(
		(bar) =>
			!isDone(bar) ||
			bar?.keep_bar ||
			bar?.error ||
			(bar?.ended_at && now - bar.ended_at < LINGER_MS)
	);
</script>

{#if visibleBars.length}
	<!-- Fade only when the last bar leaves (whole wrapper); bars removed while others remain go instantly -->
	<div class="flex flex-col gap-2 {className} text-sm" out:fade={{ duration: 400 }}>
		{#each visibleBars as bar (bar.id)}
			{@const done = isDone(bar)}
			{@const indeterminate = bar?.value == null && !done}
			<!-- flip: when a row leaves, the remaining rows slide into its space -->
			<div class="flex flex-col gap-1" animate:flip={{ duration: 300 }}>
				{#if indeterminate && bar?.tool_call_id}
					<!-- Tool call without reported progress: spinner before the name, no indeterminate bar -->
					<!-- h-[1.875rem] = a bar row (20px label + 4px gap + 6px bar), so starting progress doesn't change height -->
					<div class="flex items-center gap-2 h-[1.875rem]">
						<Spinner className="size-3.5 text-gray-500 dark:text-gray-400" />
						<span class="line-clamp-1 shimmer">{bar?.label ?? bar.id}</span>
					</div>
				{:else}
					<div
						class="flex justify-between gap-2 {done
							? 'text-gray-500 dark:text-gray-400'
							: ''} {bar?.error ? 'text-red-500' : ''}"
					>
						<!-- Background only behind the label text (outer span, since shimmer clips its own background to the text) -->
						<span class="min-w-0 rounded px-1 -mx-1 bg-white dark:bg-gray-900">
							<span class="line-clamp-1 {done ? '' : 'shimmer'}">
								{bar?.label ?? bar.id}{done ? (bar?.error ? ' ✗' : ' ✓') : ''}
							</span>
						</span>
						{#if !indeterminate || bar?.started_at}
							<!-- Elapsed time sits next to the percentage (indeterminate bars show time only) -->
							<span class="tabular-nums shrink-0 rounded px-1 -mx-1 bg-white dark:bg-gray-900">
								{#if bar?.started_at}
									<span class="text-gray-500 dark:text-gray-400">{elapsed(bar, now)}</span>
								{/if}
								{#if !indeterminate}{Math.round(percent(bar))}%{/if}
							</span>
						{/if}
					</div>
					<div
						class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 overflow-hidden"
						role="progressbar"
						aria-label={bar?.label ?? bar.id}
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow={indeterminate ? undefined : Math.round(percent(bar))}
					>
						<div
							class="h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out {bar?.error
								? 'bg-red-500'
								: done
									? 'bg-gray-400 dark:bg-gray-500'
									: 'bg-gray-900 dark:bg-gray-100'} {indeterminate
								? 'indeterminate'
								: done
									? ''
									: 'stripes'}"
							style="width: {indeterminate ? 40 : percent(bar)}%"
						></div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	/* Indeterminate bars: a 40% segment slides across the track (animate-pulse on a full bar was invisible) */
	.indeterminate {
		animation: indeterminate-slide 1.2s ease-in-out infinite;
	}
	@keyframes indeterminate-slide {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(250%);
		}
	}
	/* Active determinate bars: diagonal stripes scroll inside the filled area (indeterminate bars only slide) */
	.stripes {
		background-image: linear-gradient(
			45deg,
			rgba(128, 128, 128, 0.45) 25%,
			transparent 25%,
			transparent 50%,
			rgba(128, 128, 128, 0.45) 50%,
			rgba(128, 128, 128, 0.45) 75%,
			transparent 75%,
			transparent
		);
		background-size: 0.75rem 0.75rem;
		animation: stripes-move 0.8s linear infinite;
	}
	@keyframes stripes-move {
		from {
			background-position: 0 0;
		}
		to {
			background-position: 0.75rem 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.stripes,
		.indeterminate {
			animation: none;
		}
	}
</style>
