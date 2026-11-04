/* Carnegie Mellon Web Kit: behaviors for the kit's components. Load it after
   the template's scripts, at the end of <body>. Each behavior hooks onto a
   data-cmu-* attribute and works on markup added later too. */
(function () {
  "use strict";

  // Copy button: <button class="btn" type="button" data-cmu-copy="#id">.
  // Copies the target's text, says "Copied" on the button for two seconds
  // and tells screen readers. Without the clipboard (an http page, an old
  // browser) it selects the text and asks for the keyboard instead. The icon
  // version (button.cmu-copy, named by aria-label and title) shows a check
  // and puts the message in its label and tooltip instead.
  var status;
  function announce(text) {
    if (!status) {
      status = document.createElement("p");
      status.className = "sr-only";
      status.setAttribute("aria-live", "polite");
      document.body.appendChild(status);
    }
    status.textContent = "";
    setTimeout(function () {
      status.textContent = text;
    }, 50);
  }
  function selectText(el) {
    if (el.select) return el.select();
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  function flash(button, label, state) {
    var icon = button.classList.contains("cmu-copy");
    if (!button.hasAttribute("data-cmu-copy-label"))
      button.setAttribute(
        "data-cmu-copy-label",
        icon ? button.getAttribute("aria-label") || "" : button.textContent,
      );
    var original = button.getAttribute("data-cmu-copy-label");
    if (icon) {
      button.setAttribute("data-cmu-copy-state", state);
      button.setAttribute("aria-label", label);
      button.title = label;
    } else {
      button.textContent = label;
    }
    clearTimeout(button.cmuCopyTimer);
    button.cmuCopyTimer = setTimeout(function () {
      if (icon) {
        button.removeAttribute("data-cmu-copy-state");
        button.setAttribute("aria-label", original);
        button.title = original;
      } else {
        button.textContent = original;
      }
    }, 2000);
  }
  document.addEventListener("click", function (e) {
    var button = e.target.closest && e.target.closest("[data-cmu-copy]");
    if (!button) return;
    var target = document.querySelector(button.getAttribute("data-cmu-copy"));
    if (!target) return;
    var text = "value" in target ? target.value : target.textContent;
    var fallback = function () {
      selectText(target);
      var keys = /Mac|iPhone|iPad/.test(navigator.platform) ? "Command-C" : "Control-C";
      flash(button, "Press " + keys, "keys");
      announce("Selected. Press " + keys + " to copy.");
    };
    if (!navigator.clipboard || !window.isSecureContext) return fallback();
    navigator.clipboard.writeText(text).then(function () {
      flash(button, "Copied", "copied");
      announce("Copied.");
    }, fallback);
  });

  // In-page links: the template's script turns href="#id" into
  // javascript:void(0) (keeping the target in data-jump) and scrolls with its
  // own animation, so the address never shows the section and Back doesn't
  // return. Put the real links back once it has run, and add the section to
  // the address as the template scrolls to it.
  function restoreJumps() {
    document.querySelectorAll("a[data-jump]").forEach(function (a) {
      var target = a.getAttribute("data-jump");
      if (target.length > 1 && /^javascript:/.test(a.getAttribute("href")))
        a.setAttribute("href", target);
    });
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(restoreJumps);
    });
  else setTimeout(restoreJumps);
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest("a[data-jump]");
      if (!a || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var target = a.getAttribute("data-jump");
      if (target.length < 2) return;
      e.preventDefault(); // the template does the scrolling
      if (location.hash !== target) history.pushState(null, "", target);
    },
    true,
  );

  // Countdown: <div class="cmu-countdown" data-cmu-countdown="2027-04-08T12:00:00-04:00">
  // with a sentence inside that gives the same moment. Shows days, hours,
  // minutes and seconds on flip cards and stops at zero; screen readers get
  // the sentence instead of the ticking cards. See Countdown in the docs
  // (cms-content.html). Adapted from a CodePen by Shaw
  // (codepen.io/shshaw/pen/vKzoLL, MIT).
  var UNITS = [
    ["Days", 864e5, Infinity],
    ["Hours", 36e5, 24],
    ["Minutes", 6e4, 60],
    ["Seconds", 1e3, 60],
  ];
  function card(unit) {
    var el = document.createElement("div");
    el.className = "cmu-countdown-unit";
    el.innerHTML =
      '<b class="cmu-countdown-card"><b class="cmu-countdown-top"></b>' +
      '<b class="cmu-countdown-bottom"></b><b class="cmu-countdown-back">' +
      '<b class="cmu-countdown-bottom"></b></b></b>' +
      '<span class="cmu-countdown-label">' +
      unit +
      "</span>";
    return el;
  }
  function flip(el, value) {
    if (el.cmuValue === value) return;
    var top = el.querySelector(".cmu-countdown-top");
    var bottom = el.querySelector(".cmu-countdown-bottom");
    var back = el.querySelector(".cmu-countdown-back");
    // The bottom half shows the old value until the new one flips down over
    // it; the first time there's no old value, so it starts with the new one
    var old = el.cmuValue === undefined ? value : el.cmuValue;
    back.setAttribute("data-value", old);
    bottom.setAttribute("data-value", old);
    el.cmuValue = value;
    top.textContent = value;
    back.querySelector(".cmu-countdown-bottom").setAttribute("data-value", value);
    el.classList.remove("cmu-countdown-flip");
    void el.offsetWidth; // restart the animation
    el.classList.add("cmu-countdown-flip");
    // Once the flip is done, the front catches up, so a narrower old value
    // (02 before 155) doesn't show at the edge
    clearTimeout(el.cmuSync);
    el.cmuSync = setTimeout(function () {
      back.setAttribute("data-value", value);
      bottom.setAttribute("data-value", value);
    }, 650);
  }
  function countdown(root) {
    var end = new Date(root.getAttribute("data-cmu-countdown"));
    if (isNaN(end)) return;
    clearInterval(root.cmuCountdown);
    var clock = root.querySelector(".cmu-countdown-clock");
    if (!clock) {
      clock = document.createElement("div");
      clock.className = "cmu-countdown-clock";
      clock.setAttribute("aria-hidden", "true");
      UNITS.forEach(function (u) {
        clock.appendChild(card(u[0]));
      });
      root.appendChild(clock);
      root.classList.add("cmu-countdown-on");
    }
    var units = clock.children;
    function tick() {
      var left = Math.max(end - new Date(), 0);
      UNITS.forEach(function (u, i) {
        var n = Math.floor(left / u[1]);
        if (u[2] !== Infinity) n %= u[2];
        flip(units[i], String(n).padStart(2, "0"));
      });
      if (!left) clearInterval(root.cmuCountdown);
    }
    root.cmuCountdown = setInterval(tick, 1000);
    tick();
  }
  function startCountdowns(scope) {
    if (scope.querySelectorAll) scope.querySelectorAll("[data-cmu-countdown]").forEach(countdown);
    if (scope.matches && scope.matches("[data-cmu-countdown]")) countdown(scope);
  }
  startCountdowns(document);
  // Countdowns added later start, and one whose date changes restarts
  new MutationObserver(function (changes) {
    changes.forEach(function (c) {
      if (c.type === "attributes") countdown(c.target);
      else c.addedNodes.forEach(startCountdowns);
    });
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-cmu-countdown"],
  });
})();
