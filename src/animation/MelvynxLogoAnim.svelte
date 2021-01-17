<script>
  import { spring } from 'svelte/motion';
  import MelvynxLogoSvg from './MelvynxLogoSvg.svelte';
  import { pannable } from './pannable';
  import { fade } from 'svelte/transition';

  let coords = spring({ x: 0, y: 0 }, { stiffness: 0.4, damping: 0.2 });
  let isPanMove = false;

  function handlePanStart() {
    coords.stiffness = coords.damping = 0.3;
    isPanMove = true;
  }

  function handlePanMove(event) {
    coords.update(($coords) => ({
      x: $coords.x + event.detail.dx,
      y: $coords.y + event.detail.dy,
    }));
  }

  function handlePanEnd() {
    coords.set({ x: 0, y: 0 });
    isPanMove = false;
  }
</script>

<div class="melvynx-logo-root">
  {#if isPanMove}
    <div class="xztiu" transition:fade={{ duration: 150 }}>
      <img src="images/hello.gif" alt="hello everyone" />
    </div>
  {/if}
  <div
    class="melvynx-logo-box"
    use:pannable
    on:panstart={handlePanStart}
    on:panmove={handlePanMove}
    on:panend={handlePanEnd}
    style="
    background-color: {isPanMove
      ? 'var(--bg-color)'
      : 'transparent'};
    transform:
      translate({$coords.x}px, {$coords.y}px)
      rotate({$coords.x *
      $coords.y *
      0.001}deg)"
  >
    <MelvynxLogoSvg />
  </div>
</div>

<style>
  :global(.melvynx-logo-root) {
    --width: 140px;
    --height: 185px;
  }

  .melvynx-logo-box {
    position: relative;
    left: calc(50% - var(--width) / 2);
    top: calc(50% - var(--height) / 2);
    width: var(--width);
    height: var(--height);
    cursor: move;
  }

  .xztiu {
    position: absolute;
    width: var(--width);
  }
  .xztiu > img {
    width: var(--width);
  }
</style>
