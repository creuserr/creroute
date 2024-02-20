var router = {};
router._version = 1;
router._routes = [];

router._parse = function(raw) {
  return raw.split("/").map(function(i) {
    return i.trim();
  }).filter(function(i) {
    return i.length > 0;
  });
}

router.get = function(path, func) {
  router._routes.push({
    method: "GET", func,
    path: router._parse(path)
  });
}

router.post = function(path, func) {
  router._routes.push({
    method: "POST", func,
    path: router._parse(path)
  });
}

router.notfound = function(func) {
  router._nf = func;
}

router.export = function(req, res) {
  var xreq = {
    query: req.query,
    headers: req.headers,
    params: {},
    method: req.method,
    body: null,
    cookie: req.cookie,
    url: req.url,
    real: req
  }
  var xres = {
    real: res,
    set(key, val) {
      this.real.setHeader(key, val);
    },
    redirect(loc, stat) {
      this.real.writeHead(stat || 302, {
        Location: loc
      });
      this.real.end();
    },
    end(stat, text) {
      this.real.status(stat).send(text);
    }
  }
  if(req.method == "POST" && req.body != null) {
    var cur = null;
    req.on("data", function(chunk) {
      if(cur == null) {
        if(typeof chunk == "string") cur = chunk;
        else cur = [chunk];
      } else {
        if(typeof chunk == "string") cur += chunk;
        else cur.push(chunk);
      }
    });
    req.on("end", function() {
      xreq.body = typeof cur == "string" ? cur : Buffer.concat(cur);
      process();
    });
  } else process();
  function process() {
    var unused = true;
    router._routes.forEach(function(route) {
      if(unused == false) return;
      var use = true;
      var path = router._parse(req.url.split("#")[0].split("?")[0]);
      if(path.length == 0 && route.path.length == 0) {
        unused = false;
        return route.func(xreq, xres);
      }
      if(req.method != route.method) use = false;
      else if(route.path.length != path.length) use = false;
      else if(route.path.join("/").includes(":")) {
        path.forEach(function(segment, i) {
          if(route.path[i].startsWith(":")) {
            xreq.params[route.path[i].slice(1)] = segment;
          } else if(segment != route.path[i]) use = false;
        });
      } else if(use) {
        path.forEach(function(segment, i) {
          if(segment != route.path[i]) use = false;
        });
      }
      if(use) {
        unused = false;
        route.func(xreq, xres);
      }
    });
    if(unused) {
      if(router._nf != null) router._nf(xreq, xres);
      else {
        xres.set("Content-Type", "text/plain");
        xres.end(404, "404 Not Found: Connection closed by the router");
      }
    }
  }
}

module.exports = router;