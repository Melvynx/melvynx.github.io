import App from './App.svelte';
import './index.css';

const app = new App({
  target: document.body,
});

console.log(process.env.NODE_ENV);

export default app;
