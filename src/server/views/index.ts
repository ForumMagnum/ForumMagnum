const index = (helmet:any = {}, appHtml = '') => (
  `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${helmet.title.toString()}
    
    <style> section { border-bottom: 1px solid #ccc; border-top: 1px solid #ccc; margin: 15px 0px }</style>
</head>
<body>
    <main id="app">${appHtml}</main>
    
    <script type="text/javascript" src="/js/bundle.js?${Math.random()}"></script>
</body>
</html>`
)

export default index