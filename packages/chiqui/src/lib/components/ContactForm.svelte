<script lang="ts">
	import {
		WEB3FORMS_ENDPOINT,
		defaultContactFormLabels,
		isAccessKeyConfigured,
		buildContactFormData,
		resolveSubmitStatus,
		type ContactFormLabels
	} from '$lib/contact-form';

	let {
		endpoint = WEB3FORMS_ENDPOINT,
		accessKey,
		subject,
		labels = {}
	}: {
		endpoint?: string;
		accessKey?: string;
		subject?: string;
		labels?: Partial<ContactFormLabels>;
	} = $props();

	let resolvedLabels = $derived({ ...defaultContactFormLabels, ...labels });

	let name = $state('');
	let email = $state('');
	let message = $state('');
	let botcheck = $state(false);
	let status = $state<'idle' | 'sending' | 'success' | 'error' | 'not-connected'>('idle');

	function resetFields() {
		name = '';
		email = '';
		message = '';
		botcheck = false;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!isAccessKeyConfigured(accessKey)) {
			status = 'not-connected';
			return;
		}

		// Honeypot: real users never fill/check this hidden field. Pretend success without
		// actually sending anything to avoid tipping off bots.
		if (botcheck) {
			status = 'success';
			resetFields();
			return;
		}

		status = 'sending';

		try {
			const body = buildContactFormData(
				{ name, email, message },
				{ accessKey: accessKey!, subject }
			);
			const res = await fetch(endpoint, {
				method: 'POST',
				body,
				headers: { Accept: 'application/json' }
			});
			const data = await res.json().catch(() => undefined);
			status = resolveSubmitStatus(res.ok, data);
			if (status === 'success') resetFields();
		} catch {
			status = 'error';
		}
	}
</script>

<form class="flex flex-col gap-4" novalidate onsubmit={handleSubmit}>
	{#if resolvedLabels.title}
		<h2 class="text-2xl font-bold">{resolvedLabels.title}</h2>
	{/if}
	{#if resolvedLabels.subtitle}
		<p class="text-base-content/70">{resolvedLabels.subtitle}</p>
	{/if}

	<!-- Honeypot anti-spam: hidden from real users, bots tend to fill every field. -->
	<input
		type="checkbox"
		name="botcheck"
		class="hidden"
		tabindex="-1"
		autocomplete="off"
		aria-hidden="true"
		bind:checked={botcheck}
	/>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">{resolvedLabels.name}</span>
		<input
			class="input input-bordered w-full"
			type="text"
			name="name"
			required
			autocomplete="name"
			bind:value={name}
		/>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">{resolvedLabels.email}</span>
		<input
			class="input input-bordered w-full"
			type="email"
			name="email"
			required
			autocomplete="email"
			bind:value={email}
		/>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium">{resolvedLabels.message}</span>
		<textarea
			class="textarea textarea-bordered w-full"
			name="message"
			rows="4"
			required
			bind:value={message}
		></textarea>
	</label>

	<button class="btn btn-primary self-start" type="submit" disabled={status === 'sending'}>
		{status === 'sending' ? resolvedLabels.sending : resolvedLabels.send}
	</button>

	<p class="min-h-6 text-sm" role="status" aria-live="polite">
		{#if status === 'success'}
			<span class="text-success">{resolvedLabels.success}</span>
		{:else if status === 'error'}
			<span class="text-error">{resolvedLabels.error}</span>
		{:else if status === 'not-connected'}
			<span class="text-warning">{resolvedLabels.notConnected}</span>
		{/if}
	</p>
</form>
