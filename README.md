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

## Routes

### Routing a GET request

```javascript
// router.get(<PATH>, <CALLBACK>)
router.get("/get-route", function(req, res) {
  // ...
});
```

### Routing a POST request

```javascript
// router.post(<PATH>, <CALLBACK>)
router.post("/post-route", function(req, res) {
  // ...
});
```

### Routing a request

```javascript
// router.route(<METHOD>, <PATH>, <CALLBACK>)
router.route("DELETE", "/delete-route", function(req, res) {
  // ...
});
```

### Routing a 404 request

```javascript
// router.notfound(<CALLBACK>)
router.notfound(function(req, res) {
  // ...
});
```

## Path syntax

Every router path supports these special path syntax.

For absolute path, you can directly pass the keyword.

```
Path: /user/johndoe

/user/someone -> Not accepted
/user/janedoe -> Not accepted
/user/johndoe -> Accepted

```

For dynamic path, you can insert `:` and then the name of the parameter. Take note that every path is length sensitive.

```
Path: /:foo/:bar

/path/to/foo -> Not accepted
/path/to -> Accepted
/hello/world -> Accepted
```

Moreover, you can interchangeably use them.

```
Path: /api/:user/:api/install

/johndoe/my-api -> Not accepted
/api/johndoe/my-api -> Not accepted
/api/johndoe/my-api/docs -> Not accepted
/api/johndoe/my-api/install -> Accepted
```

## Request and Response

creroute implements custom request object and response object.

### Request

```javascript
{
  query: String,
  headers: Object,
  params: Object,
  method: String,
  body: String | Buffer,
  cookie: String,
  url: String,
  real: Object
}
```

All of those data are inherited from the request object, excluding `params`, `body`, and `real`.

#### Real

`real` is the actual request object.

#### Parameters

`params` are the parameters passed from the route