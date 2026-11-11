// A megjavított Sparkhorn Sprint beágyazva (ugyanarról a github.io címről).
export function run(container) {
  container.innerHTML = '<iframe src="https://bladeszasza.github.io/sparkhorn-sprint/" allow="autoplay" title="Unikornis-futás"></iframe>';
  return () => { container.innerHTML = ''; };
}
