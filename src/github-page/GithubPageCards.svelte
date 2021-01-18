<script>
  import { githubpages } from '../melvynx-data';
  import GithubPageCard from './GithubPageCard.svelte';
</script>

<div class="github-pages-container">
  {#each githubpages as page}
    <GithubPageCard {page} />
  {/each}
</div>

<style>
  .github-pages-container {
    display: flex;
  }

  @media only screen and (max-width: 768px) {
    .github-pages-container {
      flex-direction: column;
      width: 100%;
      align-items: center;
      padding-bottom: 16px;
    }
  }
</style>
