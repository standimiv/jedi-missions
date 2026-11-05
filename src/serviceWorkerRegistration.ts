export function register(): void {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const publicUrl = process.env.PUBLIC_URL || '';
    navigator.serviceWorker.register(`${publicUrl}/sw.js`).catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
