<script>
	import { getContext } from 'svelte';
	const i18n = getContext('i18n');

	import StatusItem from './StatusHistory/StatusItem.svelte';
	import ProgressBars, { isDone, elapsed } from './ProgressBars.svelte';
	import equal from 'fast-deep-equal';
	export let statusHistory = [];
	export let expand = false;
	// Progress bars of tool calls: running ones show above the live label, finished ones move into the expandable history.
	export let toolBars = [];
	// Workflow progress bars (no tool_call_id); shown at the top of the same slot. ProgressBars hides finished ones.
	export let progressBars = [];
	// While the message streams, the slot above the label only grows: space left by finished tool calls is kept for the next ones.
	export let active = false;

	// Measured slot content height; `reserved` is the max seen while streaming (back to the content once done).
	// The outer box animates to `reserved`, so the slot expands slowly and the live label never jumps.
	let slotHeight = 0;
	let reserved = 0;
	$: reserved = active ? Math.max(reserved, slotHeight) : slotHeight;

	$: showStatus = history && history.length > 0 && status?.hidden !== true;
	$: hasRunningTools = toolBars.some((bar) => !isDone(bar));
	// Top list (one keyed list so rows slide): running tools (ProgressBars draws a spinner for ones without progress)
	// plus progress bars briefly lingering at 100%; finished spinner-only tools and errors leave at once, keep_bar ignored.
	$: runningTools = toolBars
		.filter((bar) => !isDone(bar) || (bar?.value != null && !bar?.error))
		.map((bar) => ({ ...bar, keep_bar: false }));
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
		// Collapse consecutive finished tools with the same label, rounded runtime and outcome into "N×".
		const merged = [];
		for (const item of out) {
			const prev = merged.at(-1);
			if (
				item.bar &&
				prev?.bar &&
				(prev.bar.label ?? prev.bar.id) === (item.bar.label ?? item.bar.id) &&
				elapsed(prev.bar) === elapsed(item.bar) &&
				!!prev.bar.error === !!item.bar.error
			) {
				prev.count += 1;
			} else {
				merged.push(item.bar ? { ...item, count: 1 } : item);
			}
		}
		return merged;
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

{#if showStatus || hasRunningTools || active || progressBars.length}
	<div class="text-[0.9375rem] pt-1 pb-0.5 flex flex-col w-full">
		<!-- Running tool calls above the live label, in a slot that starts empty and only grows while streaming.
		     min-height keeps the reserved space (so the workflow bar stays at its bottom); the outer box animates. -->
		<div
			class="overflow-hidden transition-[height] duration-500 ease-out motion-reduce:transition-none"
			style="height: {reserved}px"
		>
			<div
				bind:clientHeight={slotHeight}
				class="flex flex-col justify-end gap-2"
				style="min-height: {active ? reserved : 0}px"
			>
				<!-- Rows sit at the bottom of the kept space (one gap for all), tool calls above the workflow bar -->
				{#if (active || hasRunningTools) && runningTools.length > 0}
					<ProgressBars bars={runningTools} className="" />
				{/if}
				{#if progressBars.length}
					<ProgressBars bars={progressBars} className="" />
				{/if}
			</div>
		</div>

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
											>{item.count > 1 ? `${item.count}× ` : ''}{item.bar.label ?? item.bar.id}{item
												.bar.error
												? ' ✗'
												: ' ✓'}</span
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
