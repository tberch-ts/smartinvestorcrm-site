// The scroll-driven four-act story on the homepage.
//
// 280vh of section pins a 100vh stage; scroll progress p (0 -> 1) drives four
// equal quarter-segments. Everything is written straight to element.style —
// never by rebuilding DOM — because re-rendering mid-scroll resets in-flight
// CSS transitions and drops frames.
(function () {
  var section = document.querySelector('[data-story]');
  if (!section) return;

  var clamp01 = function (n) {
    return Math.max(0, Math.min(1, n));
  };

  /* ── The 14x8 score grid ──────────────────────────────────────────────
     Scores come from an LCG seeded at 7, so the same blocks light in the
     same order on every reload — a grid that reshuffled per visit would
     read as noise rather than as data. */
  var cells = null;
  var badge = null;
  var winner = null;

  function buildGrid() {
    var g = document.querySelector('[data-grid]');
    if (!g || g.childElementCount) return;

    cells = [];
    var total = 14 * 8;
    var seed = 7;
    var rnd = function () {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    for (var i = 0; i < total; i++) {
      var d = document.createElement('div');
      d.className = 'cell';
      // Deliberately not `data-score`: that attribute belongs to act 3's
      // ring text, and the cells sit earlier in the DOM — sharing the name
      // sends the ring's count-up into an invisible grid cell.
      d.dataset.cellScore = String(Math.round(28 + rnd() * 68));
      d.dataset.order = String(rnd());
      g.appendChild(d);
      cells.push(d);
    }

    // Reveal order, not DOM order: the metro fills in scattered, the way a
    // batch job returns.
    cells.sort(function (a, b) {
      return Number(a.dataset.order) - Number(b.dataset.order);
    });

    winner = cells.reduce(function (best, c) {
      return Number(c.dataset.cellScore) > Number(best.dataset.cellScore) ? c : best;
    }, cells[0]);
    // Pin the winner to the score act 3 goes on to underwrite, so the badge
    // and the deal card can never disagree.
    winner.dataset.cellScore = '94';

    badge = document.createElement('div');
    badge.className = 'badge';
    badge.textContent = 'Five Points · 94';
    g.appendChild(badge);
  }

  /* ── Progress ─────────────────────────────────────────────────────────
     Measured from getBoundingClientRect rather than window.scrollY: the page
     may scroll inside a container rather than the window. */
  var scroller;

  function findScroller() {
    if (scroller !== undefined) return scroller;
    var el = section;
    scroller = null;
    while (el && el.parentElement) {
      el = el.parentElement;
      var o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 4) {
        scroller = el;
        break;
      }
    }
    return scroller;
  }

  var acts = section.querySelectorAll('[data-act]');
  var railItems = section.querySelectorAll('[data-rail-item]');
  var bar = section.querySelector('[data-progress]');
  var ring = section.querySelector('[data-ring]');
  var scoreText = section.querySelector('[data-score]');
  var lines = section.querySelectorAll('[data-line]');
  var sig = section.querySelector('[data-sig]');
  var stageRows = section.querySelectorAll('[data-stage-row]');
  var stamp = section.querySelector('[data-stamp]');

  function setNum(key, value) {
    var n = section.querySelector('[data-num="' + key + '"]');
    if (n) n.textContent = value;
  }

  var SEG = 0.25;

  function tick() {
    var sc = findScroller();
    var topRef = sc ? sc.getBoundingClientRect().top : 0;
    var viewH = sc ? sc.clientHeight : window.innerHeight;
    var r = section.getBoundingClientRect();

    // Cheap bail while the section is nowhere near the viewport.
    if (r.bottom < topRef - viewH || r.top > topRef + viewH * 2) return;

    var span = section.offsetHeight - viewH;
    var p = clamp01((topRef - r.top) / (span || 1));
    if (bar) bar.style.width = (p * 100).toFixed(1) + '%';

    var active = Math.min(3, Math.floor(p / SEG));

    for (var i = 0; i < acts.length; i++) {
      var local = clamp01((p - i * SEG) / SEG);
      var opacity = 0;
      var y = 26;
      if (i === active) {
        // Act 1 must never fade in — otherwise the user scrolls through a
        // blank viewport before the section pins.
        var fadeIn = i === 0 ? 1 : Math.min(1, local / 0.09);
        var fadeOut = local > 0.88 && i < 3 ? Math.max(0, 1 - (local - 0.88) / 0.12) : 1;
        opacity = fadeIn * fadeOut;
        y = (1 - fadeIn) * 26 - (1 - fadeOut) * 18;
      }
      acts[i].style.opacity = opacity.toFixed(3);
      acts[i].style.transform = 'translateY(' + y.toFixed(1) + 'px)';
      acts[i].style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
    }

    for (var j = 0; j < railItems.length; j++) {
      railItems[j].style.opacity = j === active ? '1' : '0.3';
    }

    /* Act 2 — cells light over the first 60% of the segment, then the
       highest-scoring block takes a ring and a badge. */
    var l1 = clamp01((p - SEG) / SEG);
    if (cells) {
      var shown = Math.floor(cells.length * Math.min(1, l1 / 0.6));
      for (var k = 0; k < cells.length; k++) {
        var c = cells[k];
        if (k < shown) {
          var t = Math.max(0, (Number(c.dataset.cellScore) - 30) / 65);
          c.style.background = 'color-mix(in srgb, var(--color-accent) ' + Math.round(8 + t * 82) + '%, #292b31)';
          c.style.opacity = String(0.4 + t * 0.6);
        } else {
          c.style.background = '#292b31';
          c.style.opacity = '.35';
        }
      }
      if (winner && badge) {
        var on = l1 > 0.68;
        badge.style.opacity = on ? '1' : '0';
        if (on) {
          var gr = badge.parentElement.getBoundingClientRect();
          var wr = winner.getBoundingClientRect();
          badge.style.left = wr.left - gr.left + wr.width / 2 + 'px';
          badge.style.top = wr.top - gr.top + 'px';
          winner.style.boxShadow = '0 0 0 2px var(--color-accent-200)';
        } else {
          winner.style.boxShadow = 'none';
        }
      }
    }

    /* Act 3 — the ring fills and the four metrics count up together. */
    var l2 = clamp01((p - 2 * SEG) / SEG);
    var e2 = Math.min(1, l2 / 0.55);
    if (ring) ring.style.strokeDashoffset = String(327 - 327 * 0.94 * e2);
    if (scoreText) scoreText.textContent = String(Math.round(94 * e2));
    setNum('cap', (6.8 * e2).toFixed(1) + '%');
    setNum('noi', '$' + Math.round(184000 * e2).toLocaleString());
    setNum('dscr', (1.42 * e2).toFixed(2));
    setNum('coc', (11.3 * e2).toFixed(1) + '%');

    /* Act 4 — the LOI wipes in line by line, gets signed, gets stamped. */
    var l3 = clamp01((p - 3 * SEG) / SEG);
    for (var m = 0; m < lines.length; m++) {
      lines[m].style.transform = 'scaleX(' + clamp01((l3 - m * 0.035) / 0.11).toFixed(3) + ')';
    }
    if (sig) sig.style.strokeDashoffset = String(320 - 320 * clamp01((l3 - 0.24) / 0.2));
    for (var n = 0; n < stageRows.length; n++) {
      stageRows[n].style.opacity = l3 > 0.18 + n * 0.07 ? '1' : '0.3';
    }
    if (stamp) {
      var stamped = l3 > 0.5;
      stamp.style.opacity = stamped ? '1' : '0';
      stamp.style.transform = stamped ? 'rotate(-8deg) scale(1)' : 'rotate(-8deg) scale(.7)';
    }
  }

  buildGrid();

  // Scroll events don't bubble but they do capture, so a capture-phase
  // listener on the document catches whichever container is actually
  // scrolling. The rAF loop is the safety net for momentum and for
  // containers that never fire.
  document.addEventListener('scroll', tick, { capture: true, passive: true });
  window.addEventListener('resize', function () {
    scroller = undefined;
    tick();
  });

  (function loop() {
    tick();
    requestAnimationFrame(loop);
  })();
})();
