<script>
  import ParticulesAnim from '../animation/ParticulesAnim.svelte';
  import LabelCheckbox from './LabelCheckbox.svelte';

  let displayAnimation = true;
</script>

<ParticulesAnim {displayAnimation} />
<div class="full-width-container">
  <LabelCheckbox
    bind:checked={displayAnimation}
    label="Display animations :"
    id="display-animation-checkbox"
  />
  <div class="centred-child">
    <slot />
  </div>
</div>

<style>
  .full-width-container {
    width: 100vw;
    height: 100vh;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 40;
  }

  .centred-child {
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
</style>
