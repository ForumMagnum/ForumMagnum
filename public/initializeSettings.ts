if (typeof window !== 'undefined') {
  console.log("initializing settings")
  window.publicSettings = JSON.parse(document.getElementById('publicSettings')?.textContent || '{}');
}