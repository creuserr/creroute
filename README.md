# creroute
Lightweight HTTP server router for NodeJS

```javascript
const router = require("./router.js");

router.get("/echo/:text", function(req, res) {
  res.type("text/plain").end(200, req.params.text);
});

router.notfound(function(req, res) {
  res.type("text/plain").end(404, "Uh oh, page not found");
});

module.exports = router.export;
```

# Installation

The only method to install creroute is by [downloading](https://crestatic.vercel.app/creuserr/creroute/router.js) it and importing it locally.

```javascript
const router = require("./router.js");
```

# Documentation

## Setup

### Configuration 

In `vercel.json`, it is required to designate all path to `index.js`.

```json
{
  "rewrites": [{
    "source": "/(.*)",
    "destination": "/api/index.js"
  }]
}
```

Otherwise, you will need to add prefixes to each route.

### Initialization

To set up the router, you need to set the `module.exports` to `router.export`.

```javascript
const router = require("./router.js");

// ...

module.exports = router.export;
```

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

If not specified, the router will throw error like this instead.

```
404 Not Found: No satisfied router
[Connection closed by the router]
--------------------

Attempting /echo/:text
Failed: mismatched path length (0 -> 2)
```

*0 is the requested path length and 2 is the needed path length*

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

Moreover, you can use them both.

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
  cookie: Object,
  address: {
    local: String,
    remote: String,
    real: String // only works if vercel provided the real ip
  },
  type: String, // content type
  length: Number,
  agent: String,
  proxy: String, // only works if the proxy is provided
  hash: String,
  url: String,
  real: Object,
}
```

All of those data are inherited from the request object, excluding some parts:

#### Real

`real` is the actual request object.

#### Parameters

`params` are the parameters passed from the path.

```javascript
// Path: /:foo/:bar
// Request: /hello/world

req.params = {
  foo: "hello",
  bar: "world"
}
```

#### Body

`body` is either a buffer or string depending on the attached data. This parameter is not defined when the request method is not POST.

#### Cookie

`cookie` is an object inherited from the raw cookie data.

### Response

```javascript
{
  real: Object,
  set: Function(header, value),
  end: Function(status, content),
  redirect: Function(url, status?),
  type: Function(type),
  refer: Function(path)
}
```

`real` is the only non-custom key, which is the actual response object.

#### Set

`set` is a shortcut function to set a header.

```javascript
// req.set(<HEADER>, <VALUE>)
req.set("Content-Type", "text/plain");
req.set("Content-Length", 0);
```

#### End

`end` closes the connection with content and status.

```javascript
// req.end(<STATUS>, <CONTENT>)
req.end(200, "200 Success");
```

> [!WARNING]
> Once closed, do not call `redirect` or `end` again to prevent errors.

#### Redirect

`redirect` moves the request to another server. The default **status** is 302 (temporary).

```javascript
// req.redirect(<URL>, <STATUS>)
req.redirect("https://example.com/");
```

> [!WARNING]
> Once redirected, do not call `end` or `redirect` again to prevent errors.

#### Type

`type` defines the content type of the response.

#### Refer

`refer` calls the function from the other router.

```
router.get("/forbidden-things", function(req, res) {
  if(req.headers["X-Secret-Key"] == null) {
    return res.refer("/notfound")
  }
})

router.get("/notfound", function(req, res) {
  res.type("text/plain").end(404, "Not Found")
})

router.notfound(function(req, res) {
  res.refer("/notfound")
})
```

> [!WARNING]
> Do not end the connection after referring. Let the referred route close it to prevent errors.