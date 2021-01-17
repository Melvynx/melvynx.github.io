<script>
  import { onMount } from 'svelte';

  export let displayAnimation = true;

  const speed = 10;
  const mouseRadiusDividend = 100;

  let canvas;
  let ctx;
  let particules;
  let isAnimationRunning = true;

  $: if (displayAnimation) {
    if (!isAnimationRunning) {
      if (canvas) {
        onStartAnimation();
      }
    }
  } else {
    isAnimationRunning = false;
  }

  let mouse = {
    x: null,
    y: null,
    radius: null,
  };

  function onStartAnimation() {
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    mouse.radius =
      (canvas?.height / mouseRadiusDividend) * (canvas?.width / mouseRadiusDividend);
    initAnimation();
    animate();
  }

  onMount(() => {
    onStartAnimation();
  });

  function handleMouseMove(event) {
    mouse.x = event.x;
    mouse.y = event.y;
  }

  function handleResize() {
    if (!displayAnimation) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    mouse = {
      radius:
        (canvas?.height / mouseRadiusDividend) *
        (canvas?.width / mouseRadiusDividend),
      ...mouse,
    };
  }

  class Particle {
    constructor(x, y, directionX, directionY, size, color) {
      this.x = x;
      this.y = y;
      this.directionX = directionX;
      this.directionY = directionY;
      this.size = size;
    }
    // draw particule
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
      ctx.fillStyle = '#485460';
      ctx.fill();
    }
    // update place of particules
    update() {
      if (this.x > canvas.width || this.x < 0) {
        this.directionX = -this.directionX;
      }
      if (this.y > canvas.height || this.x < 0) {
        this.directionY = -this.directionY;
      }

      // check collision
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mouse.radius + this.size) {
        if (mouse.x < this.x && this.x < canvas.width - this.size * speed) {
          this.x += speed;
          this.directionX = -this.directionX;
        }
        if (mouse.x > this.x && this.x > this.size * speed) {
          this.directionX = -this.directionX;
          this.x -= speed;
        }
        if (mouse.y < this.y && this.y < canvas.width - this.size * speed) {
          this.y += speed;
          this.directionY = -this.directionY;
        }
        if (mouse.y > this.y && this.y > this.size * speed) {
          this.y -= speed;
          this.directionY = -this.directionY;
        }
      }

      this.x += this.directionX;
      this.y += this.directionY;

      this.draw();
    }
  }

  function initAnimation() {
    isAnimationRunning = true;
    particules = [];
    let numberOfParticles = (canvas.height * canvas.width) / 15000;

    for (let i = 0; i < numberOfParticles; i++) {
      let size = Math.random() * 6 + 1;
      let x = Math.random() * (window.innerWidth - size * 2 - size * 2) + size * 2;
      let y = Math.random() * (window.innerHeight - size * 2 - size * 2) + size * 2;
      let directionX = Math.random() * 5 - 2.5;
      let directionY = Math.random() * 5 - 2.5;

      particules = particules.concat(
        new Particle(x, y, directionX, directionY, size)
      );
    }
  }

  function animate() {
    if (!displayAnimation) return;
    requestAnimationFrame(animate);

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = '#1d1d1d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particules.forEach((particule) => particule.update());
    connect();
  }

  function connect() {
    for (let a = 0; a < particules.length; a++) {
      for (let b = a; b < particules.length; b++) {
        let distance =
          (particules[a].x - particules[b].x) * (particules[a].x - particules[b].x) +
          (particules[a].y - particules[b].y) * (particules[a].y - particules[b].y);

        if (distance < (canvas.width / 9) * (canvas.height / 9)) {
          ctx.strokeStyle = `rgba(52,73,94, ${1 - distance / 20000})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particules[a].x, particules[a].y);
          ctx.lineTo(particules[b].x, particules[b].y);
          ctx.stroke();
        }
      }
    }
  }
</script>

<svelte:window
  on:mousemove={handleMouseMove}
  on:resize={handleResize}
  on:mouseout={() => (mouse = { x: undefined, y: undefined, ...mouse })}
/>
{#if displayAnimation}
  <canvas bind:this={canvas} />
{/if}

<style>
  canvas {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 20;
  }
</style>
