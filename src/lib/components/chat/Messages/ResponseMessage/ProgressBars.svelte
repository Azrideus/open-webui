<script>
	// Progress bars streamed via `chat:message:progress` events, updated in place by id.
	export let bars = [];

	// Reaching total (eg set_progress(id, 100)) finishes the bar; no separate end event needed.
	const isDone = (bar) => bar?.done || (bar?.value != null && bar.value >= (bar?.total || 100));
	const percent = (bar) =>
		isDone(bar) ? 100 : Math.max(0, ((bar?.value ?? 0) / (bar?.total || 100)) * 100);

	// Finished bars disappear unless the sender set `keep_bar`; failed bars stay so errors stay visible.
	$: visibleBars = bars.filter((bar) => !isDone(bar) || bar?.keep_bar || bar?.error);
</script>

{#if visibleBars.length}
	<div class="flex flex-col gap-2 py-1 text-sm">
		{#each visibleBars as bar (bar.id)}
			{@const done = isDone(bar)}
			{@const indeterminate = bar?.value == null && !done}
			<div class="flex flex-col gap-1">
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
					{#if !indeterminate}
						<span class="tabular-nums shrink-0 rounded px-1 -mx-1 bg-white dark:bg-gray-900"
							>{Math.round(percent(bar))}%</span
						>
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
						class="h-1.5 rounded-full transition-all duration-300 {bar?.error
							? 'bg-red-500'
							: done
								? 'bg-gray-400 dark:bg-gray-500'
								: 'bg-gray-900 dark:bg-gray-100'} {indeterminate ? 'indeterminate' : ''}"
						style="width: {indeterminate ? 40 : percent(bar)}%"
					></div>
				</div>
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
	@media (prefers-reduced-motion: reduce) {
		.indeterminate {
			animation: none;
		}
	}
</style>
