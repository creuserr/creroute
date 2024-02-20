# creroute
Lightweight HTTP server router for NodeJS

```javascript
const router = require("./router.js");

router.get("/echo/:text", function(req, res) {
  res.set("Content-Type", "text/plain");
  res.end(200, req.params.text);
});

router.notfound(function(req, res) {
  res.set("Content-Type", "text/plain");
  res.end(404, "Uh oh, page not found");
});

module.exports = router.export;
```

# Installation

The only method to install creroute is by downloading it and importing it locally.

```javascript
const router = require("./router.js");
```

# Documentation

## Routing a GET request

```javascript
// router.get(<PATH>, <CALLBACK>)
router.get("/get-route", function(req, res) {
  // ...
});
```

## Routing a POST request

```javascript
// router.post(<PATH>, <CALLBACK>)
router.post("/post-route", function(req, res) {
  // ...
});
```

## Routing a request

```javascript
// router.route(<METHOD>, <PATH>, <CALLBACK>)
router.route("DELETE", "/delete-route", function(req, res) {
  // ...
});
```

## Routing a 404 