<script>
	import { getContext } from 'svelte';
	const i18n = getContext('i18n');

	import StatusItem from './StatusHistory/StatusItem.svelte';
	import ProgressBars, { isDone } from './ProgressBars.svelte';
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
	$: runningTools = toolBars
		.filter((bar) => !(isDone(bar) && bar?.error))
		.map((bar) => ({ ...bar, keep_bar: false }));
	// keep_bar so ProgressBars doesn't auto-hide them in the history list
	$: finishedTools = toolBars
		.filter((bar) => isDone(bar))
		.map((bar) => ({ ...bar, keep_bar: true }));

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
				{#if history.length > 1}
					<div class="w-full">
						{#each history as status, idx}
							<div class="flex items-stretch gap-2 mb-1">
								<div class=" ">
									<div class="pt-3 px-1 mb-1.5">
										<span class="relative flex size-1.5 rounded-full justify-center items-center">
											<span
												class="relative inline-flex size-1.5 rounded-full bg-gray-500 dark:bg-gray-400"
											></span>
										</span>
									</div>
									{#if idx !== history.length - 1}
										<div
											class="w-[0.03125rem] ml-[0.40625rem] h-[calc(100%-14px)] bg-gray-300 dark:bg-gray-700"
										/>
									{/if}
								</div>

								<StatusItem {status} done={true} />
							</div>
						{/each}
					</div>
				{/if}
				<!-- Finished tool calls, visible when the history is expanded -->
				{#if finishedTools.length > 0}
					<ProgressBars bars={finishedTools} />
				{/if}
			</div>
		{/if}
	</div>
{/if}
