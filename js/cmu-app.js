/* Carnegie Mellon Web Kilt: behaviors for the kit's components. Load it after
   the template's scripts, at the end of <body>. Each behavior hooks onto a
   data-cmu-* attribute and works on markup added later too. */
(function () {
  "use strict";

  // Copy button: <button class="btn" type="button" data-cmu-copy="#id">.
  // Copies the target's text, says "Copied" on the button for two seconds
  // and tells screen readers. Without the clipboard (an http page, an old
  // browser) it selects the text and asks for the keyboard instead. The icon
  // version (button.cmu-copy, named by aria-label and title) shows a check
  // and puts the message in its label and tooltip instead. A text button's
  // words change in place, in the text it already has, so a framework that
  // renders the label keeps its hold on it.
  var status;
  function announce(text) {
    // When the page's body was replaced (as Turbo does), use the one in the
    // new body, which a cached page brings back, or add one
    if (!status || !status.isConnected) {
      status = document.querySelector("[data-cmu-announce]");
      if (!status) {
        status = document.createElement("p");
        status.className = "sr-only";
        status.setAttribute("aria-live", "polite");
        status.setAttribute("data-cmu-announce", "");
        document.body.appendChild(status);
      }
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
  // The button's own words: its first text that isn't just space
  function buttonText(button) {
    var walk = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) if (walk.currentNode.nodeValue.trim()) return walk.currentNode;
    return button.appendChild(document.createTextNode(""));
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
      var words = buttonText(button);
      if (!button.cmuCopyWords) button.cmuCopyWords = { node: words, original: words.nodeValue };
      words.nodeValue = label;
      button.cmuCopyWords.shown = label;
    }
    clearTimeout(button.cmuCopyTimer);
    button.cmuCopyTimer = setTimeout(function () {
      if (icon) {
        button.removeAttribute("data-cmu-copy-state");
        button.setAttribute("aria-label", original);
        button.title = original;
      } else {
        var w = button.cmuCopyWords;
        // Put the words back, unless the page changed them meanwhile
        if (w.node.nodeValue === w.shown) w.node.nodeValue = w.original;
        button.cmuCopyWords = null;
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
  // Download buttons (a link styled as a btn, with download, or any link with
  // data-cmu-download, such as a CMS's own button block): say "Downloaded"
  // for two seconds, the way Copy says "Copied", and tell screen readers
  // which file
  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("a.btn[download], a[data-cmu-download]");
    if (!link || !link.getAttribute("href")) return;
    flash(link, "Downloaded", "copied");
    announce(
      "Downloaded " +
        (link.getAttribute("download") ||
          link.getAttribute("data-cmu-download") ||
          decodeURIComponent((link.pathname || "").split("/").pop()) ||
          "the file") +
        ".",
    );
  });

  // Escape and the menu: the template's Escape listener calls the menu's
  // toggle without the argument that makes it act, so Escape never closes
  // the menu. Close it here, with the menu's button as the template does (so
  // its label and aria-pressed follow), and stop the template's listeners:
  // the template's script adds one each time it runs, and Turbo runs it on
  // every page it shows, so if CMU fixes theirs they'd toggle the menu more
  // than once. With the menu closed, Escape reaches the page as usual. Added
  // once, even if this script runs again.
  if (!document.cmuMenuEscape) {
    document.cmuMenuEscape = true;
    document.addEventListener(
      "keyup",
      function (e) {
        if ((e.key !== "Escape" && e.code !== "Escape") || !document.body) return;
        // An Escape that closed a chat's panel leaves the menu as it is
        if (document.cmuChatEscape) {
          document.cmuChatEscape = false;
          return;
        }
        if (!document.body.classList.contains("menu-on")) return;
        e.stopImmediatePropagation();
        var button =
          document.querySelector(".roof .menu-btn") || document.querySelector(".menu-btn");
        if (button) button.click();
      },
      true,
    );
  }

  // Menu closed on load: <body data-cmu-menu="closed">. On a screen wider
  // than 960 pixels, the template opens its menu by itself when the page is
  // in a submenu, is a tab with a submenu or is a menu-only item. With this
  // attribute, the menu starts closed. The template's opening is made
  // instant (shouldAnimateMenu), and when it opens the menu before the user
  // has clicked or pressed a key, the menu's button closes it in the same
  // frame, so its label and aria-pressed follow, and focus leaves the hidden
  // menu for the top of the page. Turbo runs the template again on each page
  // it shows, loading its script after the page appears, so the watch starts
  // again with each page.
  function menuClosed(body) {
    return !!body && body.getAttribute("data-cmu-menu") === "closed";
  }
  function instantMenu() {
    try {
      sessionStorage.setItem("shouldAnimateMenu", "false");
    } catch {
      // Storage blocked: the menu slides in, then closes
    }
  }
  var menuWatch;
  function stopMenuWatch() {
    if (menuWatch) menuWatch.disconnect();
    menuWatch = null;
  }
  // The template measures the open menu before the watch sees it, so closing
  // would slide it shut; cmu-menu-still turns transitions off until two
  // frames after
  function closeMenu() {
    stopMenuWatch();
    var root = document.documentElement;
    var button = document.querySelector(".roof .menu-btn") || document.querySelector(".menu-btn");
    root.classList.add("cmu-menu-still");
    if (button) button.click();
    void root.offsetWidth;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.remove("cmu-menu-still");
      });
    });
    var focused = document.activeElement;
    if (focused && focused.closest && focused.closest("nav.tree")) {
      var body = document.body;
      body.setAttribute("tabindex", "-1");
      body.focus({ preventScroll: true });
      body.blur();
      body.removeAttribute("tabindex");
    }
  }
  function watchMenu() {
    stopMenuWatch();
    var body = document.body;
    if (!menuClosed(body) || !window.MutationObserver) return;
    instantMenu();
    if (body.classList.contains("menu-on")) {
      closeMenu();
      return;
    }
    menuWatch = new MutationObserver(function () {
      if (body.classList.contains("menu-on")) closeMenu();
    });
    menuWatch.observe(body, { attributes: true, attributeFilter: ["class"] });
  }
  // A menu the user opens stays open
  ["pointerdown", "keydown"].forEach(function (type) {
    document.addEventListener(type, stopMenuWatch, true);
  });
  // Loaded in <head>, before the body exists: start once it does
  if (document.body) watchMenu();
  else document.addEventListener("DOMContentLoaded", watchMenu);
  document.addEventListener("turbo:before-render", function (e) {
    if (e.detail && menuClosed(e.detail.newBody)) instantMenu();
  });
  document.addEventListener("turbo:render", watchMenu);

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
      if (location.hash !== target) {
        history.pushState(null, "", target);
        // pushState doesn't announce a new hash; tell the page, so a link
        // into a tab panel opens it before the template scrolls there
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
    },
    true,
  );

  // Enlarge on click: <a href="big.jpg" data-cmu-zoom><img alt="..."></a> opens
  // the image over the page, with the page dimmed behind it; Escape, the close
  // button or a click anywhere closes it, and focus goes back to the link. An
  // image much taller than the window opens at full width and scrolls. A
  // link with words instead of a picture names the image with aria-label.
  // Without the script (or a browser without <dialog>), the link opens the image.
  // See Enlarge on Click in the docs (content.html).
  var zoom, zoomOpener, zoomByPointer;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-cmu-zoom]");
    if (!a || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!window.HTMLDialogElement) return;
    e.preventDefault();
    if (!zoom || !zoom.isConnected) {
      zoom = document.createElement("dialog");
      zoom.className = "cmu-zoom";
      zoom.innerHTML =
        '<button type="button" class="cmu-zoom-close" aria-label="Close">&times;</button>' +
        '<div class="cmu-zoom-frame"><img alt=""></div>';
      zoom.addEventListener("click", function (ev) {
        // A click or tap, not Enter on the close button
        zoomByPointer = ev.detail > 0;
        zoom.close();
      });
      // Focus goes back to the link. Closed with the mouse, it goes back
      // without a focus ring (Firefox would draw one); with the keyboard, the
      // ring stays to show where focus is
      zoom.addEventListener("close", function () {
        if (zoomByPointer && zoomOpener && zoomOpener.isConnected) {
          zoomOpener.blur();
          zoomOpener.focus({ preventScroll: true, focusVisible: false });
        }
        zoomByPointer = false;
      });
      document.body.appendChild(zoom);
    }
    zoomOpener = a;
    var small = a.querySelector("img"),
      big = zoom.querySelector("img"),
      frame = zoom.querySelector(".cmu-zoom-frame");
    // Tall: at the widest it can show, the image is over a quarter taller
    // than the window, so fitting it whole would shrink it too far
    function fit() {
      var w = Math.min(big.naturalWidth, window.innerWidth * 0.92, 1400),
        tall =
          big.naturalWidth > 0 &&
          (big.naturalHeight * w) / big.naturalWidth > window.innerHeight * 0.92 * 1.25;
      zoom.classList.toggle("cmu-zoom--tall", tall);
      if (tall) frame.tabIndex = 0;
      else frame.removeAttribute("tabindex");
      frame.scrollTop = 0;
    }
    big.onload = fit;
    big.src = a.href;
    big.alt = small ? small.alt : a.getAttribute("aria-label") || "";
    if (big.complete) fit();
    zoom.showModal();
  });

  // Code blocks (pre.cmu-snippet): one block per line, so a long line wraps
  // with its continuation hanging four characters in from its own indent
  // instead of back at the left edge. The newlines between lines stay, so
  // copying gives the code as written. A block whose text a page sets later
  // is split again; one with markup inside (links, highlighting) is left as
  // it is. See Code Block in the docs (content.html).
  function hangLines(code) {
    if (code.querySelector(".cmu-line")) return;
    for (var n = code.firstChild; n; n = n.nextSibling) if (n.nodeType !== 3) return;
    var text = code.textContent;
    if (text.indexOf("\n") < 0 && text.length < 60) return;
    code.textContent = "";
    text.split("\n").forEach(function (l, i) {
      if (i) code.appendChild(document.createTextNode("\n"));
      var line = document.createElement("div"),
        hang = l.match(/^ */)[0].length + 4 + "ch";
      line.className = "cmu-line";
      // The line keeps its leading spaces (they're copied with it), so its
      // first row is pulled back by the whole padding
      line.style.paddingLeft = hang;
      line.style.textIndent = "-" + hang;
      line.textContent = l;
      code.appendChild(line);
    });
  }
  function hangAll() {
    document.querySelectorAll("pre.cmu-snippet > code").forEach(hangLines);
  }
  hangAll();
  if (window.MutationObserver) {
    var hangQueued = false;
    new MutationObserver(function () {
      if (hangQueued) return;
      hangQueued = true;
      requestAnimationFrame(function () {
        hangQueued = false;
        hangAll();
      });
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  // Closable section: <div class="... cmu-closable"> with a
  // <button class="cmu-close" aria-label="Close ..." title="Close ..."> inside.
  // The button hides the section and sends a cmu-close event from it (call
  // preventDefault() on the event to keep it). With data-cmu-closable="name"
  // it stays closed in this browser: a cookie, cmu-closed-name, for a year
  // (not localStorage, which the template's script clears). Focus moves to what comes next. See
  // Closable Section in the docs (sections.html).
  function closedCookie(name) {
    return "cmu-closed-" + name.replace(/[^A-Za-z0-9_-]/g, "");
  }
  document.querySelectorAll(".cmu-closable[data-cmu-closable]").forEach(function (box) {
    if (document.cookie.split("; ").indexOf(closedCookie(box.dataset.cmuClosable) + "=1") >= 0)
      box.hidden = true;
  });
  document.addEventListener("click", function (e) {
    var button = e.target.closest(".cmu-closable .cmu-close");
    if (!button) return;
    var box = button.closest(".cmu-closable");
    var go = box.dispatchEvent(new CustomEvent("cmu-close", { bubbles: true, cancelable: true }));
    if (!go) return;
    box.hidden = true;
    if (box.dataset.cmuClosable)
      document.cookie =
        closedCookie(box.dataset.cmuClosable) +
        "=1; path=/; max-age=31536000; SameSite=Lax" +
        (location.protocol === "https:" ? "; Secure" : "");
    // What comes next: a sibling, or the next thing after an ancestor
    var next = null;
    for (var at = box; at && !next; at = at.parentElement) {
      next = at.nextElementSibling;
      while (next && next.hidden) next = next.nextElementSibling;
    }
    if (next) {
      if (!next.hasAttribute("tabindex")) next.setAttribute("tabindex", "-1");
      next.focus({ preventScroll: true });
    }
  });

  // Countdown: <div class="cmu-countdown" data-cmu-countdown="2027-04-08T12:00:00-04:00">
  // with a sentence inside that gives the same moment. Shows days, hours,
  // minutes and seconds on flip cards and stops at zero; screen readers get
  // the sentence instead of the ticking cards. An optional
  // <div class="cmu-countdown-done" hidden> inside shows once it reaches zero,
  // when the countdown also gets cmu-countdown-ended; with
  // cmu-countdown--replace, the cards then go. See Countdown in the docs
  // (content.html). Adapted from a CodePen by Shaw
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
      // Before the done message, if there is one, so it shows under the cards
      root.insertBefore(clock, root.querySelector(":scope > .cmu-countdown-done"));
      root.classList.add("cmu-countdown-on");
    }
    var units = clock.children,
      done = root.querySelector(":scope > .cmu-countdown-done");
    function tick() {
      var left = Math.max(end - new Date(), 0);
      UNITS.forEach(function (u, i) {
        var n = Math.floor(left / u[1]);
        if (u[2] !== Infinity) n %= u[2];
        flip(units[i], String(n).padStart(2, "0"));
      });
      if (done) done.hidden = left > 0;
      root.classList.toggle("cmu-countdown-ended", !left);
      if (!left) clearInterval(root.cmuCountdown);
    }
    root.cmuCountdown = setInterval(tick, 1000);
    tick();
  }
  function startCountdowns(scope) {
    if (scope.querySelectorAll) scope.querySelectorAll("[data-cmu-countdown]").forEach(countdown);
    if (scope.matches && scope.matches("[data-cmu-countdown]")) countdown(scope);
  }
  // Email links: <a data-cmu-email="ac00(through)andrew.cmu.edu">Email Andrew
  // Carnegie</a>. The address isn't in the page's HTML, and the link isn't
  // built until someone points at it, focuses it or taps it, so scrapers that
  // only read or load the page don't find it. Until then it's announced and
  // focusable as a link. The link keeps its own words. See Email Links in the
  // docs (content.html).
  function emailReady(a) {
    if (a.hasAttribute("href")) return;
    a.setAttribute("role", "link");
    a.tabIndex = 0;
  }
  function emailOpen(a) {
    if (a.hasAttribute("href")) return;
    a.href = "mailto:" + a.getAttribute("data-cmu-email").replace("(through)", "@");
    a.removeAttribute("role");
    a.removeAttribute("tabindex");
  }
  function startEmails(scope) {
    if (scope.querySelectorAll) scope.querySelectorAll("a[data-cmu-email]").forEach(emailReady);
    if (scope.matches && scope.matches("a[data-cmu-email]")) emailReady(scope);
  }
  startEmails(document);
  // Initials in place of a profile picture: data-cmu-name holds the
  // person's name, and the first letters of its first and last words fill
  // the circle ("Andrew Carnegie" is AC, "Henry Clay Frick" is HF, "Scotty"
  // is S). "Carnegie, Andrew" is read first name first, and a suffix such as
  // Jr. or III doesn't count as the last word.
  function initialsOf(name) {
    var suffix = /^(jr|sr|ii|iii|iv|v)\.?$/i;
    var parts = String(name || "")
      .split(",")
      .map(function (p) {
        return p.trim();
      })
      .filter(Boolean);
    // A suffix after a comma goes ("Henry Posner, III"), then "Last, First" flips
    while (parts.length > 1 && suffix.test(parts[parts.length - 1])) parts.pop();
    name = parts.length === 2 ? parts[1] + " " + parts[0] : parts.join(" ");
    var words = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    while (words.length > 1 && /^(jr|sr|ii|iii|iv|v)\.?$/i.test(words[words.length - 1]))
      words.pop();
    if (!words.length) return "";
    var first = Array.from(words[0])[0];
    var last = words.length > 1 ? Array.from(words[words.length - 1])[0] : "";
    return (first + last).toUpperCase();
  }
  // data-cmu-initials, letters worked out elsewhere, wins over data-cmu-name
  function initials(el) {
    var given = (el.getAttribute("data-cmu-initials") || "").trim();
    var letters = given || initialsOf(el.getAttribute("data-cmu-name"));
    if (letters) el.textContent = letters;
  }
  var INITIALS = "[data-cmu-name], [data-cmu-initials]";
  function startInitials(scope) {
    if (scope.querySelectorAll) scope.querySelectorAll(INITIALS).forEach(initials);
    if (scope.matches && scope.matches(INITIALS)) initials(scope);
  }
  startInitials(document);
  ["mouseover", "focusin", "pointerdown", "touchstart"].forEach(function (type) {
    document.addEventListener(
      type,
      function (e) {
        var a = e.target.closest && e.target.closest("a[data-cmu-email]");
        if (a) emailOpen(a);
      },
      { passive: true },
    );
  });
  // Enter on the focused link: build it (if focus didn't already) and follow it
  document.addEventListener("keydown", function (e) {
    var a = e.key === "Enter" && e.target.closest && e.target.closest("a[data-cmu-email]");
    if (a && !a.hasAttribute("href")) {
      emailOpen(a);
      a.click();
    }
  });

  // Sorting: <ol class="cmu-sort" data-cmu-sort> whose items people put in
  // order. Adds up and down arrow buttons to each item (named for the item, for
  // screen readers), keeps focus on the moved item and says where it went. A
  // hidden input in each item moves with it, so a form sends the new order.
  // Without the script the list keeps its first order. See Sorting in the
  // docs (forms.html).
  //
  // A page restored from a cache (Turbo) already has the kit's buttons, and
  // gets no second set.
  //
  // In a framework (React, Svelte, Vue), which owns the list: render the
  // buttons yourself (<button data-cmu-move="-1"> and "1" in each item), and
  // the script adds none and leaves their disabled state to you. Each move
  // first fires a cancelable cmu-sort-move event on the list, with detail
  // { item, from, to } (0-based). Call preventDefault(), reorder your own
  // data and let the framework re-render; the script then doesn't move
  // anything, but still announces the new place and keeps focus on the
  // button.
  function sortItems(list) {
    return Array.prototype.filter.call(list.children, function (el) {
      return el.tagName === "LI";
    });
  }
  // The item's words, without its buttons'
  function sortName(li) {
    var out = "",
      walk = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
    while (walk.nextNode())
      if (!walk.currentNode.parentElement.closest("[data-cmu-move]"))
        out += walk.currentNode.nodeValue;
    return out.trim().replace(/\s+/g, " ");
  }
  function sortable(list) {
    if (list.cmuSort) return;
    list.cmuSort = true;
    sortItems(list).forEach(function (li) {
      // The page brought its own buttons
      if (li.querySelector("[data-cmu-move]")) return;
      var name = sortName(li),
        moves = document.createElement("span");
      moves.className = "cmu-sort-moves";
      // Arrows, like the sortable table headers; the label names the item
      [
        ["-1", "up", "\u25B2"],
        ["1", "down", "\u25BC"],
      ].forEach(function (m) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn ghost small";
        b.setAttribute("data-cmu-move", m[0]);
        b.setAttribute("aria-label", "Move " + name + " " + m[1]);
        b.title = "Move " + m[1];
        b.textContent = m[2];
        // An attribute, not a property, so a cached copy of the page (Turbo)
        // still marks these as the kit's
        b.setAttribute("data-cmu-kit", "");
        moves.appendChild(b);
      });
      li.appendChild(moves);
    });
    sortEnds(list);
  }
  // The first item can't go up, and the last can't go down (only the
  // buttons the script added; the page sets its own)
  function sortEnds(list) {
    var items = sortItems(list);
    items.forEach(function (li, i) {
      li.querySelectorAll("[data-cmu-move]").forEach(function (b) {
        if (!b.hasAttribute("data-cmu-kit")) return;
        b.disabled = b.getAttribute("data-cmu-move") === "-1" ? i === 0 : i === items.length - 1;
      });
    });
  }
  function startSorts(scope) {
    if (scope.querySelectorAll) scope.querySelectorAll("[data-cmu-sort]").forEach(sortable);
    if (scope.matches && scope.matches("[data-cmu-sort]")) sortable(scope);
  }
  startSorts(document);
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-cmu-sort] [data-cmu-move]");
    if (!b || b.disabled) return;
    var li = b.closest("li"),
      list = li.parentElement,
      items = sortItems(list),
      dir = Number(b.getAttribute("data-cmu-move")),
      from = items.indexOf(li),
      to = from + dir;
    if (to < 0 || to >= items.length) return;
    var name = sortName(li),
      move = new CustomEvent("cmu-sort-move", {
        bubbles: true,
        cancelable: true,
        detail: { item: li, from: from, to: to },
      });
    if (list.dispatchEvent(move)) {
      var other = items[to];
      list.insertBefore(dir < 0 ? li : other, dir < 0 ? other : li);
      sortEnds(list);
      // At the top or bottom now, focus the other button
      (b.disabled ? li.querySelector('[data-cmu-move="' + -dir + '"]') : b).focus();
    } else {
      // The page moves it. Once it has re-rendered, keep focus on the moved
      // item's button (the other one if this one is now disabled), even if
      // the page rebuilt the list. Frameworks re-render on their own
      // schedule, so check a few times; focus only comes back if it was lost
      // (on the page itself, or on a now-disabled button), never taken from
      // where someone moved it.
      var keep = function () {
        var item = b.isConnected ? li : sortItems(list)[to];
        if (!item) return;
        var now = document.activeElement,
          lost = !now || now === document.body || now === b || (now.disabled && list.contains(now));
        if (!lost && now !== b) return;
        var same = b.isConnected ? b : item.querySelector('[data-cmu-move="' + dir + '"]'),
          stay =
            same && !same.disabled ? same : item.querySelector('[data-cmu-move="' + -dir + '"]');
        if (stay && now !== stay) stay.focus();
      };
      requestAnimationFrame(keep);
      [50, 150, 300].forEach(function (ms) {
        setTimeout(keep, ms);
      });
    }
    announce(name + ", " + (to + 1) + " of " + items.length);
  });

  // Row menu: <div class="cmu-row-menu"> holds a <button class="btn small
  // ghost" data-cmu-menu aria-controls="list-id" aria-expanded="false"
  // aria-label="More actions for ..."> and the list, <div
  // class="cmu-row-menu-list" id="list-id" hidden>, of the row's other
  // actions. The button opens the list under it, one at a time; a click
  // elsewhere or Escape closes it. See Tables With Actions in the docs
  // (lists.html).
  function closeMenus(except) {
    document.querySelectorAll('[data-cmu-menu][aria-expanded="true"]').forEach(function (b) {
      if (b === except) return;
      b.setAttribute("aria-expanded", "false");
      var list = document.getElementById(b.getAttribute("aria-controls"));
      if (list) list.hidden = true;
    });
  }
  document.addEventListener("click", function (e) {
    var toggle = e.target.closest && e.target.closest("[data-cmu-menu]");
    if (toggle) {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      closeMenus(toggle);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      var list = document.getElementById(toggle.getAttribute("aria-controls"));
      if (list) list.hidden = !open;
      return;
    }
    if (!(e.target.closest && e.target.closest(".cmu-row-menu-list"))) closeMenus();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = document.querySelector('[data-cmu-menu][aria-expanded="true"]');
    if (open) {
      closeMenus();
      open.focus();
    }
  });

  // Options after a menu: a <select data-cmu-options>, then, after it in the
  // same parent, a block for each value with further controls, <div
  // data-cmu-option="value">, or several values, "link upload", for a block
  // more than one choice shares. Only the picked value's blocks show; a
  // value with none shows nothing, and a rule (<hr>) right after the menu goes
  // too. Without the script, every block shows. See Options Under a Choice in
  // the docs (forms.html).
  function showOptions(select) {
    var any = false;
    for (var el = select.nextElementSibling; el; el = el.nextElementSibling)
      if (el.hasAttribute("data-cmu-option")) {
        el.hidden = el.getAttribute("data-cmu-option").split(/\s+/).indexOf(select.value) < 0;
        any = any || !el.hidden;
      }
    var rule = select.nextElementSibling;
    if (rule && rule.tagName === "HR") rule.hidden = !any;
  }
  document.querySelectorAll("select[data-cmu-options]").forEach(showOptions);
  document.addEventListener("change", function (e) {
    if (e.target.matches && e.target.matches("select[data-cmu-options]")) showOptions(e.target);
  });

  // Long code block (cmu-peek): folding it back rolls the code up into its
  // toggle, which stays where it is on screen, so the reader isn't left far
  // down the page by the lines that went away. Without the script, or with
  // reduced motion, it folds at once.
  document.addEventListener("click", function (e) {
    var summary = e.target.closest && e.target.closest(".cmu-peek > .cmu-more > summary");
    if (!summary || !summary.parentNode.open) return;
    var more = summary.parentNode,
      pre = more.parentNode.querySelector("pre");
    if (!pre) return;
    e.preventDefault();
    var top = summary.getBoundingClientRect().top,
      from = pre.offsetHeight;
    more.open = false;
    var to = pre.offsetHeight;
    var hold = function () {
      window.scrollBy({ top: summary.getBoundingClientRect().top - top, behavior: "instant" });
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || from <= to) {
      hold();
      return;
    }
    var start = null,
      time = Math.min(450, 200 + (from - to) / 10);
    pre.style.maxHeight = from + "px";
    hold();
    requestAnimationFrame(function step(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / time),
        ease = 1 - Math.pow(1 - t, 3);
      pre.style.maxHeight = from + (to - from) * ease + "px";
      hold();
      if (t < 1) requestAnimationFrame(step);
      else {
        pre.style.maxHeight = "";
        hold();
      }
    });
  });

  // ID tap: <div class="cmu-tap-target"> holds a label and a hidden <input
  // data-cmu-tap>, where an NFC card reader types an ID card's number and a
  // carriage return (Enter). When it's the only tap on the page, the field
  // takes focus when the page loads, so the reader is listening without a click;
  // selecting the target focuses it again, and so does sending its form,
  // ready for the next card. With data-cmu-tap="keep",
  // on a page that's only for tapping, it also takes focus whenever nothing
  // else has it. With data-cmu-tap="click", it waits to be selected, for a
  // page where something else should have focus first. See ID Tap in the docs
  // (forms.html).
  function focusTap(field) {
    if (field) field.focus({ preventScroll: true });
  }
  // Nothing has focus, or only the template's menu does, which it takes by
  // itself when it opens on a wide screen
  function idle() {
    var active = document.activeElement;
    return !active || active === document.body || active.id === "nav";
  }
  function keepTap() {
    var field = document.querySelector('[data-cmu-tap="keep"]');
    if (field && idle()) focusTap(field);
  }
  // The only tap on the page starts ready; with several, each waits to be
  // selected, since a reader can only type into one
  function startTap() {
    // A tap in a dialog doesn't count unless the dialog is open as one: it
    // focuses when the dialog opens, through its autofocus
    var fields = Array.prototype.filter.call(
      document.querySelectorAll("[data-cmu-tap]"),
      function (f) {
        var d = f.closest("dialog");
        if (!d) return true;
        try {
          return d.matches(":modal");
        } catch {
          // A browser without :modal: wait for the autofocus
          return false;
        }
      },
    );
    if (fields.length === 1 && fields[0].getAttribute("data-cmu-tap") !== "click" && idle())
      focusTap(fields[0]);
  }
  document.addEventListener("click", function (e) {
    var target = e.target.closest && e.target.closest(".cmu-tap-target");
    if (target) focusTap(target.querySelector("[data-cmu-tap]"));
  });
  document.addEventListener("submit", function (e) {
    var field = e.target.querySelector && e.target.querySelector("[data-cmu-tap]");
    if (field)
      setTimeout(function () {
        focusTap(field);
      }, 0);
  });
  setInterval(keepTap, 2000);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startTap);
  else startTap();
  // Turbo's page visits replace the body without a new page load
  document.addEventListener("turbo:load", startTap);

  // File drop zone / picker: <label class="cmu-drop"> wrapping an <input
  // type="file">, its words and an empty <span class="cmu-drop-file">.
  // Choosing works without the script; with it, a file dragged onto the zone
  // is chosen too, the zone gets cmu-drop-over while one is over it and
  // cmu-drop-has-file once one is chosen, and cmu-drop-file names it. See File
  // Drop Zone / Picker in the docs (forms.html).
  function dropZone(e) {
    return e.target.closest && e.target.closest("label.cmu-drop");
  }
  function showFiles(zone) {
    var input = zone.querySelector('input[type="file"]');
    var shown = zone.querySelector(".cmu-drop-file");
    var names = Array.prototype.map.call(input.files || [], function (f) {
      return f.name;
    });
    zone.classList.toggle("cmu-drop-has-file", names.length > 0);
    if (shown) {
      shown.textContent = names.join(", ");
      shown.title = names.join(", ");
      shown.hidden = false; // an empty line keeps its place, so nothing moves
    }
  }
  ["dragenter", "dragover"].forEach(function (type) {
    document.addEventListener(type, function (e) {
      var zone = dropZone(e);
      if (!zone) return;
      e.preventDefault();
      zone.classList.add("cmu-drop-over");
    });
  });
  document.addEventListener("dragleave", function (e) {
    var zone = dropZone(e);
    if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove("cmu-drop-over");
  });
  document.addEventListener("drop", function (e) {
    var zone = dropZone(e);
    if (!zone) return;
    e.preventDefault();
    zone.classList.remove("cmu-drop-over");
    var input = zone.querySelector('input[type="file"]');
    if (!input || !e.dataTransfer || !e.dataTransfer.files.length) return;
    input.files = e.dataTransfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  document.addEventListener("change", function (e) {
    var zone = dropZone(e);
    if (zone && e.target.type === "file") showFiles(zone);
  });

  // Tab panels: tabs that switch content in place, in the same row and look as
  // the link tabs. <div class="cmu-tabs" role="tablist" aria-label="...">
  // holds <button type="button" role="tab" aria-controls="panel-id"> tabs, and
  // each panel is a <div role="tabpanel" id="panel-id">. Mark the open tab
  // aria-selected="true" (else the first opens) and the other panels hidden.
  // Click or arrow keys switch. With data-cmu-tabs="name" on the row and
  // data-cmu-tab="value" on each tab, every row with that name switches
  // together, and the choice is remembered in this browser across pages. A
  // link to a panel, or to anything in one (page.html#id), opens that panel.
  // Without the script, every panel shows. See Tabs in the docs (layout.html).
  function tabsOf(list) {
    return Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
  }
  function selectTab(tab) {
    tabsOf(tab.closest('[role="tablist"]')).forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
  }
  function pickTabs(name, value) {
    document
      .querySelectorAll('.cmu-tabs[role="tablist"][data-cmu-tabs="' + name + '"]')
      .forEach(function (list) {
        var tabs = tabsOf(list);
        var tab =
          tabs.filter(function (t) {
            return t.getAttribute("data-cmu-tab") === value;
          })[0] || tabs[0];
        if (tab) selectTab(tab);
      });
  }
  // The chosen tab is kept in a cookie, not localStorage: the template's own
  // script clears all of localStorage on every page (for its list filters).
  // For this site only, for a year.
  function storedTab(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )cmu-tabs-" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function storeTab(name, value) {
    document.cookie =
      "cmu-tabs-" +
      name +
      "=" +
      encodeURIComponent(value) +
      "; path=/; max-age=31536000; SameSite=Lax";
  }
  function startTabs(root) {
    if (!root.querySelectorAll) return;
    root.querySelectorAll('.cmu-tabs[role="tablist"]').forEach(function (list) {
      if (list.cmuTabs) return;
      list.cmuTabs = true;
      var tabs = tabsOf(list);
      var name = list.getAttribute("data-cmu-tabs");
      var saved = name && storedTab(name);
      var tab =
        (saved &&
          tabs.filter(function (t) {
            return t.getAttribute("data-cmu-tab") === saved;
          })[0]) ||
        tabs.filter(function (t) {
          return t.getAttribute("aria-selected") === "true";
        })[0] ||
        tabs[0];
      if (tab) selectTab(tab);
    });
  }
  // A link to a panel or to something inside one opens it (and any panels it
  // sits in), and a named row's choice is saved, as if it were clicked. Then
  // the address moves to the top of the outermost row, so it never points
  // into a panel: a reload, Back or a later click can't fight the saved
  // choice. Deferred to the load event, so a page's own scripts can act on
  // the original address first (such as picking an option inside a panel).
  function tabsFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    var target = id && document.getElementById(id);
    // Tab rows a page's script builds (such as code tabs) may not exist yet;
    // look again once the page has loaded
    if (!target && id && document.readyState !== "complete") {
      window.addEventListener("load", tabsFromHash, { once: true });
      return;
    }
    if (!target) return;
    var row = null;
    for (var el = target; el; el = el.parentElement) {
      if (el.getAttribute && el.getAttribute("role") === "tabpanel") {
        var tab = document.querySelector('[role="tab"][aria-controls="' + el.id + '"]');
        var list = tab && tab.closest('[role="tablist"]');
        if (!list) continue;
        var name = list.getAttribute("data-cmu-tabs");
        var value = tab.getAttribute("data-cmu-tab");
        if (name && value) {
          pickTabs(name, value);
          storeTab(name, value);
        } else selectTab(tab);
        row = list;
      }
    }
    if (!row) return;
    var settle = function () {
      if (row.id) history.replaceState(null, "", "#" + row.id);
      row.scrollIntoView();
    };
    if (document.readyState === "complete") setTimeout(settle);
    else window.addEventListener("load", settle, { once: true });
  }
  document.addEventListener("click", function (e) {
    var tab = e.target.closest && e.target.closest('.cmu-tabs[role="tablist"] [role="tab"]');
    if (!tab) return;
    var list = tab.closest('[role="tablist"]');
    var name = list.getAttribute("data-cmu-tabs");
    var value = tab.getAttribute("data-cmu-tab");

    if (!name || !value) return selectTab(tab);
    // Every row with this name switches; keep the clicked one still on screen
    var before = tab.getBoundingClientRect().top;
    pickTabs(name, value);
    storeTab(name, value);
    window.scrollBy(0, tab.getBoundingClientRect().top - before);
  });
  document.addEventListener("keydown", function (e) {
    var list = e.target.closest && e.target.closest('.cmu-tabs[role="tablist"]');
    if (!list || e.target.getAttribute("role") !== "tab") return;
    var tabs = tabsOf(list);
    var i = tabs.indexOf(e.target);
    var to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    var tab = tabs[(to + tabs.length) % tabs.length];
    tab.focus();
    tab.click();
  });

  // Scroll gallery: <div class="cmu-scroll-gallery" data-cmu-scroll-gallery>
  // holds steps, <div class="cmu-scroll-gallery-step">, each with its text and
  // one <figure>. On a wide screen, the text scrolls on the left while a sticky
  // stage on the right shows the figure of the step in the middle of the
  // window, changing as the next step arrives: fading up, or with
  // cmu-scroll-gallery--slide, sliding in from the side in the direction of
  // scrolling. The stage holds copies, hidden from screen readers; the steps
  // keep their own figures, which show in place on a narrow screen or without
  // the script. See Scroll Gallery in the docs (sections.html).
  function startScrollGalleries(root) {
    if (!root.querySelectorAll || !window.IntersectionObserver) return;
    root.querySelectorAll("[data-cmu-scroll-gallery]").forEach(function (gallery) {
      if (gallery.cmuGallery) return;
      gallery.cmuGallery = true;
      // A page restored from a cache (Turbo) has the old stage, which nothing
      // watches; start over
      gallery.querySelectorAll(":scope > .cmu-scroll-gallery-stage").forEach(function (old) {
        old.remove();
      });
      var steps = Array.prototype.slice.call(gallery.querySelectorAll(".cmu-scroll-gallery-step"));
      if (!steps.length) return;
      var stage = document.createElement("div");
      stage.className = "cmu-scroll-gallery-stage";
      stage.setAttribute("aria-hidden", "true");
      stage.style.gridRow = "1 / span " + steps.length;
      var shown = steps.map(function (step) {
        var figure = step.querySelector("figure");
        var copy = figure ? figure.cloneNode(true) : document.createElement("figure");
        copy.querySelectorAll("a, button, [tabindex]").forEach(function (el) {
          el.setAttribute("tabindex", "-1");
        });
        stage.appendChild(copy);
        return copy;
      });
      gallery.appendChild(stage);
      gallery.classList.add("cmu-scroll-gallery--on");
      // Figures before the current one wait on one side and those after it
      // on the other, so each moves the way the page is scrolling
      function show(i) {
        shown.forEach(function (fig, n) {
          fig.classList.toggle("cmu-scroll-gallery-past", n < i);
          fig.classList.toggle("cmu-scroll-gallery-current", n === i);
          fig.classList.toggle("cmu-scroll-gallery-next", n > i);
        });
      }
      show(0);
      // A step is current once it crosses the middle of the window
      var watch = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) show(steps.indexOf(entry.target));
          });
        },
        { rootMargin: "-50% 0px -50% 0px" },
      );
      steps.forEach(function (step) {
        watch.observe(step);
      });
    });
  }

  // Tables: <table class="alternate" data-cmu-table> with options, each
  // optional. See Tables in the docs (lists.html).
  //   Sorting: a header <th data-sort-key="name"> holding <button type="button"
  //     class="cmu-sort">Name<span class="cmu-sort-arrow"></span></button>.
  //     A cell's data-sort-value sorts in place of its text; numbers (with $
  //     and commas) sort as numbers. Click again to reverse.
  //   Filtering: an <input data-cmu-filter="table id"> anywhere matches each
  //     row's text and data-keywords; an <input data-cmu-filter-column="name">
  //     in the table's head matches the cell under <th data-sort-key="name">
  //     (or data-cmu-column="name"). Hidden rows go to the end of the body so
  //     the stripes stay even.
  //   Count: an element with data-cmu-count="table id" (aria-live) says how
  //     many rows show, naming them with data-cmu-noun="person|people".
  //   Address: the search, column filters and sort go in the page's address
  //     (?q=, ?filter[name]=, ?sort=name or ?sort=-name), and come back from
  //     it on load. A value on data-cmu-table namespaces them
  //     (?charges[q]=...) when a page has more than one table.
  //   Server: data-cmu-table-server leaves filtering and sorting to the
  //     server. The fields sit in a GET form, and typing submits it after a
  //     pause; the server reads the same parameters and pages the rows.
  function tableParam(table, name) {
    var ns = table.getAttribute("data-cmu-table");
    if (!ns) return name;
    var i = name.indexOf("[");
    return i < 0 ? ns + "[" + name + "]" : ns + "[" + name.slice(0, i) + "]" + name.slice(i);
  }
  function tableColumn(table, key) {
    var head = table.tHead && table.tHead.rows[0];
    if (!head) return -1;
    for (var i = 0; i < head.cells.length; i++) {
      var th = head.cells[i];
      if (th.getAttribute("data-sort-key") === key || th.getAttribute("data-cmu-column") === key)
        return i;
    }
    return -1;
  }
  function tableValue(cell) {
    if (!cell) return "";
    var v = cell.getAttribute("data-sort-value");
    return (v === null ? cell.textContent : v).trim();
  }
  var tableCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  function tableCompare(a, b) {
    var na = Number(a.replace(/[$,%\s]/g, "")),
      nb = Number(b.replace(/[$,%\s]/g, ""));
    if (a !== "" && b !== "" && !isNaN(na) && !isNaN(nb)) return na - nb;
    return tableCollator.compare(a, b);
  }
  function tableCountText(table, shown, all) {
    var noun = (table.getAttribute("data-cmu-noun") || "row").split("|"),
      one = noun[0],
      many = noun[1] || one + "s";
    if (!shown) return "Sorry, no results to display.";
    if (shown === all) return all === 1 ? "Showing 1 " + one : "Showing all " + all + " " + many;
    return "Showing " + shown + " of " + all + " " + (all === 1 ? one : many);
  }
  function tableFields(table) {
    var global = table.id
      ? Array.prototype.slice.call(
          document.querySelectorAll('[data-cmu-filter="' + table.id + '"]'),
        )
      : [];
    return {
      global: global,
      columns: Array.prototype.slice.call(table.querySelectorAll("[data-cmu-filter-column]")),
      count: table.id ? document.querySelector('[data-cmu-count="' + table.id + '"]') : null,
    };
  }
  function tableSave(table, state) {
    var p = new URLSearchParams(location.search);
    Array.from(p.keys()).forEach(function (k) {
      if (k === tableParam(table, "q") || k === tableParam(table, "sort")) p.delete(k);
      if (k.indexOf(tableParam(table, "filter") + "[") === 0) p.delete(k);
    });
    if (state.q) p.set(tableParam(table, "q"), state.q);
    Object.keys(state.filters).forEach(function (k) {
      if (state.filters[k]) p.set(tableParam(table, "filter[" + k + "]"), state.filters[k]);
    });
    if (state.sort) p.set(tableParam(table, "sort"), (state.dir < 0 ? "-" : "") + state.sort);
    var qs = p.toString();
    history.replaceState(
      history.state,
      "",
      location.pathname + (qs ? "?" + qs : "") + location.hash,
    );
  }
  function tableArrows(table, key, dir) {
    table.querySelectorAll("th[data-sort-key]").forEach(function (th) {
      var on = th.getAttribute("data-sort-key") === key,
        arrow = th.querySelector(".cmu-sort-arrow");
      if (on) th.setAttribute("aria-sort", dir < 0 ? "descending" : "ascending");
      else th.removeAttribute("aria-sort");
      if (arrow) arrow.textContent = on ? (dir < 0 ? " ▼" : " ▲") : "";
    });
  }
  function table(t) {
    if (t.cmuTable) return;
    t.cmuTable = true;
    var f = tableFields(t),
      server = t.hasAttribute("data-cmu-table-server"),
      p = new URLSearchParams(location.search),
      body = t.tBodies[0],
      state = { q: "", filters: {}, sort: "", dir: 1 };
    // Start from the address
    state.q = p.get(tableParam(t, "q")) || "";
    f.global.forEach(function (input) {
      if (state.q && !input.value) input.value = state.q;
    });
    f.columns.forEach(function (input) {
      var k = input.getAttribute("data-cmu-filter-column"),
        v = p.get(tableParam(t, "filter[" + k + "]"));
      if (v && !input.value) input.value = v;
    });
    var sort = p.get(tableParam(t, "sort")) || "";
    if (sort) {
      state.dir = sort.charAt(0) === "-" ? -1 : 1;
      state.sort = sort.replace(/^-/, "");
      tableArrows(t, state.sort, state.dir);
    } else {
      // A column the page marks as sorted (aria-sort) starts the sort, so
      // its arrow shows and a click reverses it
      var sorted = t.querySelector("th[data-sort-key][aria-sort]");
      if (sorted) {
        state.dir = sorted.getAttribute("aria-sort") === "descending" ? -1 : 1;
        state.sort = sorted.getAttribute("data-sort-key");
        tableArrows(t, state.sort, state.dir);
      }
    }
    if (server) {
      // The server filters: typing submits the fields' form after a pause
      var timer;
      f.global.concat(f.columns).forEach(function (input) {
        input.addEventListener("input", function () {
          clearTimeout(timer);
          timer = setTimeout(function () {
            if (!input.form) return;
            if (input.form.requestSubmit) input.form.requestSubmit();
            else input.form.submit();
          }, 400);
        });
      });
      return;
    }
    if (!body) return;
    // The spaces between rows in the HTML: moving rows past them is many
    // times slower in Chrome, and they show nothing
    Array.prototype.slice.call(body.childNodes).forEach(function (n) {
      if (n.nodeType === 3 && !n.nodeValue.trim()) body.removeChild(n);
    });
    // Each row's words, lowercased once, for the search and each column
    var rows = Array.prototype.map.call(body.rows, function (r, i) {
      return { el: r, at: i, text: null, cells: {}, sort: {} };
    });
    var columns = {};
    function columnOf(k) {
      if (!(k in columns)) columns[k] = tableColumn(t, k);
      return columns[k];
    }
    function words(el) {
      return (el.textContent + " " + (el.getAttribute("data-keywords") || "")).toLowerCase();
    }
    function rowText(r) {
      if (r.text === null) r.text = words(r.el);
      return r.text;
    }
    function cellText(r, i) {
      if (!(i in r.cells)) r.cells[i] = r.el.cells[i] ? words(r.el.cells[i]) : "";
      return r.cells[i];
    }
    function sortValue(r, i) {
      if (!(i in r.sort)) r.sort[i] = tableValue(r.el.cells[i]);
      return r.sort[i];
    }
    var order = rows.map(function (r) {
      return r.el;
    });
    function render(save) {
      state.q = f.global.length ? f.global[0].value.trim() : state.q;
      var active = [];
      f.columns.forEach(function (input) {
        var k = input.getAttribute("data-cmu-filter-column"),
          v = input.value.trim();
        state.filters[k] = v;
        if (v && columnOf(k) >= 0) active.push([columnOf(k), v.toLowerCase()]);
      });
      var q = state.q.toLowerCase(),
        column = state.sort ? columnOf(state.sort) : -1,
        list = rows.slice();
      if (column >= 0)
        list.sort(function (a, b) {
          return (
            state.dir * tableCompare(sortValue(a, column), sortValue(b, column)) || a.at - b.at
          );
        });
      var shown = [],
        hidden = [];
      list.forEach(function (r) {
        var ok = !q || rowText(r).indexOf(q) >= 0;
        for (var i = 0; ok && i < active.length; i++)
          ok = cellText(r, active[i][0]).indexOf(active[i][1]) >= 0;
        (ok ? shown : hidden).push(r.el);
      });
      shown.forEach(function (el) {
        if (el.hidden) el.hidden = false;
      });
      hidden.forEach(function (el) {
        if (!el.hidden) el.hidden = true;
      });
      // Move rows only when their order changed: shown rows first, so the
      // stripes stay even
      var next = shown.concat(hidden),
        moved = next.some(function (el, i) {
          return el !== order[i];
        });
      if (moved) {
        var frag = document.createDocumentFragment();
        next.forEach(function (el) {
          frag.appendChild(el);
        });
        body.appendChild(frag);
        order = next;
      }
      if (f.count) f.count.textContent = tableCountText(t, shown.length, rows.length);
      if (save) tableSave(t, state);
    }
    // A long table waits for a pause in typing
    var wait;
    f.global.concat(f.columns).forEach(function (input) {
      input.addEventListener("input", function () {
        clearTimeout(wait);
        if (rows.length < 500) render(true);
        else
          wait = setTimeout(function () {
            render(true);
          }, 150);
      });
    });
    t.querySelectorAll("th[data-sort-key] .cmu-sort").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        var k = b.closest("th").getAttribute("data-sort-key");
        state.dir = state.sort === k ? -state.dir : 1;
        state.sort = k;
        tableArrows(t, k, state.dir);
        render(true);
      });
    });
    // Only when the address or the fields (a page restored from a cache)
    // asked for something; the page's own rows and count stand otherwise
    var asked =
      sort ||
      f.global.concat(f.columns).some(function (input) {
        return input.value.trim();
      });
    if (asked) render(false);
  }

  // A search box over a list, not a table: <input data-cmu-filter="list id">
  // hides the list's items that don't match their text or data-keywords, and
  // the list's data-cmu-noun names them in its count
  function listFilter(input) {
    var list = document.getElementById(input.getAttribute("data-cmu-filter"));
    if (input.cmuFilter || !list || list.tagName === "TABLE") return;
    input.cmuFilter = true;
    var count = document.querySelector('[data-cmu-count="' + list.id + '"]');
    function run() {
      var q = input.value.trim().toLowerCase(),
        items = Array.prototype.slice.call(list.children),
        shown = 0;
      items.forEach(function (li) {
        var ok =
          !q ||
          (li.textContent + " " + (li.getAttribute("data-keywords") || ""))
            .toLowerCase()
            .indexOf(q) >= 0;
        li.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = tableCountText(list, shown, items.length);
    }
    input.addEventListener("input", run);
    if (input.value) run();
  }
  function startTables(root) {
    if (root.querySelectorAll) {
      root.querySelectorAll("table[data-cmu-table]").forEach(table);
      root.querySelectorAll("input[data-cmu-filter]").forEach(listFilter);
    }
    if (root.matches && root.matches("table[data-cmu-table]")) table(root);
  }

  // Search suggestions: <div class="cmu-suggest"> holding the field,
  // <input role="combobox" aria-controls="(list id)" aria-expanded="false"
  // aria-autocomplete="list">, and <ul class="cmu-suggest-list" id="(list id)"
  // role="listbox" hidden>. The page fills the list with <li> options as
  // people type, from its own data or a search service; this shows the list
  // under the field while it has focus and options, bolds the typed text in
  // each option and handles the keyboard: Up and Down move, Enter picks,
  // Escape closes. Picking puts the option's data-value (or its text) in the
  // field and fires input, change and cmu-suggest-pick (detail: the option).
  // See Search Suggestions in the docs (forms.html).
  function suggestParts(el) {
    var box = el && el.closest && el.closest(".cmu-suggest");
    if (!box) return null;
    var input = box.querySelector("input"),
      list = box.querySelector(".cmu-suggest-list");
    return input && list ? { input: input, list: list } : null;
  }
  function suggestOptions(list) {
    return Array.prototype.slice.call(list.querySelectorAll(":scope > li"));
  }
  function suggestActive(parts, i) {
    var options = suggestOptions(parts.list);
    options.forEach(function (option, n) {
      option.setAttribute("aria-selected", n === i ? "true" : "false");
    });
    if (options[i]) {
      parts.input.setAttribute("aria-activedescendant", options[i].id);
      options[i].scrollIntoView({ block: "nearest" });
    } else parts.input.removeAttribute("aria-activedescendant");
  }
  function suggestOpen(parts, open) {
    open = open && suggestOptions(parts.list).length > 0 && document.activeElement === parts.input;
    parts.list.hidden = !open;
    parts.input.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) suggestActive(parts, -1);
  }
  function suggestPick(parts, option) {
    parts.input.value = option.getAttribute("data-value") || option.textContent;
    suggestOpen(parts, false);
    ["input", "change"].forEach(function (type) {
      parts.input.dispatchEvent(new Event(type, { bubbles: true }));
    });
    parts.input.dispatchEvent(
      new CustomEvent("cmu-suggest-pick", { bubbles: true, detail: option }),
    );
  }
  // New options: give each an id and role, bold the typed text in plain
  // ones, and show them
  function suggestRefresh(list) {
    var parts = suggestParts(list);
    if (!parts) return;
    var typed = parts.input.value.trim().toLowerCase();
    suggestOptions(list).forEach(function (option, n) {
      option.setAttribute("role", "option");
      if (!option.id) option.id = list.id + "-" + n;
      var text = option.textContent,
        at = typed ? text.toLowerCase().indexOf(typed) : -1;
      if (option.children.length || at < 0) return;
      var strong = document.createElement("strong");
      strong.textContent = text.slice(at, at + typed.length);
      option.replaceChildren(text.slice(0, at), strong, text.slice(at + typed.length));
    });
    suggestOpen(parts, true);
  }
  document.addEventListener("keydown", function (e) {
    var parts =
      e.target.matches && e.target.matches(".cmu-suggest input") && suggestParts(e.target);
    if (!parts) return;
    var options = suggestOptions(parts.list),
      i = options.findIndex(function (option) {
        return option.getAttribute("aria-selected") === "true";
      });
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && options.length) {
      e.preventDefault();
      suggestOpen(parts, true);
      suggestActive(
        parts,
        e.key === "ArrowDown" ? (i + 1) % options.length : i <= 0 ? options.length - 1 : i - 1,
      );
    } else if (e.key === "Enter" && !parts.list.hidden && i >= 0) {
      e.preventDefault();
      suggestPick(parts, options[i]);
    } else if (e.key === "Escape" && !parts.list.hidden) {
      e.preventDefault();
      suggestOpen(parts, false);
    }
  });
  // mousedown, not click, so the field keeps focus
  document.addEventListener("mousedown", function (e) {
    var option = e.target.closest && e.target.closest(".cmu-suggest-list > li");
    if (!option) return;
    e.preventDefault();
    suggestPick(suggestParts(option), option);
  });
  ["focusin", "focusout"].forEach(function (type) {
    document.addEventListener(type, function (e) {
      var parts =
        e.target.matches && e.target.matches(".cmu-suggest input") && suggestParts(e.target);
      if (parts) suggestOpen(parts, type === "focusin");
    });
  });

  startCountdowns(document);
  startTabs(document);
  // Annotated Image pins: a pin links to its callout. Pointing at a pin (or
  // focusing it) lights its callout, and pointing at a callout lights its
  // pin. Clicking a pin or its callout selects the pair, keeping both lit and
  // clearing any other pair in the same image; clicking the selected pair
  // again clears it. A pin whose callout is out of view, on narrow screens,
  // still scrolls there, and selects it.
  function annotatedPair(target) {
    var pin = target.closest && target.closest("a.cmu-annotated-pin");
    if (pin) return { pin: pin, note: document.getElementById(pin.hash.slice(1)) };
    var note = target.closest && target.closest(".cmu-annotated-notes > li[id]");
    if (!note) return null;
    var box = note.closest(".cmu-annotated");
    return {
      note: note,
      pin: box && box.querySelector('a.cmu-annotated-pin[href="#' + note.id + '"]'),
    };
  }
  [
    ["mouseover", true],
    ["mouseout", false],
    ["focusin", true],
    ["focusout", false],
  ].forEach(function (pair) {
    document.addEventListener(pair[0], function (e) {
      var found = annotatedPair(e.target);
      if (!found || !found.pin || !found.note) return;
      // Moving within the pin or the callout isn't leaving it
      if (
        !pair[1] &&
        e.relatedTarget &&
        (found.pin.contains(e.relatedTarget) || found.note.contains(e.relatedTarget))
      )
        return;
      found.pin.classList.toggle("cmu-annotated-lit", pair[1]);
      found.note.classList.toggle("cmu-annotated-lit", pair[1]);
    });
  });
  document.addEventListener(
    "click",
    function (e) {
      var found = annotatedPair(e.target);
      if (!found || !found.pin || !found.note) return;
      // A link inside a callout still works as a link
      if (!e.target.closest("a.cmu-annotated-pin") && e.target.closest("a, button")) return;
      var selected = found.note.classList.contains("cmu-annotated-current");
      var box = found.note.closest(".cmu-annotated") || document;
      box.querySelectorAll(".cmu-annotated-current").forEach(function (el) {
        el.classList.remove("cmu-annotated-current");
      });
      if (!selected) {
        found.pin.classList.add("cmu-annotated-current");
        found.note.classList.add("cmu-annotated-current");
      }
      if (e.target.closest("a.cmu-annotated-pin")) {
        // A callout in view: stay put. Out of view: let the link scroll to it
        var r = found.note.getBoundingClientRect();
        if (r.top < 0 || r.bottom > window.innerHeight) return;
        // Capture, so the template's own scrolling for # links never sees it
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
  // Chat: <div class="cmu-chat" data-cmu-chat-mascot="mascot.png">
  // with a section.cmu-chat-panel (hidden) and a button.cmu-chat-launcher
  // aria-controls'd to it. The launcher opens and closes the panel; Escape
  // and the close button close it and return to the launcher. A question,
  // typed or a button in .cmu-chat-choices, joins the log as the user's
  // message and fires cmu-chat-send on the .cmu-chat, with detail.text, the
  // button's value as detail.value, and detail.reply(text or node), which
  // adds a reply and returns its bubble. The app can also add replies to
  // .cmu-chat-log itself, such as from a Turbo Stream. The log is aria-busy,
  // showing typing dots, from a question until a reply arrives. A panel with
  // an id stays open across pages in the same tab.
  function chatParts(root) {
    return {
      panel: root.querySelector(".cmu-chat-panel"),
      launcher: root.querySelector(".cmu-chat-launcher"),
      log: root.querySelector(".cmu-chat-log"),
      input: root.querySelector(".cmu-chat-form textarea, .cmu-chat-form input"),
    };
  }
  function chatPicture(root, attribute, property) {
    var src = root.getAttribute(attribute);
    if (src)
      root.style.setProperty(
        property,
        'url("' + new URL(src, document.baseURI).href.replace(/"/g, "%22") + '")',
      );
    else root.style.removeProperty(property);
    return !!src;
  }
  // The wide picture on the open launcher: the app's own, or Chatterbuggy's
  // when the app has no mascot; an app's mascot alone stays in its circle
  function chatMascot(root) {
    var mascot = chatPicture(root, "data-cmu-chat-mascot", "--cmu-chat-mascot"),
      open = chatPicture(root, "data-cmu-chat-mascot-open", "--cmu-chat-mascot-open");
    root.classList.toggle("cmu-chat--wide", open || !mascot);
  }
  function chatRemember(panel, open) {
    if (!panel.id) return;
    try {
      if (open) sessionStorage.setItem("cmu-chat:" + panel.id, "open");
      else sessionStorage.removeItem("cmu-chat:" + panel.id);
    } catch {
      // Storage off: the panel starts closed on the next page
    }
  }
  function chatScroll(log, node) {
    if (!log) return;
    var end = log.scrollHeight - log.clientHeight;
    if (!node || node.classList.contains("cmu-chat-message--user")) {
      log.scrollTop = end;
      return;
    }
    // A reply, with any choices after it, shows as much as fits from the
    // top of the first reply since the user's last message
    var first = log.firstElementChild;
    for (var el = log.lastElementChild; el; el = el.previousElementSibling)
      if (el.classList.contains("cmu-chat-message--user")) {
        first = el.nextElementSibling || el;
        break;
      }
    log.scrollTop = Math.min(end, first.offsetTop - 16);
  }
  function chatOpen(root, open, focus) {
    var p = chatParts(root);
    if (!p.panel) return;
    p.panel.hidden = !open;
    if (p.launcher) p.launcher.setAttribute("aria-expanded", String(open));
    root.classList.toggle("cmu-chat--open", open);
    chatRemember(p.panel, open);
    chatFit();
    if (open) {
      chatScroll(p.log);
      if (focus && p.input) p.input.focus();
    } else if (focus && p.launcher) p.launcher.focus();
  }
  // On a phone the open panel takes the screen. It fills the part above the
  // keyboard (the visual viewport), and the page behind it doesn't scroll.
  var chatPhone = window.matchMedia("(max-width: 600px)");
  function chatFit() {
    var vv = window.visualViewport,
      panel = Array.prototype.filter.call(
        document.querySelectorAll(".cmu-chat--open > .cmu-chat-panel"),
        function (el) {
          return !el.hidden && chatPhone.matches && getComputedStyle(el).position === "fixed";
        },
      )[0];
    document.documentElement.classList.toggle("cmu-chat-locked", !!panel);
    if (!panel || !vv) return;
    panel.style.setProperty("--cmu-chat-top", vv.offsetTop + "px");
    panel.style.setProperty("--cmu-chat-height", vv.height + "px");
  }
  function chatMessage(content, user) {
    var message = document.createElement("div"),
      bubble = document.createElement("div");
    message.className = "cmu-chat-message" + (user ? " cmu-chat-message--user" : "");
    bubble.className = "cmu-chat-bubble";
    if (typeof content === "string") bubble.textContent = content;
    else if (content) bubble.appendChild(content);
    message.appendChild(bubble);
    return message;
  }
  function chatSend(root, text, value) {
    var p = chatParts(root);
    if (!p.log) return;
    p.log.appendChild(chatMessage(text, true));
    p.log.setAttribute("aria-busy", "true");
    chatScroll(p.log);
    root.dispatchEvent(
      new CustomEvent("cmu-chat-send", {
        bubbles: true,
        detail: {
          text: text,
          value: value,
          reply: function (content) {
            var message = chatMessage(content, false);
            p.log.appendChild(message);
            return message.firstChild;
          },
        },
      }),
    );
  }
  // A reply added to a log, by detail.reply() or by the app, ends the wait
  function chatAdded(log, nodes) {
    nodes.forEach(function (n) {
      if (n.nodeType !== 1 || n.classList.contains("cmu-chat-message--user")) return;
      log.removeAttribute("aria-busy");
      chatScroll(log, n);
    });
  }
  function startChats(scope) {
    var roots = [];
    if (scope.matches && scope.matches(".cmu-chat")) roots.push(scope);
    if (scope.querySelectorAll)
      roots = roots.concat(Array.from(scope.querySelectorAll(".cmu-chat")));
    roots.forEach(function (root) {
      chatMascot(root);
      var p = chatParts(root);
      if (!p.panel || !p.panel.id) return;
      var open = false;
      try {
        open = sessionStorage.getItem("cmu-chat:" + p.panel.id) === "open";
      } catch {
        // Storage off: start closed
      }
      if (open && p.panel.hidden) chatOpen(root, true, false);
    });
  }
  // Added once, even if this script runs again: a second listener would
  // open and close the panel on the same click
  if (!document.cmuChat) {
    document.cmuChat = true;
    document.addEventListener("click", chatClick);
    document.addEventListener("submit", chatSubmit);
    document.addEventListener("keydown", chatKey);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", chatFit);
      window.visualViewport.addEventListener("scroll", chatFit);
    }
    chatPhone.addEventListener("change", chatFit);
  }
  function chatClick(e) {
    var root = e.target.closest && e.target.closest(".cmu-chat");
    if (!root) return;
    var p = chatParts(root);
    if (e.target.closest(".cmu-chat-launcher")) chatOpen(root, !!(p.panel && p.panel.hidden), true);
    else if (e.target.closest(".cmu-chat-close")) chatOpen(root, false, true);
    else {
      var choice = e.target.closest(".cmu-chat-choices button");
      if (choice && !choice.disabled && choice.type !== "submit")
        chatSend(root, choice.textContent.trim(), choice.value || undefined);
    }
  }
  function chatSubmit(e) {
    var form = e.target.closest && e.target.closest(".cmu-chat-form");
    var root = form && form.closest(".cmu-chat");
    if (!root) return;
    e.preventDefault();
    var input = chatParts(root).input,
      text = input ? input.value.trim() : "";
    if (!text) return;
    input.value = "";
    chatSend(root, text);
  }
  function chatKey(e) {
    var root = e.target.closest && e.target.closest(".cmu-chat");
    if (!root) return;
    if (e.key === "Escape" && e.target.closest(".cmu-chat-panel")) {
      e.preventDefault();
      document.cmuChatEscape = true;
      chatOpen(root, false, true);
    } else if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.isComposing &&
      e.target.matches(".cmu-chat-form textarea")
    ) {
      // Enter sends; Shift+Enter starts a new line
      e.preventDefault();
      e.target.form.requestSubmit();
    }
  }
  tabsFromHash();
  window.addEventListener("hashchange", tabsFromHash);
  startScrollGalleries(document);
  startTables(document);
  startChats(document);
  // Countdowns, sorting lists, email links, tabs, tables and chats added later
  // start, a countdown whose date changes restarts, a chat whose pictures
  // change shows them, chat replies end the wait and suggestion lists show new options
  new MutationObserver(function (changes) {
    changes.forEach(function (c) {
      if (c.type === "attributes") {
        if (c.attributeName.indexOf("data-cmu-chat-mascot") === 0) chatMascot(c.target);
        else countdown(c.target);
      } else {
        // Replies added to a chat log
        if (c.target.classList && c.target.classList.contains("cmu-chat-log"))
          chatAdded(c.target, c.addedNodes);
        // A suggestion list's options changed
        if (c.target.classList && c.target.classList.contains("cmu-suggest-list"))
          suggestRefresh(c.target);
        c.addedNodes.forEach(function (n) {
          startCountdowns(n);
          startSorts(n);
          startEmails(n);
          startInitials(n);
          startTabs(n);
          startScrollGalleries(n);
          startTables(n);
          startChats(n);
        });
      }
    });
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-cmu-countdown", "data-cmu-chat-mascot", "data-cmu-chat-mascot-open"],
  });
})();
