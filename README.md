# creroute
Lightweight HTTP server router for NodeJS

```javascript
const router = require("./router.js");

router.get("/echo/:text", function(req, res) {
  res.set("Content-Type", "text/plain");
  res.end(200, req.params.text);
});

router.notfound(function(req, res))

module.exports = router.export;
```