<script lang="ts">
	let { specs }: { specs: Array<{ label: string; value: string }> } = $props();
</script>

<div class="overflow-x-auto">
	<table class="table">
		<tbody>
			{#each specs as spec (spec.label)}
				<tr>
					<th class="text-base-content/70 w-1/3 font-medium">{spec.label}</th>
					<td>{spec.value}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
