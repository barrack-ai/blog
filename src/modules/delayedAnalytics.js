if (typeof window !== 'undefined') {
  const loadGA = () => {
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-FN4NDNRER9';
    script.async = true;
    document.head.appendChild(script);
    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'G-FN4NDNRER9', { anonymize_ip: true });
    };
  };

  // Load after page is interactive — 3.5s delay
  if (document.readyState === 'complete') {
    setTimeout(loadGA, 3500);
  } else {
    window.addEventListener('load', () => setTimeout(loadGA, 3500));
  }
}
