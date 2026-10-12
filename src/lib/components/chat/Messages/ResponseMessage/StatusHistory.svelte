<script>
	import { getContext } from 'svelte';
	const i18n = getContext('i18n');

	import StatusItem from './StatusHistory/StatusItem.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';
	import ProgressBars, { isDone, elapsed } from './ProgressBars.svelte';
	import equal from 'fast-deep-equal';
	export let statusHistory = [];
	export let expand = false;
	// Progress bars of tool calls: running ones show above the live label, finished ones move into the expandable history.
	export let toolBars = [];
	// While the message streams, one tool bar's height stays reserved above the label to minimize layout shift.
	export let active = false;

	$: showStatus = history && history.length > 0 && status?.hidden !== true;
	$: hasRunningTools = toolBars.some((bar) => !isDone(bar));
	// Top list: drop keep_bar and finished errors so only running bars (plus the brief finish linger) stay above the label
	// Only tools that reported progress (value set) get a bar; the rest show a spinner, no indeterminate bar.
	$: runningTools = toolBars
		.filter((bar) => bar?.value != null && !(isDone(bar) && bar?.error))
		.map((bar) => ({ ...bar, keep_bar: false }));
	$: spinnerTools = toolBars.filter((bar) => bar?.value == null && !isDone(bar));
	// Expanded history: statuses and finished tool calls as one list. A tool goes before the status at its
	// `status_idx` (statuses seen when it started); tools without one go last.
	$: items = (() => {
		const finished = toolBars.filter((bar) => isDone(bar));
		const out = [];
		for (let i = 0; i <= history.length; i++) {
			for (const bar of finished.filter((b) => b.status_idx === i)) out.push({ bar });
			if (i < history.length) out.push({ status: history[i] });
		}
		for (const bar of finished.filter(
			(b) => !(b.status_idx >= 0 && b.status_idx <= history.length)
		))
			out.push({ bar });
		return out;
	})();

	let showHistory = true;

	$: if (expand) {
		showHistory = true;
	} else {
		showHistory = false;
	}

	let history = [];
	let status = null;

	$: if (history && history.length > 0) {
		status = history.at(-1);
	}

	$: if (!equal(statusHistory, history)) {
		history = statusHistory;
	}
</script>

{#if showStatus || hasRunningTools || active}
	<div class="text-[0.9375rem] pt-2 pb-2 flex flex-col w-full">
		<!-- Running tool calls, above the live label; reserves one bar (min-h-10) while streaming -->
		{#if active || hasRunningTools}
			<div class={active ? 'min-h-10' : ''}>
				<!-- Running tools without progress: spinner before the name -->
				{#each spinnerTools as bar (bar.id)}
					<div class="flex items-center gap-2 py-0.5 text-sm">
						<Spinner className="size-3.5 text-gray-500 dark:text-gray-400" />
						<span class="line-clamp-1 shimmer">{bar.label ?? bar.id}</span>
					</div>
				{/each}
				{#if runningTools.length > 0}
					<ProgressBars bars={runningTools} />
				{/if}
			</div>
		{/if}

		{#if showStatus}
			<button
				class="w-full"
				aria-label={$i18n.t('Toggle status history')}
				aria-expanded={showHistory}
				on:click={() => {
					showHistory = !showHistory;
				}}
			>
				<div class="flex items-start gap-2">
					<StatusItem {status} />
				</div>
			</button>
		{/if}

		{#if showStatus && showHistory}
			<div class="flex flex-col">
				{#if items.length > 1}
					<div class="w-full">
						{#each items as item, idx}
							<div class="flex items-stretch gap-2 mb-1">
								<div class=" ">
									<div class="pt-3 px-1 mb-1.5">
										<span class="relative flex size-1.5 rounded-full justify-center items-center">
											<span
												class="relative inline-flex size-1.5 rounded-full bg-gray-500 dark:bg-gray-400"
											></span>
										</span>
									</div>
									{#if idx !== items.length - 1}
										<div
											class="w-[0.03125rem] ml-[0.40625rem] h-[calc(100%-14px)] bg-gray-300 dark:bg-gray-700"
										/>
									{/if}
								</div>

								{#if item.bar}
									<!-- Finished tool call: name, tick/cross and time taken only -->
									<div
										class="status-description flex items-center gap-2 py-0.5 text-[0.9375rem] {item
											.bar.error
											? 'text-red-500'
											: ''}"
									>
										<span class="line-clamp-1"
											>{item.bar.label ?? item.bar.id}{item.bar.error ? ' ✗' : ' ✓'}</span
										>
										<span class="tabular-nums text-gray-500 dark:text-gray-400 shrink-0"
											>{elapsed(item.bar)}</span
										>
									</div>
								{:else}
									<StatusItem status={item.status} done={true} />
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
