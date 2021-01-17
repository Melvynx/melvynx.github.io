<script>
  import { onMount } from 'svelte';
  import { typewriter } from './typewritter';

  export let text = 'default text';
  export let className = '';

  $: splitedText = text.split('\n');

  let visible = 0;

  onMount(() => {
    const timeout = setTimeout(() => (visible = 1), 500);
    return () => clearTimeout(timeout);
  });
</script>

<div style="min-height: {splitedText.length * 32}px">
  {#if splitedText.length > 1}
    {#each splitedText as mytext, i (mytext)}
      {#if visible >= i + 1}
        <p
          class={className}
          in:typewriter
          on:typewritterfinish={() => (visible = i + 2)}
        >{mytext}</p>
      {:else}
        <p />
      {/if}
    {/each}
  {:else if visible}
    <p class={className} in:typewriter>{text}</p>
  {/if}
</div>

<style>
  p {
    margin: 4px;
  }
</style>
