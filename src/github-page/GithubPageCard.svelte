<script>
  export let page = {
    id: 0,
    title: 'title',
    description: 'default description',
    image: 'images/snakouz.png',
    url: 'https://google.com',
  };
</script>

<div class="card-wrapper">
  <a href={page.url}>
    <div class="img-wrapper">
      <img src={page.image} alt="githubpage card img" />
    </div>
    <h2>{page.title}</h2>
    <p>{page.description}</p>
  </a>
</div>

<style>
  .card-wrapper {
    --github-card-bg: #485460;
    border: 1px solid var(--github-card-bg);
    border-radius: 2px;
    margin: 8px;
    cursor: pointer;
    max-width: 236px;
  }

  .card-wrapper:hover {
    box-shadow: 0 0 0 0.1rem #485460;
  }

  h2 {
    font-size: 24px;
    font-family: 'Roboto Mono', Arial, Helvetica, sans-serif;
    margin: 8px;
  }

  .img-wrapper {
    height: 140px;
    overflow: hidden;
  }
  img {
    width: 100%;
    max-width: 236px;
  }

  p {
    margin: 8px;
  }

  a {
    text-decoration: none;
  }
  a:hover {
    text-decoration: none;
  }

  @media only screen and (max-width: 768px) {
    .card-wrapper {
      width: calc(100% - 32px);
      margin-right: 16px;
      margin-left: 16px;
      max-width: none;
    }

    img {
      max-width: none;
    }

    h2 {
      font-size: 18px;
    }

    p {
      font-size: 14px;
    }

    .img-wrapper {
      height: 180px;
    }
  }
</style>
