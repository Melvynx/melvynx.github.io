export function typewriter(node, { speed = 75 }) {
  const valid =
    node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE;

  if (!valid) {
    throw new Error(
      `This transition only works on elements with a single text node child`
    );
  }

  const text = node.textContent;
  const duration = text.length * speed;

  return {
    duration,
    tick: (t) => {
      const i = Math.round(text.length * t);
      node.textContent = text.slice(0, i);
      if (t === 1) node.dispatchEvent(new CustomEvent('typewritterfinish'));
    },
  };
}
