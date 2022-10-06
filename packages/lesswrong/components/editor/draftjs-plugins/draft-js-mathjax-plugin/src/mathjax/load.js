export default function load(src, cb) {
  const head = document.head || document.getElementsByTagName('head')[0]
  const script = document.createElement('script')

  script.type = 'text/javascript'
  script.async = true
  script.src = src

  if (cb) {
    script.onload = () => {
      script.onerror = null
      script.onload = null
      cb(null, script)
    }
    script.onerror = () => {
      script.onerror = null
      script.onload = null
      cb(new Error(`Failed to load ${src}`), script)
    }
  }

  head.appendChild(script)
}
