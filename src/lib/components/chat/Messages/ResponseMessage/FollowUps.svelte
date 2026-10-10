<script lang="ts">
	import { getContext } from 'svelte';

	const i18n = getContext('i18n');

	export let question = '';
	export let followUps: string[] = [];
	export let onClick: (followUp: string) => void = () => {};
</script>

<div
	class="mt-4 flex items-stretch gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 p-3"
>
	<div
		class="shrink-0 w-10 flex items-center justify-center text-4xl font-bold leading-none text-gray-300 dark:text-gray-600 select-none"
		aria-hidden="true"
	>
		?
	</div>

	<div class="flex-1 min-w-0">
	{#if question}
		<div class="text-[0.9375rem] font-semibold text-gray-900 dark:text-gray-100 mb-2.5 px-0.5">
			{question}
		</div>
	{:else}
		<div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-0.5">
			{$i18n.t('Follow up')}
		</div>
	{/if}

	<div class="flex flex-wrap gap-2">
		{#each followUps as followUp, idx (idx)}
			<button
				class="{followUp.length > 30 ? 'w-full' : ''} px-3.5 py-2 rounded-xl text-sm text-left border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-800 dark:text-gray-100 shadow-xs transition duration-150 cursor-pointer max-w-full hover:bg-gray-900 hover:text-white hover:border-gray-900 dark:hover:bg-gray-100 dark:hover:text-gray-900 dark:hover:border-gray-100 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
				title={followUp}
				on:click={() => onClick(followUp)}
				aria-label={$i18n.t('Follow up: {{question}}', { question: followUp })}
			>
				<span class="line-clamp-3">{followUp}</span>
			</button>
		{/each}
	</div>
	</div>
</div>
