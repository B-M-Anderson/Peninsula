/* eslint-disable */
// The BA leaf generator. It lays out the letters first as reserved whitespace, then grows an
// organic leaf around them: a Monstera (light theme) or a Madagascar lace-leaf (dark theme).
// Every seed gives a different leaf with the same letters. Plain ES5 on purpose: it is a
// self-contained geometry routine with no dependencies, shared by the site and by the scripts
// that bake the static marks. Typed entry points live in ./leaf.ts.
//
//   monstera(seed, {level, orient, interrupt, loose})
//   lace(seed, {level, interrupt, loose})
// level: 2 = full detail, 1 = simplified, 0 = letters in a plain leaf
// interrupt: how much of the letter whitespace leaf tissue may occupy (0..0.3)
export function makeBALeaf() {
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function pathOf(pts) {
    var ar = 0, q;
    for (q = 0; q < pts.length; q++) { var p0 = pts[q], p1 = pts[(q + 1) % pts.length]; ar += p0[0] * p1[1] - p1[0] * p0[1]; }
    if (ar < 0) pts = pts.slice().reverse();
    var s = 'M';
    for (var i = 0; i < pts.length; i++) s += (i ? 'L' : '') + f1(pts[i][0]) + ',' + f1(pts[i][1]);
    return s + 'Z';
  }
  function cub(p0, p1, p2, p3, n) {
    var out = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, m = 1 - t;
      out.push([m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0],
                m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]]);
    }
    return out;
  }
  function inPoly(pts, x, y) {
    var c = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function dSeg(px, py, a, b) {
    var vx = b[0] - a[0], vy = b[1] - a[1], wx = px - a[0], wy = py - a[1];
    var l = vx * vx + vy * vy, t = l ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / l)) : 0;
    var dx = px - (a[0] + t * vx), dy = py - (a[1] + t * vy);
    return Math.sqrt(dx * dx + dy * dy);
  }
  function dPoly(pts, x, y) {           // 0 inside, else distance to the outline
    if (inPoly(pts, x, y)) return 0;
    var d = 1e9;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) d = Math.min(d, dSeg(x, y, pts[j], pts[i]));
    return d;
  }
  function dEdge(pts, x, y) {           // distance to a closed outline, inside or out
    var d = 1e9;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) d = Math.min(d, dSeg(x, y, pts[j], pts[i]));
    return d;
  }
  function dLine(pts, x, y) {
    var d = 1e9;
    for (var i = 1; i < pts.length; i++) d = Math.min(d, dSeg(x, y, pts[i - 1], pts[i]));
    return d;
  }
  function roundPoly(pts, r) {          // rounded corners, returned as a point list
    var out = [], n = pts.length;
    for (var i = 0; i < n; i++) {
      var p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      var la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
      var ra = Math.min(r, la * 0.45), rb = Math.min(r, lb * 0.45);
      var s = [p[0] + (a[0] - p[0]) / la * ra, p[1] + (a[1] - p[1]) / la * ra];
      var e = [p[0] + (b[0] - p[0]) / lb * rb, p[1] + (b[1] - p[1]) / lb * rb];
      for (var k = 0; k <= 5; k++) {
        var t = k / 5, m = 1 - t;
        out.push([m * m * s[0] + 2 * m * t * p[0] + t * t * e[0], m * m * s[1] + 2 * m * t * p[1] + t * t * e[1]]);
      }
    }
    return out;
  }
  function arc(cx, cy, r, a0, a1, n) {
    var out = [];
    for (var i = 0; i <= n; i++) { var a = lerp(a0, a1, i / n); out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return out;
  }
  function smooth(arr, passes) {
    for (var p = 0; p < passes; p++) {
      var o = arr.slice();
      for (var i = 1; i < arr.length - 1; i++) arr[i] = (o[i - 1] + 2 * o[i] + o[i + 1]) / 4;
    }
    return arr;
  }
  // tapered ribbon / slot around a centreline
  function ribbon(c, r, capStart, capEnd) {
    var L = [], R = [], n = c.length, i;
    for (i = 0; i < n; i++) {
      var a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
      var tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
      var nx = -ty / l, ny = tx / l;
      L.push([c[i][0] + nx * r[i], c[i][1] + ny * r[i]]);
      R.push([c[i][0] - nx * r[i], c[i][1] - ny * r[i]]);
    }
    var pts = L.slice();
    if (capEnd) {
      var e = c[n - 1], a1 = Math.atan2(L[n - 1][1] - e[1], L[n - 1][0] - e[0]);
      pts = pts.concat(arc(e[0], e[1], r[n - 1], a1, a1 - Math.PI, 8).slice(1, 8));
    }
    pts = pts.concat(R.reverse());
    if (capStart) {
      var s = c[0], a0 = Math.atan2(R[R.length - 1][1] - s[1], R[R.length - 1][0] - s[0]);
      pts = pts.concat(arc(s[0], s[1], r[0], a0, a0 - Math.PI, 8).slice(1, 8));
    }
    return pts;
  }

  // ------------------------------------------------------------ letters (the whitespace)
  function glyphs(cx, ytop, H, sc) {
    var yb = ytop + H, t = 21;
    // B
    var xrb = cx - 11, x0 = xrb - 74, xrt = xrb - 8, ym = ytop + H * 0.47;
    var Rt = (ym - ytop) / 2, Rb = (yb - ym) / 2;
    var Bo = [[x0 + 3, ytop]].concat(
      arc(xrt - Rt, ytop + Rt, Rt, -Math.PI / 2, Math.PI / 2, 22),
      arc(xrb - Rb, ym + Rb, Rb, -Math.PI / 2, Math.PI / 2, 24),
      [[x0 + 3, yb], [x0, yb - 3], [x0, ytop + 3]]);
    function dShape(l, top, bot, right) {
      var R = (bot - top) / 2;
      return roundPoly([[l, top]].concat(arc(right - R, top + R, R, -Math.PI / 2, Math.PI / 2, 16), [[l, bot]]), 3);
    }
    var B1 = dShape(x0 + t, ytop + 18, ym - 8.5, xrt - 20);
    var B2 = dShape(x0 + t, ym + 8.5, yb - 18, xrb - 20);
    // A
    var a = 9, hw = 54, th = 22, axc = cx + 9 + hw, s = (hw - a) / H;
    var yc0 = ytop + H * 0.60, yc1 = yc0 + 16;
    function ih(y) { return a + s * (y - ytop) - th; }
    var Ao = roundPoly([[axc - a, ytop], [axc + a, ytop], [axc + hw, yb], [axc + hw - th, yb],
      [axc + ih(yc1), yc1], [axc - ih(yc1), yc1], [axc - hw + th, yb], [axc - hw, yb]], 2.5);
    var yap = ytop + (th - a) / s;
    var A1 = roundPoly([[axc, yap], [axc + ih(yc0), yc0], [axc - ih(yc0), yc0]], 2.5);
    var Ahull = [[axc - a - 1, ytop], [axc + a + 1, ytop], [axc + hw, yb], [axc - hw, yb]];
    var px = cx + 9, py = (ytop + yb) / 2;
    function S(pts) { return pts.map(function (p) { return [px + (p[0] - px) * sc, py + (p[1] - py) * sc]; }); }
    return {
      outers: [S(Bo), S(Ao)], hulls: [S(Bo), S(Ahull)], islands: [S(B1), S(B2), S(A1)],
      islandSide: [-1, -1, 1], bStemR: px + (x0 + t - px) * sc, ytop: py - H / 2 * sc, yb: py + H / 2 * sc, x0: px + (x0 - px) * sc, x1: px + (axc + hw - px) * sc
    };
  }

  // ------------------------------------------------------------ tissue inside the whitespace
  // feats: [{pts, r, cap, forced}]  -> scales / drops them until they occupy <= limit of the letters
  function budget(feats, outers, islands, limit) {
    var xa = 1e9, xb = -1e9, ya = 1e9, yb = -1e9, samples = [], i, f, s;
    outers.forEach(function (g) { g.forEach(function (p) { xa = Math.min(xa, p[0]); xb = Math.max(xb, p[0]); ya = Math.min(ya, p[1]); yb = Math.max(yb, p[1]); }); });
    for (var yy = ya; yy < yb; yy += 2.5) for (var xx = xa; xx < xb; xx += 2.5) {
      var w = false, k;
      for (k = 0; k < outers.length; k++) if (inPoly(outers[k], xx, yy)) w = true;
      for (k = 0; w && k < islands.length; k++) if (inPoly(islands[k], xx, yy)) w = false;
      if (w) samples.push([xx, yy]);
    }
    var need = feats.map(function (ft) {            // smallest scale at which this feature covers each sample
      var a = new Array(samples.length), bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9, rm = 0;
      ft.pts.forEach(function (p, q) { bx0 = Math.min(bx0, p[0]); bx1 = Math.max(bx1, p[0]); by0 = Math.min(by0, p[1]); by1 = Math.max(by1, p[1]); rm = Math.max(rm, ft.r[q]); });
      rm *= 1.6;
      for (var si = 0; si < samples.length; si++) {
        var sx = samples[si][0], sy = samples[si][1], best = 1e9;
        if (sx > bx0 - rm && sx < bx1 + rm && sy > by0 - rm && sy < by1 + rm)
          for (var q2 = 1; q2 < ft.pts.length; q2++) {
            var rr = (ft.r[q2 - 1] + ft.r[q2]) / 2;
            if (rr > 0.2) best = Math.min(best, dSeg(sx, sy, ft.pts[q2 - 1], ft.pts[q2]) / rr);
          }
        a[si] = best;
      }
      return a;
    });
    var on = feats.map(function () { return true; });
    function cov(k) {
      var h = 0;
      for (s = 0; s < samples.length; s++) { for (f = 0; f < feats.length; f++) if (on[f] && need[f][s] < k) { h++; break; } }
      return h / Math.max(1, samples.length);
    }
    function solve(lo, hi) { for (var it = 0; it < 12; it++) { var m = (lo + hi) / 2; if (cov(m) > limit) hi = m; else lo = m; } return lo; }
    var kk = 1, guard = 0;
    if (limit <= 0) return { k: 0, on: on.map(function () { return false; }), f: 0 };
    while (cov(0.55) > limit && guard++ < 40) {      // too busy even when thinned: let a free feature go
      var worst = -1, wc = -1;
      for (f = 0; f < feats.length; f++) {
        if (!on[f] || feats[f].forced) continue;
        var c = 0; for (s = 0; s < samples.length; s++) if (need[f][s] < 0.55) c++;
        if (c > wc) { wc = c; worst = f; }
      }
      if (worst < 0) break;
      on[worst] = false;
    }
    kk = cov(1) > limit ? solve(0.4, 1) : solve(1, 1.4);
    return { k: kk, on: on, f: cov(kk) };
  }

  // ------------------------------------------------------------ soft whitespace
  // The letters are turned into a smooth field, so everything that touches them blends in with
  // rounded joins: tissue pushes in (strands, lobes), the whitespace can bulge out (bays), and the
  // result is traced back into outlines. Nothing here can make a sharp point.
  function smin(a, b, k) { var h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
  function rawPath(pts) {
    var s = 'M';
    for (var i = 0; i < pts.length; i++) s += (i ? 'L' : '') + f1(pts[i][0]) + ',' + f1(pts[i][1]);
    return s + 'Z';
  }
  function softLetters(G, tissue, bays, limit, wob, passes) {
    var st = 2, mg = 14, gx = G.x0 - mg, gy = G.ytop - mg;
    var nx = Math.ceil((G.x1 - G.x0 + 2 * mg) / st) + 1, ny = Math.ceil((G.yb - G.ytop + 2 * mg) / st) + 1, N = nx * ny;
    var base = new Float32Array(N), isW = new Uint8Array(N), i, j, c, k, t;
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      var x = gx + i * st, y = gy + j * st, dO = 1e9, inO = false, dI = 1e9, inI = false, d;
      for (k = 0; k < G.outers.length; k++) {
        d = dEdge(G.outers[k], x, y);
        if (inPoly(G.outers[k], x, y)) { inO = true; dO = d; break; }
        dO = Math.min(dO, d);
      }
      if (inO) for (k = 0; k < G.islands.length; k++) {
        d = dEdge(G.islands[k], x, y);
        if (inPoly(G.islands[k], x, y)) { inI = true; dI = d; break; }
        dI = Math.min(dI, d);
      }
      var v = inI ? dI : (inO ? Math.max(-dO, -dI) : dO);
      c = i + j * nx; isW[c] = v < 0 ? 1 : 0;
      base[c] = v + wob[0] * Math.sin(x * wob[1] + wob[2]) * Math.sin(y * wob[3] + wob[4]);
    }
    function distGrid(pts) {
      var g = new Float32Array(N), ax = 1e9, bx = -1e9, ay = 1e9, by = -1e9;
      pts.forEach(function (p) { ax = Math.min(ax, p[0]); bx = Math.max(bx, p[0]); ay = Math.min(ay, p[1]); by = Math.max(by, p[1]); });
      for (var jj = 0; jj < ny; jj++) for (var ii = 0; ii < nx; ii++) {
        var x = gx + ii * st, y = gy + jj * st, d = 1e9;
        if (x < ax - 16 || x > bx + 16 || y < ay - 16 || y > by + 16) { g[ii + jj * nx] = 99; continue; }
        if (pts.length === 1) d = Math.hypot(x - pts[0][0], y - pts[0][1]);
        else for (var q = 1; q < pts.length; q++) d = Math.min(d, dSeg(x, y, pts[q - 1], pts[q]));
        g[ii + jj * nx] = d;
      }
      return g;
    }
    var tg = tissue.map(function (f) { return distGrid(f.pts); }), bg = bays.map(function (b) { return distGrid([b.c]); });
    var on = tissue.map(function () { return true; });
    function combine(kk) {
      var f = new Float32Array(N), q;
      for (c = 0; c < N; c++) {
        var d = base[c];
        for (q = 0; q < bays.length; q++) d = smin(d, bg[q][c] - bays[q].r, 5);
        for (q = 0; q < tissue.length; q++) if (on[q] && kk > 0) d = -smin(-d, -(tissue[q].r * kk - tg[q][c]), 5);
        f[c] = d;
      }
      for (var p = 0; p < passes; p++) {              // soften: rounds every corner and join
        var o = f.slice();
        for (j = 1; j < ny - 1; j++) for (i = 1; i < nx - 1; i++) {
          c = i + j * nx;
          f[c] = (4 * o[c] + 2 * (o[c - 1] + o[c + 1] + o[c - nx] + o[c + nx]) + o[c - nx - 1] + o[c - nx + 1] + o[c + nx - 1] + o[c + nx + 1]) / 16;
        }
      }
      for (i = 0; i < nx; i++) { f[i] = 1; f[i + (ny - 1) * nx] = 1; }
      for (j = 0; j < ny; j++) { f[j * nx] = 1; f[nx - 1 + j * nx] = 1; }
      return f;
    }
    function lost(f) { var w = 0, h = 0; for (c = 0; c < N; c++) if (isW[c]) { w++; if (f[c] >= 0) h++; } return h / Math.max(1, w); }
    var f0 = lost(combine(0)), kk = 0, fld = null, got = 0;
    if (limit > 0 && tissue.length) {
      var guard = 0;
      while (lost(combine(0.5)) - f0 > limit && guard++ < 20) {   // too much even when thin: drop the largest free piece
        var worst = -1, wr = -1;
        for (t = 0; t < tissue.length; t++) if (on[t] && !tissue[t].forced && tissue[t].r * Math.max(1, tissue[t].pts.length) > wr) { wr = tissue[t].r * Math.max(1, tissue[t].pts.length); worst = t; }
        if (worst < 0) break;
        on[worst] = false;
      }
      var lo = 0.5, hi = 1.25;
      if (lost(combine(hi)) - f0 <= limit) lo = hi;
      else for (t = 0; t < 5; t++) { var mid = (lo + hi) / 2; if (lost(combine(mid)) - f0 > limit) hi = mid; else lo = mid; }
      kk = lo;
    }
    fld = combine(kk); got = Math.max(0, lost(fld) - f0);

    // trace the zero level (marching squares), stitch into loops, smooth once
    var P = {}, adj = {};
    function ept(key, a, b, ax, ay, bx, by) { if (!P[key]) { var tt = a / (a - b); P[key] = [ax + (bx - ax) * tt, ay + (by - ay) * tt]; } return key; }
    function link(a, b) { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); }
    for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
      var a = fld[i + j * nx], b = fld[i + 1 + j * nx], cc = fld[i + 1 + (j + 1) * nx], dd = fld[i + (j + 1) * nx];
      var idx = (a < 0 ? 8 : 0) | (b < 0 ? 4 : 0) | (cc < 0 ? 2 : 0) | (dd < 0 ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      var x0 = gx + i * st, y0 = gy + j * st, x1 = x0 + st, y1 = y0 + st;
      var Tk = function () { return ept(2 * (i + j * nx), a, b, x0, y0, x1, y0); };
      var Bk = function () { return ept(2 * (i + (j + 1) * nx), dd, cc, x0, y1, x1, y1); };
      var Lk = function () { return ept(2 * (i + j * nx) + 1, a, dd, x0, y0, x0, y1); };
      var Rk = function () { return ept(2 * (i + 1 + j * nx) + 1, b, cc, x1, y0, x1, y1); };
      var ctr = (a + b + cc + dd) / 4 < 0;
      switch (idx) {
        case 1: case 14: link(Lk(), Bk()); break;
        case 2: case 13: link(Bk(), Rk()); break;
        case 3: case 12: link(Lk(), Rk()); break;
        case 4: case 11: link(Tk(), Rk()); break;
        case 6: case 9: link(Tk(), Bk()); break;
        case 7: case 8: link(Tk(), Lk()); break;
        case 5: if (ctr) { link(Tk(), Lk()); link(Rk(), Bk()); } else { link(Tk(), Rk()); link(Lk(), Bk()); } break;
        case 10: if (ctr) { link(Tk(), Rk()); link(Lk(), Bk()); } else { link(Tk(), Lk()); link(Rk(), Bk()); } break;
      }
    }
    function sample(x, y) {
      var fx = (x - gx) / st, fy = (y - gy) / st, ix = Math.max(0, Math.min(nx - 2, Math.floor(fx))), iy = Math.max(0, Math.min(ny - 2, Math.floor(fy)));
      var ux = fx - ix, uy = fy - iy, q = ix + iy * nx;
      return (fld[q] * (1 - ux) + fld[q + 1] * ux) * (1 - uy) + (fld[q + nx] * (1 - ux) + fld[q + nx + 1] * ux) * uy;
    }
    var seen = {}, d = '';
    Object.keys(adj).forEach(function (start) {
      if (seen[start]) return;
      var loop = [], cur = start, prev = null;
      while (cur != null && !seen[cur]) {
        seen[cur] = 1; loop.push(P[cur]);
        var nb = adj[cur], nxt = null;
        for (var q = 0; q < nb.length; q++) if (nb[q] != prev && !seen[nb[q]]) { nxt = nb[q]; break; }
        prev = cur; cur = nxt;
      }
      if (loop.length < 5) return;
      var sm = [], n = loop.length, ar = 0, q2;
      for (q2 = 0; q2 < n; q2++) {
        var p = loop[q2], r = loop[(q2 + 1) % n];
        sm.push([0.75 * p[0] + 0.25 * r[0], 0.75 * p[1] + 0.25 * r[1]], [0.25 * p[0] + 0.75 * r[0], 0.25 * p[1] + 0.75 * r[1]]);
        ar += p[0] * r[1] - r[0] * p[1];
      }
      if (Math.abs(ar) < 14) return;
      // outlines of whitespace wind one way and outlines of tissue inside it the other, so islands stay holes
      var e0 = loop[0], e1 = loop[1], ex = e1[0] - e0[0], ey = e1[1] - e0[1], el = Math.hypot(ex, ey) || 1;
      var tp = [(e0[0] + e1[0]) / 2 - ey / el * 0.7, (e0[1] + e1[1]) / 2 + ex / el * 0.7];
      var enclosesWhite = (sample(tp[0], tp[1]) < 0) === inPoly(loop, tp[0], tp[1]);
      if ((ar > 0) !== enclosesWhite) sm.reverse();
      d += rawPath(sm);
    });
    return { d: d, interrupt: got };
  }

  // ------------------------------------------------------------ Monstera
  function monstera(seed, opts) {
    opts = opts || {};
    var level = opts.level == null ? 2 : opts.level;
    var down = opts.orient === 'down';
    var limit = opts.interrupt == null ? 0.12 : opts.interrupt;
    var density = opts.density == null ? 1 : opts.density;
    var R = rng(seed * 7919 + 13), u = function (a, b) { return lerp(a, b, R()); };
    var W = 340, Hh = 300, cx = 158, VH = 318;
    var T = function (p) { return down ? [p[0], Hh - p[1]] : p; };

    // 1. whitespace first
    var G = glyphs(cx, down ? 64 : 100, 136, opts.letterScale || 0.86);

    // 2. leaf outline (leaf space: tip up)
    var top = 10 + u(0, 6), tipx = cx + u(-10, 10), cleft = 249 + u(-3, 3);
    function half(sg, hw, sh, bot) {
      var a = cub([tipx, top], [tipx + sg * 20, top + 12], [cx + sg * hw, sh - 104], [cx + sg * hw, sh], 34);
      var b = cub([cx + sg * hw, sh], [cx + sg * hw, sh + 72], [cx + sg * hw * 0.86, bot], [cx + sg * hw * 0.5, bot], 26);
      var c = cub([cx + sg * hw * 0.5, bot], [cx + sg * hw * 0.24, bot], [cx + sg * 7, cleft + 24], [cx, cleft], 20);
      return a.concat(b.slice(1), c.slice(1));
    }
    var rightH = half(1, 152 + u(-5, 5), 158 + u(-9, 9), 287 + u(-6, 3));
    var leftH = half(-1, 125 + u(-5, 5), 158 + u(-9, 9), 285 + u(-7, 4));
    var leaf = rightH.concat(leftH.reverse().slice(1, -1)).map(T);
    // short petiole, grown from the sinus between the lobes
    var sLen = u(40, 56), sLean = u(-15, 15), sW = u(2.9, 3.9);
    var sA = [cx, cleft - 5], sB = [cx + sLean * 0.15, cleft + sLen * 0.5], sC = [cx + sLean, cleft + sLen], sp = [], sr = [];
    for (var si0 = 0; si0 <= 12; si0++) {
      var st = si0 / 12, sm = 1 - st;
      sp.push(T([sm * sm * sA[0] + 2 * sm * st * sB[0] + st * st * sC[0], sm * sm * sA[1] + 2 * sm * st * sB[1] + st * st * sC[1]]));
      sr.push(sW * lerp(0.92, 1.12, st));
    }
    var loose = opts.loose == null ? 0.6 : opts.loose;
    var wob = [u(0.7, 1.5) * loose, u(0.05, 0.085), u(0, 6.28), u(0.05, 0.085), u(0, 6.28)], passes = 1 + Math.round(2 * loose);
    var out = { vb: [0, down ? Hh - VH : 0, W, VH], leaf: pathOf(leaf), cuts: '', letters: '',
                islands: '', veins: '', stem: pathOf(ribbon(sp, sr, false, true)), interrupt: 0,
                cutList: [], origin: T([cx, cleft]) };
    if (level < 2) out.letters = softLetters(G, [], [], 0, wob, passes).d;
    if (level === 0) return out;

    // 3. venation skeleton: pinnate secondaries off a (hidden) midrib
    var NS = 72, Lv = 240;
    function makeVein(sg, y0, phi, curv, mz) {
      var d = [sg * Math.sin(phi), -Math.cos(phi)], O = [cx, y0];
      var P1 = [O[0] + d[0] * Lv * 0.5, O[1] + d[1] * Lv * 0.5];
      var P2 = [O[0] + d[0] * Lv, O[1] + d[1] * Lv - curv * Lv];
      var pts = [], nx = -d[1], ny = d[0];
      for (var i = 0; i <= NS; i++) {
        var t = i / NS, m = 1 - t, wob = mz ? mz[0] * Math.sin(6.283 * mz[1] * t + mz[2]) * Math.min(1, i / 7) : 0;
        pts.push(T([m * m * O[0] + 2 * m * t * P1[0] + t * t * P2[0] + nx * wob, m * m * O[1] + 2 * m * t * P1[1] + t * t * P2[1] + ny * wob]));
      }
      return pts;
    }
    var sides = [-1, 1], veins = [];
    for (var si = 0; si < 2; si++) {
      var sg = sides[si];
      var n = level === 2 ? Math.round((6 + Math.floor(R() * 2)) * density) : 4;
      n = Math.max(3, n);
      var off = u(-0.25, 0.25);
      for (var i = 0; i < n; i++) {
        var tt = (i + 0.5 + off + u(-0.22, 0.22)) / n;
        tt = Math.max(0.03, Math.min(0.98, tt));
        var y0 = lerp(38, cleft + 2, tt);
        var phi = tt < 0.72 ? lerp(36, 80, tt / 0.72) : lerp(80, 138, (tt - 0.72) / 0.28);
        phi = (phi + u(-5, 5)) * Math.PI / 180;
        var curv = lerp(0.20, -0.04, tt) + u(-0.03, 0.03);
        var mz = [u(1.6, 4.6), u(1.2, 2.6), u(0, 6.28)];
        veins.push({ sg: sg, y0: y0, phi: phi, curv: curv, tt: tt, mz: mz, pts: makeVein(sg, y0, phi, curv, mz) });
      }
    }
    // every counter island needs a vein through it, so it stays attached to the leaf
    if (level === 2) {
      var used = {};
      for (var k = 0; k < G.islands.length; k++) {
        var isl = G.islands[k], cxs = 0, cys = 0;
        for (var q = 0; q < isl.length; q++) { cxs += isl[q][0]; cys += isl[q][1]; }
        cxs /= isl.length; cys /= isl.length;
        var best = -1, bd = 1e9, bdiff = 0;
        for (var v = 0; v < veins.length; v++) {
          if (veins[v].sg !== G.islandSide[k] || used[v]) continue;
          var p = veins[v].pts, yv = null;
          for (var j = 1; j < p.length; j++) {
            if ((p[j - 1][0] - cxs) * (p[j][0] - cxs) <= 0) { yv = p[j][1]; break; }
          }
          if (yv === null) continue;
          if (Math.abs(yv - cys) < bd) { bd = Math.abs(yv - cys); best = v; bdiff = cys - yv; }
        }
        if (best >= 0) {
          used[best] = 1;
          var ve = veins[best], jit = u(-5, 5);
          ve.y0 += (down ? -1 : 1) * (bdiff + jit);
          ve.pts = makeVein(ve.sg, ve.y0, ve.phi, ve.curv, ve.mz);
          ve.forced = true;
        }
      }
      veins.sort(function (a, b) { return a.sg - b.sg || a.y0 - b.y0; });
    }
    function inLeaf(p) { return inPoly(leaf, p[0], p[1]); }
    function dLetters(p) { return Math.min(dPoly(G.hulls[0], p[0], p[1]), dPoly(G.hulls[1], p[0], p[1])); }

    // 4. splits and fenestrations live between neighbouring veins, never inside the letters' halo
    var cuts = [], pad = 10, rmin = level === 2 ? 4.2 : 6;
    for (var s2 = 0; s2 < 2; s2++) {
      var vs = veins.filter(function (v) { return v.sg === sides[s2]; });
      for (var a = 0; a + 1 < vs.length; a++) {
        var A = vs[a].pts, B = vs[a + 1].pts, c = [], r = [], ok = [];
        var fill = level === 2 ? u(0.40, 0.60) : 0.62, rmax = level === 2 ? u(11, 16) : 17, ph = u(0, 6.28);
        for (var i2 = 0; i2 <= NS; i2++) {
          var m = [(A[i2][0] + B[i2][0]) / 2, (A[i2][1] + B[i2][1]) / 2];
          var g = Math.hypot(A[i2][0] - B[i2][0], A[i2][1] - B[i2][1]);
          var rr = Math.min(g * 0.5 * fill - 1.2, rmax, dLetters(m) - pad, Math.abs(m[0] - cx) - 10);
          c.push(m); r.push(rr);
        }
        smooth(r, 3);
        var exit = -1;
        for (var i3 = 2; i3 <= NS; i3++) if (!inLeaf(c[i3])) { exit = i3; break; }
        if (exit < 0) continue;
        var start = exit;
        while (start > 0 && r[start - 1] >= rmin && dLetters(c[start - 1]) - pad >= r[start - 1] * 0.9) start--;
        var len = 0;
        for (var i4 = start + 1; i4 < exit; i4++) len += Math.hypot(c[i4][0] - c[i4 - 1][0], c[i4][1] - c[i4 - 1][1]);
        if (len < 15) continue;
        var end = Math.min(NS, exit + 4), step = len / Math.max(1, exit - start);
        // clean taper: narrow rounded inner end, widening to the margin, never past the clearance
        var lim = r.slice(), rin = Math.max(rmin, Math.min(lim[start], u(4.6, 6.4) + (level === 2 ? 0 : 2)));
        var rout = Math.min(rmax, Math.max(rin, lim[Math.max(start, exit - 2)]));
        var span = Math.max(1, exit - start), i5, sc2 = 1;
        for (i5 = start; i5 <= end; i5++) {
          var tq = Math.min(1, (i5 - start) / span);
          r[i5] = lerp(rin, rout, Math.pow(tq, 0.85)) * (1 + 0.035 * Math.sin(i5 * 0.7 + ph));
          if (i5 < exit && lim[i5] > 0 && r[i5] > lim[i5]) sc2 = Math.min(sc2, lim[i5] / r[i5]);
        }
        if (sc2 < 1) for (i5 = start; i5 <= end; i5++) r[i5] = Math.max(rmin * 0.85, r[i5] * sc2);
        function oval(a, b) {                      // closed fenestration: spindle with soft ends
          var cc = c.slice(a, b + 1), rr2 = [];
          for (var q2 = 0; q2 < cc.length; q2++) {
            var tz = q2 / (cc.length - 1);
            rr2.push(Math.max(2.2, r[a + q2] * Math.pow(Math.sin(Math.PI * lerp(0.12, 0.88, tz)), 0.7)));
          }
          return ribbon(cc, rr2, true, true);
        }
        var roll = R();
        if (level === 2 && len > 62 && roll < 0.6) {            // inner hole + bridge + outer split
          var cutAt = start + Math.round(span * u(0.34, 0.46)), gapN = Math.max(2, Math.round(u(11, 15) / step));
          if (cutAt - start >= 3) cuts.push(oval(start, cutAt));
          cuts.push(ribbon(c.slice(cutAt + gapN, end + 1), r.slice(cutAt + gapN, end + 1), true, false));
        } else if (level === 2 && len > 30 && roll > 0.84) {     // closed fenestration
          var stop = exit - Math.max(2, Math.round(u(11, 16) / step));
          if (stop - start >= 3) cuts.push(oval(start, stop));
        } else {
          cuts.push(ribbon(c.slice(start, end + 1), r.slice(start, end + 1), true, false));
        }
      }
    }
    out.cutList = cuts.map(function (c) {
      var mx = 0, my = 0; c.forEach(function (p) { mx += p[0]; my += p[1]; });
      return { d: pathOf(c), x: mx / c.length, y: my / c.length };
    });
    out.cuts = out.cutList.map(function (c) { return c.d; }).join('');

    // 5. tissue grows into the letters, and the letters loosen a little, all as smooth rounded forms:
    //    strands that cross a stroke, fingers that stop short, lobes on the edges, and bays where the
    //    whitespace bulges out. The tissue is held under the interruption limit.
    if (level === 2) {
      var allEdges = G.outers.concat(G.islands);
      var inWhite = function (x, y) {
        if (!(inPoly(G.outers[0], x, y) || inPoly(G.outers[1], x, y))) return false;
        return !(inPoly(G.islands[0], x, y) || inPoly(G.islands[1], x, y) || inPoly(G.islands[2], x, y));
      };
      var depth = function (x, y) { var d = 1e9; for (var q = 0; q < allEdges.length; q++) d = Math.min(d, dEdge(allEdges[q], x, y)); return d; };
      var tissue = [], bays = [], bx0 = G.x0 - 8, bx1 = G.x1 + 8, by0 = G.ytop - 8, by1 = G.yb + 8;
      veins.forEach(function (v) {
        var p = [v.pts[0]], i;
        for (i = 1; i < v.pts.length; i++) { if (!inLeaf(v.pts[i])) break; p.push(v.pts[i]); }
        if (p.length < 6) return;
        var n = p.length, wh = [], dp = [];
        for (i = 0; i < n; i++) {
          var near = p[i][0] > bx0 && p[i][0] < bx1 && p[i][1] > by0 && p[i][1] < by1, w = near && inWhite(p[i][0], p[i][1]);
          wh.push(w); dp.push(w ? depth(p[i][0], p[i][1]) : 0);
        }
        var runs = [], st = -1;
        for (i = 0; i <= n; i++) {
          if (i < n && wh[i]) { if (st < 0) st = i; }
          else if (st >= 0) { runs.push([st, i - 1]); st = -1; }
        }
        if (!runs.length) return;
        // each crossing is decided on its own. A strand never cuts the bowls of the B, which are what
        // make it a B; it may cut the stem or either leg of the A.
        var skipAll = !v.forced && R() < 0.4, isl = -1, made = 0;
        for (i = 0; i < n && isl < 0; i++) for (var q = 0; q < G.islands.length; q++) if (inPoly(G.islands[q], p[i][0], p[i][1])) { isl = i; break; }
        for (var ri = 0; ri < runs.length; ri++) {
          var a = runs[ri][0], b = runs[ri][1], md = 0, roll = R(), stopAt = u(0.42, 0.62);
          for (i = a; i <= b; i++) md = Math.max(md, dp[i]);
          if (skipAll) continue;
          if (md < 4.6 || Math.hypot(p[b][0] - p[a][0], p[b][1] - p[a][1]) > 38) continue;      // would run along a stroke
          var mid = p[Math.round((a + b) / 2)];
          if (inPoly(G.outers[0], mid[0], mid[1]) && mid[0] > G.bStemR + 3) continue;           // protect the bowls
          var must = v.forced && isl >= 0 && a > isl && !made;                                   // ties a counter to the leaf
          if (!must && roll < 0.35) continue;
          var e2 = Math.min(n - 1, b + 3);
          if (!must && roll > 0.72 && b - a >= 3) e2 = a + Math.round((b - a) * stopAt);         // a finger that stops short
          var s2 = Math.max(0, a - 3);
          if (e2 - s2 < 2) continue;
          tissue.push({ pts: p.slice(s2, e2 + 1), r: u(2.5, 3.3), forced: must });
          if (must) made++;
        }
      });
      var edgeSpot = function (rings) {
        var ring = rings[Math.floor(R() * rings.length)], k0 = Math.floor(R() * ring.length);
        var e0 = ring[(k0 + ring.length - 1) % ring.length], e1 = ring[(k0 + 1) % ring.length], pe = ring[k0];
        var ex = e1[0] - e0[0], ey = e1[1] - e0[1], el = Math.hypot(ex, ey) || 1, nx2 = -ey / el, ny2 = ex / el;
        if (!inWhite(pe[0] + nx2 * 2.5, pe[1] + ny2 * 2.5)) { nx2 = -nx2; ny2 = -ny2; }
        return { p: pe, n: [nx2, ny2], ok: inWhite(pe[0] + nx2 * 2.5, pe[1] + ny2 * 2.5) };
      };
      var nl = 1 + Math.floor(R() * 3), nbay = Math.round((1 + Math.floor(R() * 3)) * Math.min(1, loose * 1.6)), bi, e, rr;
      for (bi = 0; bi < nl; bi++) {                          // lobes: rounded swellings of tissue on a letter edge
        e = edgeSpot(allEdges); rr = u(4.2, 6.6);
        if (e.ok) tissue.push({ pts: [[e.p[0] - e.n[0] * rr * 0.3, e.p[1] - e.n[1] * rr * 0.3]], r: rr, forced: false });
      }
      for (bi = 0; bi < nbay; bi++) {                        // bays: the whitespace swells outward
        e = edgeSpot(G.outers); rr = u(4, 6);
        if (e.ok) bays.push({ c: [e.p[0] - e.n[0] * rr * 0.25, e.p[1] - e.n[1] * rr * 0.25], r: rr });
      }
      var sl = softLetters(G, limit > 0 ? tissue : [], bays, limit, wob, passes);
      out.letters = sl.d; out.interrupt = sl.interrupt;
    }
    return out;
  }

  // ------------------------------------------------------------ Madagascar lace-leaf
  function lace(seed, opts) {
    opts = opts || {};
    var level = opts.level == null ? 2 : opts.level;
    var limit = opts.interrupt == null ? 0.18 : opts.interrupt;
    var loose = opts.loose == null ? 0.6 : opts.loose;
    var R = rng(seed * 104729 + 7), u = function (a, b) { return lerp(a, b, R()); };
    var W = 500, Hh = 250, x0 = 20, Lx = 460, cy = 125, i, j;
    var bend = u(-15, 15), bend2 = u(-7, 7), Wm = 97 + u(-4, 5), e = u(0.9, 1.04), pw = u(0.44, 0.54);
    // the two margins are not mirror images: each has its own width and its own slow wave
    var mw = [[u(0.02, 0.05) * (0.4 + loose), u(1.6, 3.6), u(0, 6.28), u(0.93, 1.05)],
              [u(0.02, 0.05) * (0.4 + loose), u(1.6, 3.6), u(0, 6.28), u(0.93, 1.05)]];
    function C(t) { return [x0 + Lx * t, cy + bend * (Math.sin(Math.PI * t) - 0.64) + bend2 * Math.sin(2 * Math.PI * t)]; }
    function wd(t, side) {
      var m = mw[side < 0 ? 0 : 1], tc = Math.max(0, Math.min(1, t));
      return Wm * m[3] * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(tc, e))), pw) * (1 + m[0] * Math.sin(6.283 * m[1] * tc + m[2]) * Math.sin(Math.PI * tc));
    }
    function P(t, v) {
      var a = C(t - 0.004), b = C(t + 0.004), tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty);
      var c = C(t), w = wd(t, v) * v;
      return [c[0] - ty / l * w, c[1] + tx / l * w];
    }
    var o = [];
    for (i = 0; i <= 90; i++) o.push(P(i / 90, -1));
    for (i = 89; i >= 1; i--) o.push(P(i / 90, 1));
    var b0 = C(0.03), b1 = C(0), sP = [], sR = [], sLen = u(20, 34), sY = u(-9, 9), sW = u(2.6, 3.4);
    for (i = 0; i <= 8; i++) { var tS = i / 8; sP.push([lerp(b0[0], x0 - sLen, tS), lerp(b0[1], b1[1] + sY * tS * tS, tS)]); sR.push(sW * lerp(0.92, 1.12, tS)); }

    // 1. whitespace first: the same B and A as the Monstera, bent along this leaf
    var G0 = glyphs(0, 0, 136, 1), gxc = (G0.x0 + G0.x1) / 2, vh = 0.66, pxu = vh * Wm / 68, uc = 0.5 + u(-0.015, 0.015);
    function wp(p) { return P(uc + (p[0] - gxc) * pxu / Lx, (p[1] - 68) / 68 * vh); }
    function dens(pts) {
      var out = [];
      for (var k = 0; k < pts.length; k++) {
        var a = pts[k], b = pts[(k + 1) % pts.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 9));
        for (var q = 0; q < n; q++) out.push([lerp(a[0], b[0], q / n), lerp(a[1], b[1], q / n)]);
      }
      return out;
    }
    var GL = { outers: G0.outers.map(function (g) { return dens(g).map(wp); }), islands: G0.islands.map(function (g) { return dens(g).map(wp); }),
               hulls: G0.hulls.map(function (g) { return dens(g).map(wp); }), x0: 1e9, x1: -1e9, ytop: 1e9, yb: -1e9 };
    GL.outers.forEach(function (g) { g.forEach(function (p) { GL.x0 = Math.min(GL.x0, p[0]); GL.x1 = Math.max(GL.x1, p[0]); GL.ytop = Math.min(GL.ytop, p[1]); GL.yb = Math.max(GL.yb, p[1]); }); });
    var uL = uc + (G0.x0 - gxc) * pxu / Lx, uR = uc + (G0.x1 - gxc) * pxu / Lx;
    var wob = [u(0.7, 1.5) * loose, u(0.05, 0.085), u(0, 6.28), u(0.05, 0.085), u(0, 6.28)], passes = 1 + Math.round(2 * loose);
    var out = { vb: [-30, 0, W + 30, Hh], leaf: pathOf(o), cuts: '', letters: '', islands: '', veins: '',
                stem: pathOf(ribbon(sP, sR, false, true)), interrupt: 0, cutList: [], origin: C(0) };
    if (level < 2) { out.letters = softLetters(GL, [], [], 0, wob, passes).d; return out; }

    // 2. lattice: a heavy midrib, a varying number of long veins each side that wander a little, and
    //    cross veins spaced independently in every band. Every vein has its own weight.
    var vEdge = 0.93;
    function sideEdges() {
      var n = 3 + Math.floor(R() * 3), w = [], s = 0, k;
      for (k = 0; k < n; k++) { w.push(u(0.7, 1.35) * (1 + 0.3 * (n - k) / n)); s += w[k]; }
      var ed = [0], acc = 0;
      for (k = 0; k < n; k++) { acc += w[k]; ed.push(acc / s * vEdge); }
      return ed;
    }
    function thick(k, n) { return lerp(3.0, 1.5, (k - 1) / Math.max(1, n - 1)) * u(0.72, 1.32); }
    var up = sideEdges(), dn = sideEdges(), ve = [], vt = [], vw = [];
    for (i = up.length - 1; i >= 1; i--) { ve.push(-up[i]); vt.push(thick(i, up.length - 1)); }
    ve.push(0); vt.push(u(4.6, 6.6));
    for (i = 1; i < dn.length; i++) { ve.push(dn[i]); vt.push(thick(i, dn.length - 1)); }
    for (j = 0; j < ve.length; j++) vw.push([u(0.008, 0.026) * (ve[j] === 0 ? 0.5 : 1) * (0.4 + loose), u(0.8, 2.4), u(0, 6.28)]);
    function vAt(k, t) { return ve[k] + vw[k][0] * Math.sin(6.283 * vw[k][1] * t + vw[k][2]); }
    function dLetters(p) { return Math.min(dPoly(GL.hulls[0], p[0], p[1]), dPoly(GL.hulls[1], p[0], p[1])); }
    var cells = [], tissue = [], bays = [], cands = [], uS = 0.045, uE = 0.955, pad = 5;
    for (j = 0; j + 1 < ve.length; j++) {
      var side = ve[j] + ve[j + 1], cw = u(14, 26), xs = [uS], ts = [2], sl = [0], x = uS;
      while (true) {
        x += cw * u(0.55, 1.5) / Lx;
        if (x > uE - 0.4 * cw / Lx) break;
        xs.push(x); ts.push(u(1.0, 3.0)); sl.push(u(-0.006, 0.006));
      }
      xs.push(uE); ts.push(2); sl.push(0);
      for (var c = 0; c + 1 < xs.length; c++) {
        var ua = xs[c], ub = xs[c + 1], um = (ua + ub) / 2, wdm = wd(um, side);
        var m = u(0.5, 2.5), closed = R() < 0.04, keep = R() > 0.3, mo = u(-0.004, 0.004);
        if (c > 0 && keep && ua > uL - 0.03 && ua < uR + 0.03) {           // cross veins that may show inside the letters
          var cv = [], v0 = vAt(j, ua), v1 = vAt(j + 1, ua);
          for (var q0 = 0; q0 <= 10; q0++) { var tc0 = q0 / 10; cv.push(P(ua + sl[c] * (2 * tc0 - 1) + mo * Math.sin(Math.PI * tc0), lerp(v0, v1, tc0))); }
          cands.push(cv);
        }
        var va = vAt(j, um), vb = vAt(j + 1, um), phei = (vb - va) * wdm, pwid = (ub - ua) * Lx;
        if (closed || phei < 6.5 || pwid < 6.5) continue;
        var tI = vt[j] / 2 + m, bI = vt[j + 1] / 2 + m, lI = ts[c] / 2 + m, rI = ts[c + 1] / 2 + m;
        if (phei - tI - bI < 2.6 || pwid - lI - rI < 2.6) continue;
        var cen = P(um, (va + vb) / 2);
        if (dLetters(cen) < pad + Math.max(pwid, phei) * 0.34) continue;       // keep a quiet halo round the letters
        var aT = ua - sl[c] + lI / Lx, bT = ub - sl[c + 1] - rI / Lx, bB = ub + sl[c + 1] - rI / Lx, aB = ua + sl[c] + lI / Lx;
        var q = [P(aT, vAt(j, aT) + tI / wdm), P((aT + bT) / 2, vAt(j, um) + tI / wdm), P(bT, vAt(j, bT) + tI / wdm),
                 P(bB, vAt(j + 1, bB) - bI / wdm), P((aB + bB) / 2, vAt(j + 1, um) - bI / wdm), P(aB, vAt(j + 1, aB) - bI / wdm)];
        cells.push({ pts: roundPoly(q, Math.min(pwid - lI - rI, phei - tI - bI) * 0.36), x: cen[0], y: cen[1] });
      }
    }
    out.cutList = cells.map(function (cl) { return { d: pathOf(cl.pts), x: cl.x, y: cl.y }; });
    out.cuts = out.cutList.map(function (cl) { return cl.d; }).join('');
    for (j = 0; j < ve.length; j++) {
      var lp = [];
      for (var t2 = uL - 0.03; t2 <= uR + 0.03; t2 += 0.004) lp.push(P(t2, vAt(j, t2)));
      cands.push(lp);
    }
    var inWhite = function (px, py) {
      if (!(inPoly(GL.outers[0], px, py) || inPoly(GL.outers[1], px, py))) return false;
      return !(inPoly(GL.islands[0], px, py) || inPoly(GL.islands[1], px, py) || inPoly(GL.islands[2], px, py));
    };
    var nbay = Math.round((1 + Math.floor(R() * 3)) * Math.min(1, loose * 1.6));
    for (i = 0; i < nbay; i++) {
      var ring = GL.outers[Math.floor(R() * 2)], k0 = Math.floor(R() * ring.length), rr = u(4, 6);
      var e0 = ring[(k0 + ring.length - 1) % ring.length], e1 = ring[(k0 + 1) % ring.length], pe = ring[k0];
      var ex = e1[0] - e0[0], ey = e1[1] - e0[1], el = Math.hypot(ex, ey) || 1, nx2 = -ey / el, ny2 = ex / el;
      if (!inWhite(pe[0] + nx2 * 2.5, pe[1] + ny2 * 2.5)) { nx2 = -nx2; ny2 = -ny2; }
      if (inWhite(pe[0] + nx2 * 2.5, pe[1] + ny2 * 2.5)) bays.push({ c: [pe[0] - nx2 * rr * 0.25, pe[1] - ny2 * rr * 0.25], r: rr });
    }

    // 3. where a vein truly crosses a letter stroke it may show as a soft strand; veins that would run
    //    along a stroke stay hidden. About half the crossings are kept, a few stop short as fingers.
    var allE = GL.outers.concat(GL.islands);
    var depth = function (px, py) { var d = 1e9; for (var q = 0; q < allE.length; q++) d = Math.min(d, dEdge(allE[q], px, py)); return d; };
    cands.forEach(function (p) {
      var n = p.length, wh = [], dp = [], k, st = -1, runs = [];
      for (k = 0; k < n; k++) {
        var near = p[k][0] > GL.x0 - 6 && p[k][0] < GL.x1 + 6 && p[k][1] > GL.ytop - 6 && p[k][1] < GL.yb + 6, w = near && inWhite(p[k][0], p[k][1]);
        wh.push(w); dp.push(w ? depth(p[k][0], p[k][1]) : 0);
      }
      for (k = 0; k <= n; k++) {
        if (k < n && wh[k]) { if (st < 0) st = k; }
        else if (st >= 0) { runs.push([st, k - 1]); st = -1; }
      }
      runs.forEach(function (rn) {
        var a = rn[0], b = rn[1], md = 0, roll = R(), stopAt = u(0.42, 0.62), rad = u(2.3, 3.1);
        for (k = a; k <= b; k++) md = Math.max(md, dp[k]);
        if (a === 0 || b === n - 1) return;                                      // the crossing must be whole
        if (md < 4.6 || Math.hypot(p[b][0] - p[a][0], p[b][1] - p[a][1]) > 34) return;
        if (roll < 0.45) return;
        var e2 = Math.min(n - 1, b + 2), s2 = Math.max(0, a - 2);
        if (roll > 0.86 && b - a >= 3) e2 = a + Math.round((b - a) * stopAt);
        if (e2 - s2 >= 2) tissue.push({ pts: p.slice(s2, e2 + 1), r: rad, forced: false });
      });
    });
    var sl2 = softLetters(GL, limit > 0 ? tissue : [], bays, limit, wob, passes);
    out.letters = sl2.d; out.interrupt = sl2.interrupt;
    return out;
  }

  // standalone SVG with real transparency (for the site, favicons, exports)
  var uid = 0;
  function svg(parts, o) {
    o = o || {};
    var id = 'ba' + (++uid) + Math.floor(Math.random() * 1e6), vb = parts.vb, col = o.color || '#769656';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb.join(' ') + '"' + (o.size ? ' width="' + o.size + '"' : '') +
      ' role="img" aria-label="' + (o.label || 'BA leaf mark') + '"><mask id="' + id + '">' +
      '<path fill="#fff" d="' + parts.leaf + '"/><path fill="#000" d="' + parts.cuts + parts.letters + '"/>' +
      '<path fill="#fff" d="' + parts.islands + parts.veins + (parts.stem || '') + '"/></mask>' +
      '<rect x="' + vb[0] + '" y="' + vb[1] + '" width="' + vb[2] + '" height="' + vb[3] + '" fill="' + col + '" mask="url(#' + id + ')"/></svg>';
  }
  return { monstera: monstera, lace: lace, svg: svg };
}
