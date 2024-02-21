var router = {};
router._version = "1.2";
router._routes = [];

/* V1.2 */
router._rules = [];
router._prefix = null;
router._closemsg = "404 Not Found: Connection closed by the router";

router.rule = {
  hascookie(key) {
    // check if the cookie exist
    router._rules.push(function(req) {
      return req.cookies[key] != null;
    });
  },
  iscookie(key, val) {
    // check if the cookie matches the value
    router._rules.push(function(req) {
      return req.cookies[key] == val;
    });
  },
  hasheader(key) {
    // check if the cookie exist
    router._rules.push(function(req) {
      return req.headers[key] != null;
    });
  },
  isheader(key, val) {
    // check if the header matches the value
    router._rules.push(function(req) {
      return req.headers[key] == val;
    });
  },
  istype(val) {
    // check if the content type matches the value
    router._rules.push(function(req) {
      return req.type == val;
    });
  },
  hasbody() {
    // check if the body is provided
    router._rules.push(function(req) {
      return req.body != null;
    });
  },
  isparam(key, val) {
    // check if the parameter matches the value
    router._rules.push(function(req) {
      return req.params[key] == val;
    });
  },
}

// split the path and remove unnecessary segment
router._parse = function(raw) {
  return `${router._prefix || ""}/${raw}`.split("/").map(function(i) {
    return i.trim();
  }).filter(function(i) {
    return i.length > 0;
  });
}

// add a route with a custom method
router.route = function(method, path, func) {
  router._routes.push({
    method, func,
    path: router._parse(path),
    rules: router._rules
  });
  router._rules = [];
}

// add a route with GET method
router.get = function(path, func) {
  router._routes.push({
    method: "GET", func,
    path: router._parse(path),
    rules: router._rules
  });
  router._rules = [];
}

// add a route with POST method
router.post = function(path, func) {
  router._routes.push({
    method: "POST", func,
    path: router._parse(path),
    rules: router._rules
  });
  router._rules = [];
}

// define the not found route
router.notfound = function(func) {
  router._nf = func;
}

router.export = function(req, res) {
  // implementation of request
  var xreq = {
    query: req.query,
    headers: req.headers,
    params: {},
    method: req.method,
    body: null,
    url: req.url,
    real: req,
    /* v1.2 */
    address: {
      remote: req.socket.remoteAddress,
      local: req.socket.localAddress
    },
    type: req.headers["content-type"],
    length: req.headers["content-length"],
    agent: req.headers["user-agent"],
    proxy: req.headers["x-forwarded-to"],
    hash: new URL("a://a.a/" + req.url).hash.slice(1),
    cookies: req.cookie.split(";").map(function(d) {
      var v = d.split("=");
      var k = v.shift();
      return [k, v.join("=")];
    }).filter(function(d) {
      return !["expires", "path"].includes(d[0]);
    })
  }
  // implementation of response
  var xres = {
    real: res,
    // set the header
    set(key, val) {
      this.real.setHeader(key, val);
    },
    // write the header for redirection and close the connection
    /* v1.2 modification: ispermanent */
    redirect(loc, ispermanent) {
      this.real.writeHead(ispermanent == true ? 301 : 302, {
        Location: loc
      });
      this.real.end();
    },
    // close the connection
    end(stat, text) {
      this.real.status(stat).send(text);
    },
    /* v1.2 */
    // refer to a specific route
    refer(path) {
      var ret = false;
      var f = null;
      routes._routes.forEach(function(r) {
        if(ret == true) return;
        if(r.path.join("/") == path.join("/")) {
          f = r.func;
          ret = true;
        }
      });
      f(xreq, xres);
      return ret;
    }
  }
  // check if the router is POST and the body is defined
  if(req.method == "POST" && req.body != null) {
    // if so, collect the chunks of data
    var cur = null;
    req.on("data", function(chunk) {
      if(cur == null) {
        // string compatible
        if(typeof chunk == "string") cur = chunk;
        // buffer compatible
        else cur = [chunk];
      } else {
        if(typeof chunk == "string") cur += chunk;
        else cur.push(chunk);
      }
    });
    req.on("end", function() {
      // define the body
      xreq.body = typeof cur == "string" ? cur : Buffer.concat(cur);
      process();
    });
  }
  // if not, skip the body
  else process();
  function process() {
    var unused = true;
    // loop each routes
    router._routes.forEach(function(route) {
      // if a route is used, skip all routes
      if(unused == false) return;
      var use = true;
      var skipseg = false;
      // parse the requested path into an array
      var path = router._parse(new URL("a://a.a/" + res.url).pathname);
      // if not the same method, skip the route
      if(req.method != route.method) use = false;
      // if not the same path length, skip the route
      else if(route.path.length != path.length) use = false;
      // check if the route contain dynamic path
      else if(route.path.join("/").includes(":")) {
        // check for each path segment
        path.forEach(function(segment, i) {
          // check if the segment is dynamic
          if(route.path[i].startsWith(":")) {
            // define the parameter
            xreq.params[route.path[i].slice(1)] = segment;
          }
          // if not, check if the segment is the same as the route segment
          // if not, skip the route
          else if(segment != route.path[i]) use = false;
        });
      } else if(use) {
        // check for each path segment
        path.forEach(function(segment, i) {
          // if a segment is not the same as the route segment, skip the route 
          if(segment != route.path[i]) use = false;
        });
      }
      // loop each rules
      route.rules.forEach(function(r) {
        // call the rule function
        var c = r(xreq);
        // if the rule is not satisfied, skip the router
        if(c == false) use = false;
      });
      // if the criteria is satisfied, use the route
      if(use) {
        unused = false;
        route.func(xreq, xres);
      }
    });
    // check if no route is used
    if(unused) {
      // if not found route is define, use it
      if(router._nf != null) router._nf(xreq, xres);
      else {
        // if not, throw the server-provided response
        xres.set("Content-Type", "text/plain");
        xres.end(404, router._closemsg);
      }
    }
  }
}

module.exports = router;