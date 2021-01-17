<script>
  import MelvynxLogo from './animation/MelvynxLogoAnim.svelte';
  import WrittingEffect from './animation/WrittingEffect.svelte';
  import BackgroundApp from './background/BackgroundApp.svelte';
  import GithubPageCard from './github-page/GithubPageCard.svelte';
  import { mainText, githubpages } from './melvynx-data';
</script>

<main class="app">
  <BackgroundApp>
    <div class="logo-container">
      <MelvynxLogo />
    </div>
    <WrittingEffect text={mainText} />
    <div class="github-pages-container">
      {#each githubpages as page}
        <GithubPageCard {page} />
      {/each}
    </div>
  </BackgroundApp>
</main>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@200;400&display=swap');

  .app {
    --bg-color: #1d1d1d;
    --text-color: #f0f0f0;
    background-color: var(--bg-color);
  }

  .logo-container {
    margin: 16px;
  }

  .github-pages-container {
    display: flex;
  }
</style>
