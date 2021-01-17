<script>
  export let checked;
  export let id = 'label-checkbox-default-id';
  export let label = 'Default label :';
</script>

<div class="label-checkbox-container">
  <label for={id}>{label}</label>
  <input {id} type="checkbox" bind:checked />
</div>

<style>
  .label-checkbox-container {
    display: flex;
    align-items: center;
    margin: 8px;
  }

  .label-checkbox-container > input {
    margin: 0 0 0 8px;
    border: 1px solid var(--text-color);
    background-color: var(--bg-color);
  }

  .label-checkbox-container > label {
    color: var(--text-color);
  }
</style>
