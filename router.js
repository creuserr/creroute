var router = {}
router._routes = []

router._parse = raw => {
  return raw.split("/").map(i => {
    return i.trim()
  }).filter(i => {
    return i.length > 0
  })
}

router._req = req => {
  var hash = new URL("a://a.a" + req.url).hash.slice(1)
  hash = hash.length == 0 ? null : hash
  var cookie = null
  if(req.cookie) {
    cookie = req.cookie.split(";").map(c => {
      var v = c.split("=")
      var k = v.shift()
      return [k, v.join("=")]
    }).filter(c => {
      return !["expires", "path"].includes(c[0])
    })
  }
  return {
    query: req.query,
    headers: req.headers,
    params: {},
    method: req.method,
    body: null,
    url: req.url,
    real: req,
    address: {
      remote: req.socket.remoteAddress,
      local: req.socket.localAddress,
      real: req.headers["x-real-ip"]
    },
    type: req.headers["content-type"],
    length: req.headers["content-length"],
    agent: req.headers["user-agent"],
    proxy: req.headers["x-forwarded-to"],
    hash, cookie
  }
}

router._res = (req, res) => {
  return {
    real: res,
    set(key, val) {
      this.real.setHeader(key, val)
      return this
    },
    type(val) {
      this.set("Content-Type", val)
      return this
    },
    redirect(loc, ispermanent) {
      this.real.writeHead(ispermanent == true ? 301 : 302, {
        Location: loc
      })
      this.real.end()
    },
    end(stat, text) {
      this.real.statusCode = stat
      this.real.end(text)
    },
    refer(path) {
      var ret = false
      var f = null
      routes._routes.forEach(route => {
        if(ret == true) return
        if(route.path.join("/") == path.join("/")) {
          f = r.func
          ret = true
        }
      })
      if(f != null) f(req, res)
      return ret
    }
  }
}

router._body = (req, on) => {
  var cur = null
  req.real.on("data", chunk => {
    if(cur == null) {
      if(typeof chunk == "string") cur = chunk
      else cur = [chunk]
    } else {
      if(typeof chunk == "string") cur += chunk
      else cur.push(chunk)
    }
  })
  req.real.on("end", () => {
    req.body = typeof cur == "string" ? cur : Buffer.concat(cur)
    on()
  })
}

router.route = (method, path, func) => {
  router._routes.push({
    method, func,
    path: router._parse(path)
  })
}

router.get = (path, func) => router.route("GET", path, func)

router.post = (path, func) => router.route("POST", path, func)

router.notfound = func => {
  router._fallback = func
}

router.export = (req, res) => {
  var request = router._req(req)
  var response = router._res(req, res)
  if(req.method == "POST" && req.body != null) {
    request._body(req, search)
  } else search()
  function search() {
    var data = []
    var done = false
    var path = router._parse(req.url.split("#")[0].split("?")[0])
    router._routes.forEach(route => {
      if(done) return
      var use = true
      var cdata = [`Attempting /${route.path.join("/")}`]
      if(route.method != req.method) {
        use = false
        cdata.push(`Failed: mismatched method (${req.method} -> ${route.method})`)
      } else if(route.path.length != path.length) {
        use = false
        cdata.push(`Failed: mismatched path length (${path.length} -> ${route.path.length})`)
      } else path.forEach(function(seg, i) {
        var match = route.path[i]
        if(match.startsWith(":")) {
          request.params[match.slice(1)] = seg
          cdata.push(`Parameter applied (${seg} -> ${match.slice(1)})`)
        } else if(match != seg) {
          use = false
          cdata.push(`Failed: mismatched segment (#${i} ${seg} -> ${match})`)
        }
      })
      if(use) {
        done = true
        route.func(request, response)
      } else {
        data.push(cdata.join("\n"))
      }
    })
    if(!done) {
      if(router._fallback != null) router._fallback(request, response)
      else response.type("text/plain").end(404, `404 Not Found: No satisfied route\n[Connection closed by the router]\n${"-".repeat(20)}\n\n${data.join("\n\n")}`)
    }
  }
}

module.exports = router;