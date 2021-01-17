<script>
  export let page = {
    id: 0,
    title: 'title',
    description: 'default description',
    image: 'images/snakouz.png',
  };
</script>

<div>
  <h2>{page.title}</h2>
</div>

<style>
  div {
    --github-card-bg: #485460;
    border: 1px solid var(--github-card-bg);
    border-radius: 2px;
  }
</style>
