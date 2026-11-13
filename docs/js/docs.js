// Docs only: show each live example's markup under it, so every example is
// written once. Elements marked data-demo-skip are left out of the code.
// A section's background classes: its color, invert for dark ones and its pattern
var BAND = [
  "grey",
  "darkgrey",
  "red",
  "gold",
  "blue",
  "teal",
  "green",
  "darkgreen",
  "invert",
  "plaid",
  "globe",
];
// The countdown example: a date field, three days from now at 9 a.m. to
// start, that resets the countdown, its sentence and (below) its code.
// The sentence is in AP style: "Monday, Jan. 11, 2027, at 9 a.m."
var AP_MONTHS = [
  "Jan.",
  "Feb.",
  "March",
  "April",
  "May",
  "June",
  "July",
  "Aug.",
  "Sept.",
  "Oct.",
  "Nov.",
  "Dec.",
];
var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function apMoment(d) {
  var h = d.getHours(),
    m = d.getMinutes();
  var time =
    h === 12 && !m
      ? "noon"
      : h === 0 && !m
        ? "midnight"
        : (h % 12 || 12) +
          (m ? ":" + String(m).padStart(2, "0") : "") +
          (h < 12 ? " a.m." : " p.m.");
  return (
    DAYS[d.getDay()] +
    ", " +
    AP_MONTHS[d.getMonth()] +
    " " +
    d.getDate() +
    ", " +
    d.getFullYear() +
    ", at " +
    time
  );
}
function isoLocal(d) {
  var off = -d.getTimezoneOffset(),
    pad = function (n) {
      return String(Math.floor(Math.abs(n))).padStart(2, "0");
    };
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":00" +
    (off < 0 ? "-" : "+") +
    pad(off / 60) +
    ":" +
    pad(off % 60)
  );
}
// Change text in a demo's code without disturbing its lines (each a .kit-line
// once the code is drawn, which the hanging indents depend on)
function kitCodeReplace(code, from, to) {
  var lines = code.querySelectorAll(".kit-line");
  if (!lines.length) {
    code.textContent = code.textContent.replace(from, to);
    return;
  }
  lines.forEach(function (line) {
    if (line.textContent.indexOf(from) > -1) line.textContent = line.textContent.replace(from, to);
  });
}

document.querySelectorAll("[data-kit-countdown]").forEach(function (field) {
  var target = field.closest(".kit-demo").querySelector(".cmu-countdown");
  var sentence = target.querySelector("p");
  var lead = sentence.textContent.replace(/ [A-Z][a-z]+day, .*$/, " ");
  function set(d) {
    // The example's code, wherever the How to Make It tabs put it
    var code = target.closest(".kit-demo").kitCode || null;
    var oldIso = target.getAttribute("data-cmu-countdown"),
      oldText = sentence.textContent;
    var iso = isoLocal(d),
      text = lead + apMoment(d).replace(/\.?$/, ".");
    target.setAttribute("data-cmu-countdown", iso);
    sentence.textContent = text;
    if (code) {
      kitCodeReplace(code, oldIso, iso);
      kitCodeReplace(code, oldText, text);
    }
  }
  var start = new Date();
  start.setDate(start.getDate() + 3);
  start.setHours(9, 0, 0, 0);
  field.value = isoLocal(start).slice(0, 16);
  set(start);
  field.addEventListener("change", function () {
    var d = new Date(field.value);
    if (!isNaN(d)) set(d);
  });
  // The --replace option, in the countdown and in the code under it
  var replace = field.closest(".kit-demo").querySelector("[data-kit-countdown-replace]");
  if (replace)
    replace.addEventListener("change", function () {
      target.classList.toggle("cmu-countdown--replace", replace.checked);
      var code = target.closest(".kit-demo").kitCode;
      kitCodeReplace(
        code,
        replace.checked ? 'class="cmu-countdown"' : 'class="cmu-countdown cmu-countdown--replace"',
        replace.checked ? 'class="cmu-countdown cmu-countdown--replace"' : 'class="cmu-countdown"',
      );
    });
});

document.querySelectorAll(".kit-demo").forEach(function (demo) {
  var copy = demo.cloneNode(true);
  copy.querySelectorAll("[data-demo-skip]").forEach(function (el) {
    el.remove();
  });
  // What the kit's script added: a countdown's cards, sorting buttons
  copy.querySelectorAll(".cmu-countdown-clock, .cmu-sort-moves").forEach(function (el) {
    el.remove();
  });
  copy.querySelectorAll("a[data-cmu-email]").forEach(function (el) {
    ["href", "role", "tabindex"].forEach(function (name) {
      el.removeAttribute(name);
    });
  });
  copy.querySelectorAll(".cmu-countdown-on").forEach(function (el) {
    el.classList.remove("cmu-countdown-on", "cmu-countdown-ended");
  });
  var lines = copy.innerHTML.replace(/^\s*\n|\s+$/g, "").split("\n");
  var indent = Math.min.apply(
    null,
    lines
      .filter(function (l) {
        return l.trim();
      })
      .map(function (l) {
        return l.match(/^ */)[0].length;
      }),
  );
  var pre = document.createElement("pre");
  pre.className = "kit-code";
  pre.setAttribute("data-kit-demo-code", "");
  var code = document.createElement("code");
  code.textContent = lines
    .map(function (l) {
      return l.slice(indent);
    })
    .join("\n")
    .replace(/=""/g, "")
    .replace(/ data-preview/g, "")
    .replace(/ data-kit-[\w-]+="[^"]*"/g, "");
  pre.appendChild(code);
  demo.kitCode = code;
  // A wide example is a real page section, edge to edge, shown at its real
  // size: its code goes at the top of the text block after it, or of its notes
  // (a kit-follow block right after it), never inside the section.
  if (demo.classList.contains("kit-demo--wide")) {
    // Its CMS and framework blocks go along with the code
    var extras = [];
    while (demo.nextElementSibling && demo.nextElementSibling.matches(".kit-cms, .kit-framework")) {
      extras.push(demo.nextElementSibling);
      demo.nextElementSibling.remove();
    }
    var follow = demo.nextElementSibling;
    if (follow && !follow.classList.contains("kit-follow")) follow = null;
    var section = demo.querySelector(".content, .grid");
    if (
      section &&
      BAND.some(function (c) {
        return section.classList.contains(c);
      })
    )
      demo.classList.add("kit-demo--banded");
    var next = follow || demo.nextElementSibling;
    // Last on the page, or right before another example: a text block of its own
    if (!next || !next.matches(".content, .kit-follow")) {
      next = document.createElement("div");
      next.className = "content wide";
      next.appendChild(document.createElement("div"));
      demo.after(next);
    }
    next.firstElementChild.prepend(pre);
    pre.after.apply(pre, extras);
  } else {
    demo.after(pre);
  }
});

// Forms in the examples don't go anywhere
// How to make it: under each component's example, tabs for the HTML and for
// a CMS (each CMS the docs cover, under its own "In Cascade" label), so a CMS
// reader can stay on that tab on every page. A CMS's steps are a .kit-cms block right after the example
// (data-cms="Cascade"); where there's none, the tab says what to do instead,
// from the section's labels. All rows share one name, so the choice applies to
// every pattern and carries to other pages. Without the script, the steps
// show under the example with their own labels.
// The reader's choices (CMS, framework, stack) live in cookies, not
// localStorage: the template's script clears all of localStorage for its list
// filters, which would forget them. A year, for this site only.
function savedChoice(key) {
  var m = document.cookie.match(new RegExp("(?:^|; )" + key + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function saveChoice(key, value) {
  document.cookie =
    key + "=" + encodeURIComponent(value) + "; path=/; max-age=31536000; SameSite=Lax";
}
var CMSES = ["Cascade", "Another CMS"];
// What the CMS menus say
var CMS_NAMES = { Cascade: "Cascade", "Another CMS": "Another CMS (Drupal and Others)" };
function cmsChoice() {
  var saved = savedChoice("kit-cms");
  return CMSES.indexOf(saved) >= 0 ? saved : CMSES[0];
}
function showCms(name) {
  document.querySelectorAll(".kit-cms-panel").forEach(function (panel) {
    panel.querySelector("select").value = name;
    panel.querySelectorAll(":scope > .kit-cms").forEach(function (b) {
      b.hidden = b.dataset.cms !== name;
    });
  });
  document.querySelectorAll('.kit-options[data-kit-options="cms"]').forEach(function (set) {
    set.kitShow && set.kitShow(name);
  });
}
var sections = Array.prototype.slice.call(document.querySelectorAll("h2.rule-top[id]"));
function sectionOf(el) {
  var found = null;
  sections.forEach(function (h) {
    if (h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) found = h;
  });
  return found;
}
function standIn(cms, section) {
  var where = section && section.querySelector(".kit-where");
  if (!where) return null;
  var has = function (kind) {
    return !!where.querySelector(".kit-where-" + kind);
  };
  var block = document.createElement("div");
  block.className = "kit-cms kit-cms--none";
  block.setAttribute("data-cms", cms);
  var other = cms === "Another CMS",
    name = other ? "another CMS" : cms;
  var label = '<p class="cmu-label kit-cms-label">In ' + name + "</p>";
  var script = has("script")
    ? " It also requires the kit's script, <code>cmu-app.js</code>; see " +
      '<a href="install.html#' +
      (other ? "other-cms" : "cascade") +
      '">Install</a>.'
    : "";
  // Like the HTML tab's code, a box says what this CMS has for the component;
  // any instructions follow as ordinary text
  if (has("app"))
    block.innerHTML =
      label + '<p class="kit-unavailable">This component isn\'t available in ' + name + ".</p>";
  else if (other)
    block.innerHTML =
      label + "<p>Paste the HTML from the HTML tab into the page's HTML source." + script + "</p>";
  else
    block.innerHTML =
      label +
      '<p class="kit-unavailable">This component doesn\'t have ' +
      cms +
      " steps yet.</p>" +
      "<p>Until then, in a page's Content section, open the editor's source code " +
      "(&lt;&gt;) and paste the HTML from the HTML tab." +
      script +
      "</p>";
  return block;
}
// Frameworks: a demo can also have a Framework tab, from .kit-framework
// blocks right after it (data-framework="React", and so on). The tabs keep
// general names (HTML, CMS, Framework), so everyone can see which one is
// theirs; the Framework panel starts with a menu of frameworks, and the
// choice carries to every Framework tab, here and on other pages. React until
// they pick another.
var FRAMEWORKS = ["React", "Svelte", "Vue", "Rails", "Django"];
// What the menu says: each framework with the versions its examples are for.
// The saved choice is only the name, so these can change without resetting it.
var FRAMEWORK_NAMES = {
  React: "React 18 and 19",
  Svelte: "Svelte 5",
  Vue: "Vue 3",
  Rails: "Rails 7.2 and Later",
  Django: "Django 5.2 and Later",
};
function frameworkChoice() {
  var saved = savedChoice("kit-framework");
  return FRAMEWORKS.indexOf(saved) >= 0 ? saved : FRAMEWORKS[0];
}
function showFramework(name) {
  document.querySelectorAll('.kit-options[data-kit-options="framework"]').forEach(function (set) {
    set.kitShow && set.kitShow(name);
  });
  document.querySelectorAll(".kit-framework-panel").forEach(function (panel) {
    panel.querySelector("select").value = name;
    panel.querySelectorAll(".kit-framework").forEach(function (b) {
      b.hidden = b.dataset.framework !== name;
    });
  });
}
// React's version of a demo's HTML, as JSX: attribute names React spells its
// own way, self-closed empty elements, default values for form fields (a
// plain value or checked would make them read-only in React), style objects
// and comments
var JSX_NAMES = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  minlength: "minLength",
  colspan: "colSpan",
  rowspan: "rowSpan",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  inputmode: "inputMode",
  enctype: "encType",
  novalidate: "noValidate",
  formnovalidate: "formNoValidate",
  crossorigin: "crossOrigin",
  srcset: "srcSet",
  datetime: "dateTime",
  contenteditable: "contentEditable",
  spellcheck: "spellCheck",
  allowfullscreen: "allowFullScreen",
  frameborder: "frameBorder",
  referrerpolicy: "referrerPolicy",
  playsinline: "playsInline",
  "accept-charset": "acceptCharset",
  "http-equiv": "httpEquiv",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "xlink:href": "xlinkHref",
};
var VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
// Attributes that are on or off; any other written without a value is an
// empty string (alt, for a decorative image)
var SWITCHES =
  /^(allowfullscreen|async|autofocus|autoplay|checked|controls|default|defer|disabled|formnovalidate|hidden|inert|loop|multiple|muted|nomodule|novalidate|open|playsinline|readonly|required|reversed|selected)$/i;
function jsxStyle(css) {
  var parts = css
    .split(";")
    .map(function (d) {
      var i = d.indexOf(":");
      if (i < 0) return "";
      var name = d.slice(0, i).trim(),
        value = d.slice(i + 1).trim();
      if (!name) return "";
      if (name.indexOf("--") !== 0)
        name = name.replace(/-([a-z])/g, function (_, c) {
          return c.toUpperCase();
        });
      return JSON.stringify(name).replace(/^"([A-Za-z]\w*)"$/, "$1") + ": " + JSON.stringify(value);
    })
    .filter(Boolean);
  return "{{ " + parts.join(", ") + " }}";
}
function toJsx(html) {
  // A selected option becomes its select's defaultValue
  html = html.replace(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi, function (whole, attrs, inner) {
    var picked = null;
    inner = inner.replace(
      /<option\b([^>]*?)\s+selected(?:="[^"]*")?([^>]*)>([^<]*)/gi,
      function (_, before, after, label) {
        var value = /\bvalue="([^"]*)"/.exec(before + after);
        picked = value ? value[1] : label.trim();
        return "<option" + before + after + ">" + label;
      },
    );
    if (picked === null) return whole;
    return "<select" + attrs + ' defaultValue="' + picked + '">' + inner + "</select>";
  });
  return html
    .replace(/<!--([\s\S]*?)-->/g, function (_, c) {
      return "{/*" + c.replace(/\*\//g, "* /") + "*/}";
    })
    .replace(
      /<([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g,
      function (_, tag, attrs, slash) {
        var form = /^(input|textarea|select)$/i.test(tag);
        var out = attrs.replace(
          /(\s+)([^\s=>/]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g,
          function (m, sp, name, value) {
            var lower = name.toLowerCase(),
              jsx = JSX_NAMES[lower] || name;
            if (form && lower === "value") jsx = "defaultValue";
            if (lower === "checked") jsx = "defaultChecked";
            if (lower === "style" && value)
              return sp + "style=" + jsxStyle(value.replace(/^["']|["']$/g, ""));
            if (value === undefined && !SWITCHES.test(lower) && !/^(data|aria)-/.test(lower))
              return sp + jsx + '=""';
            return sp + jsx + (value === undefined ? "" : "=" + value);
          },
        );
        return "<" + tag + out + (slash || VOID.test(tag) ? " />" : ">");
      },
    );
}

// What the Framework tab says for a component nobody wrote framework steps
// for, from its labels
function frameworkText(name, section) {
  var where = section && section.querySelector(".kit-where");
  var has = function (kind) {
    return !!(where && where.querySelector(".kit-where-" + kind));
  };
  var rails = name === "Rails";
  var text =
    name === "Rails"
      ? "Nothing more to do in Rails: use this markup in a view."
      : name === "Django"
        ? "Nothing more to do in Django: use this markup in a template."
        : "Nothing more to do in " + name + ": use this markup in a component.";
  if (has("app"))
    text += " The page's <code>&lt;body&gt;</code> has the <code>cmu-app</code> class.";
  if (has("script"))
    text += rails
      ? " <code>cmu-app.js</code> starts it, Turbo visits included."
      : " <code>cmu-app.js</code> starts it whenever it appears.";
  if (has("icons")) text += " Bootstrap Icons' stylesheet is on the page.";
  return text;
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

var frameworkPanels = 0;
// The CMS tab: a menu of the CMSes the docs cover, over the chosen one's
// steps; the choice carries to every CMS tab, here and on other pages
function cmsPanel(blocks) {
  var panel = document.createElement("div"),
    id = "kit-cms-" + ++frameworkPanels,
    choice = cmsChoice();
  panel.className = "kit-cms-panel";
  panel.innerHTML =
    '<p class="kit-pick"><label class="sr-only" for="' +
    id +
    '">CMS</label> <select id="' +
    id +
    '">' +
    CMSES.map(function (c) {
      return '<option value="' + c + '">' + CMS_NAMES[c] + "</option>";
    }).join("") +
    "</select></p>";
  blocks.forEach(function (b) {
    b.hidden = b.dataset.cms !== choice;
    panel.appendChild(b);
  });
  var menu = panel.querySelector("select");
  menu.value = choice;
  menu.addEventListener("change", function () {
    saveChoice("kit-cms", menu.value);
    showCms(menu.value);
  });
  return panel;
}
function frameworkPanel(pre) {
  var found = [],
    next = pre.nextElementSibling;
  while (next && next.matches(".kit-cms, .kit-framework")) {
    if (next.classList.contains("kit-framework")) found.push(next);
    next = next.nextElementSibling;
  }
  var section = sectionOf(pre),
    html = pre.textContent;
  // Each framework's block: written for it (with its own code), or made here
  // from the HTML, with any note written for it (a block with no code)
  found = FRAMEWORKS.map(function (name) {
    var mine = found.filter(function (b) {
      return b.dataset.framework.split(/\s+/).indexOf(name) >= 0;
    });
    var whole = mine.filter(function (b) {
      return b.querySelector("pre");
    })[0];
    if (whole) {
      whole.dataset.framework = name;
      return whole;
    }
    var block = document.createElement("div");
    block.className = "kit-framework kit-framework--made";
    block.dataset.framework = name;
    // A note can name the reader's framework as {framework}
    var notes = mine.map(function (b) {
      return b.innerHTML.replace(/\{framework\}/g, name);
    });
    block.innerHTML =
      (notes.length ? notes.join("") : "<p>" + frameworkText(name, section) + "</p>") +
      '<pre class="kit-code"><code>' +
      escapeHtml(name === "React" ? toJsx(html) : html) +
      "</code></pre>";
    mine.forEach(function (b) {
      b.remove();
    });
    return block;
  });
  var panel = document.createElement("div"),
    id = "kit-framework-" + ++frameworkPanels,
    choice = frameworkChoice();
  panel.className = "kit-framework-panel";
  panel.innerHTML =
    '<p class="kit-pick"><label class="sr-only" for="' +
    id +
    '">Framework</label> <select id="' +
    id +
    '">' +
    FRAMEWORKS.map(function (f) {
      return '<option value="' + f + '">' + FRAMEWORK_NAMES[f] + "</option>";
    }).join("") +
    "</select></p>";
  found.forEach(function (b) {
    b.hidden = b.dataset.framework !== choice;
    panel.appendChild(b);
  });
  panel.querySelector("select").value = choice;
  panel.querySelector("select").addEventListener("change", function (e) {
    saveChoice("kit-framework", e.target.value);
    saveChoice("kit-stack", e.target.value);
    showFramework(e.target.value);
  });
  return panel;
}

// Choices outside the tabs, as on Install: a .kit-options set of .kit-option
// blocks (data-option, and data-label for the menu) gets a menu over the
// chosen one. A set of CMSes shares its choice with the CMS tabs, and a set
// of stacks with the Framework tabs (for the stacks they cover). A link to an
// option's id, such as install.html#django, opens it.
document.querySelectorAll(".kit-options").forEach(function (set) {
  var kind = set.dataset.kitOptions,
    options = Array.prototype.slice.call(set.querySelectorAll(":scope > .kit-option")),
    values = options.map(function (o) {
      return o.dataset.option;
    }),
    id = "kit-options-" + ++frameworkPanels,
    key = kind === "cms" ? "kit-cms" : "kit-stack";
  set.insertAdjacentHTML(
    "afterbegin",
    '<p class="kit-pick"><label class="sr-only" for="' +
      id +
      '">' +
      (kind === "cms" ? "CMS" : "Framework or stack") +
      '</label> <select id="' +
      id +
      '">' +
      options
        .map(function (o) {
          return (
            '<option value="' +
            o.dataset.option +
            '">' +
            (o.dataset.label || o.dataset.option) +
            "</option>"
          );
        })
        .join("") +
      "</select></p>",
  );
  set.classList.add("kit-options--on");
  var menu = set.querySelector("select");
  set.kitShow = function (value) {
    if (values.indexOf(value) < 0) return;
    menu.value = value;
    options.forEach(function (o) {
      o.hidden = o.dataset.option !== value;
    });
  };
  var first = [savedChoice(key), kind === "cms" ? null : savedChoice("kit-framework")].filter(
    function (v) {
      return values.indexOf(v) >= 0;
    },
  )[0];
  set.kitShow(first || values[0]);
  menu.addEventListener("change", function () {
    saveChoice(key, menu.value);
    if (kind === "cms") showCms(menu.value);
    else if (FRAMEWORKS.indexOf(menu.value) >= 0) {
      saveChoice("kit-framework", menu.value);
      showFramework(menu.value);
    }
  });
  // A link to one of its options opens that one
  function fromHash() {
    var hit = options.filter(function (o) {
      return "#" + o.id === location.hash;
    })[0];
    if (!hit) return;
    set.kitShow(hit.dataset.option);
    hit.scrollIntoView();
  }
  fromHash();
  window.addEventListener("hashchange", fromHash);
});

document.querySelectorAll("pre.kit-code[data-kit-demo-code]").forEach(function (pre, n) {
  var given = {};
  var next = pre.nextElementSibling;
  while (next && next.matches(".kit-cms, .kit-framework")) {
    if (next.classList.contains("kit-cms")) given[next.dataset.cms] = next;
    next = next.nextElementSibling;
  }
  var section = sectionOf(pre);
  var blocks = CMSES.map(function (cms) {
    return given[cms] || standIn(cms, section);
  }).filter(Boolean);
  var framework = frameworkPanel(pre);
  if (!blocks.length && !framework) return;
  var set = document.createElement("div");
  set.className = "kit-how";
  var list = document.createElement("div");
  list.className = "cmu-tabs";
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "How to make it");
  list.setAttribute("data-cmu-tabs", "kit-how");
  pre.before(set);
  set.appendChild(list);
  [{ key: "html", label: "HTML", el: pre }]
    .concat(blocks.length ? [{ key: "cms", label: "CMS", el: cmsPanel(blocks) }] : [])
    .concat(framework ? [{ key: "framework", label: "Framework", el: framework }] : [])
    .forEach(function (item, i) {
      var id = "kit-how-" + n + "-" + item.key;
      var tab = document.createElement("button");
      tab.type = "button";
      tab.id = id + "-tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", id);
      tab.setAttribute("aria-selected", i ? "false" : "true");
      tab.setAttribute("data-cmu-tab", item.key);
      tab.textContent = item.label;
      list.appendChild(tab);
      var panel = document.createElement("div");
      panel.id = id;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.hidden = i > 0;
      panel.appendChild(item.el);
      set.appendChild(panel);
    });
});

document.querySelectorAll('.kit-demo form:not([method="dialog"])').forEach(function (f) {
  f.addEventListener("submit", function (e) {
    e.preventDefault();
  });
});

// A dialog marked data-preview shows in place as a picture of itself, and
// its Open button shows the real modal (the <dialog> element does the rest).
// The open attribute, not show(), so the picture doesn't take focus: show()
// focuses the dialog's first field, and the page would jump down to it.
function preview(d) {
  d.classList.add("kit-inline");
  d.setAttribute("open", "");
}
document.querySelectorAll("dialog[data-preview]").forEach(function (d) {
  preview(d);
  // close() fires its event later, so skip it if the modal is already open
  d.addEventListener("close", function () {
    if (!d.open) preview(d);
  });
});
document.querySelectorAll("[data-open-dialog]").forEach(function (b) {
  b.addEventListener("click", function () {
    var d = document.getElementById(b.dataset.openDialog);
    d.close();
    d.classList.remove("kit-inline");
    d.showModal();
  });
});

// Demo filters. An input with data-kit-filter="list id" hides the list's
// items (or a table body's rows) that don't match its text or data-keywords.
// A cmu-filters box with data-kit-filters="table body id" also hides rows
// whose data-status isn't among the checked boxes. Hidden rows go to the end,
// so table.alternate's stripes stay even, and a count says how many show.
function kitFilter(list, count, noun, keep) {
  var items = Array.prototype.slice.call(list.children);
  return function () {
    var shown = items.filter(keep),
      hidden = items.filter(function (el) {
        return shown.indexOf(el) < 0;
      });
    shown.concat(hidden).forEach(function (el) {
      el.hidden = hidden.indexOf(el) >= 0;
      list.appendChild(el);
    });
    var n = shown.length,
      all = items.length,
      one = noun.split("|")[0],
      many = noun.split("|")[1] || one + "s";
    count.textContent = !n
      ? "Sorry, no results to display."
      : n === all
        ? "Showing all " + all + " " + many
        : "Showing " + n + " of " + all + " " + (all === 1 ? one : many);
  };
}
function kitMatches(el, q) {
  return !q || (el.textContent + " " + (el.dataset.keywords || "")).toLowerCase().indexOf(q) >= 0;
}
document.querySelectorAll("[data-kit-filter]").forEach(function (input) {
  var run = kitFilter(
    document.getElementById(input.dataset.kitFilter),
    document.getElementById(input.dataset.kitCount),
    input.dataset.kitNoun || "person|people",
    function (el) {
      return kitMatches(el, input.value.trim().toLowerCase());
    },
  );
  input.addEventListener("input", run);
});
document.querySelectorAll("[data-kit-filters]").forEach(function (box) {
  var text = box.querySelector('input[type="text"]'),
    checks = box.querySelectorAll('input[type="checkbox"]');
  var run = kitFilter(
    document.getElementById(box.dataset.kitFilters),
    document.getElementById(box.dataset.kitCount),
    box.dataset.kitNoun || "item",
    function (el) {
      var on = Array.prototype.filter
        .call(checks, function (c) {
          return c.checked;
        })
        .map(function (c) {
          return c.value;
        });
      return (
        kitMatches(el, text.value.trim().toLowerCase()) &&
        (!on.length || on.indexOf(el.dataset.status) >= 0)
      );
    },
  );
  box.addEventListener("input", run);
});

// Try the header (Page Layout): the roof's color, the search box, signed in
// or out and acting as another user, on the real header of every docs
// page. Choices last while you browse the docs, until Reset.
(function () {
  var roof = document.querySelector(".roof");
  if (!roof) return;
  var DEFAULTS = {
    roof: "red",
    search: "off",
    account: "none",
    photo: "off",
    prefs: "on",
    acting: "off",
    logo: "off",
  };
  var state = Object.assign({}, DEFAULTS);
  try {
    Object.assign(state, JSON.parse(sessionStorage.getItem("kit-header") || "{}"));
  } catch {
    /* storage can be blocked; keep going */
  }
  // "Signed in, with photo" used to be a choice of its own
  if (state.account === "photo") {
    state.account = "in";
    state.photo = "on";
  }
  var actingBar =
    '<form class="cmu-acting-bar kit-try-added"><p>You\u2019re acting as Andrew Carnegie (ac00)</p>' +
    '<button type="submit" class="btn ghost small">Stop Acting as Andrew Carnegie</button></form>';
  var searchForm =
    '<form action="https://search.cmu.edu" class="search search-form kit-try-added" method="get">' +
    '<label><span>Search</span> <input aria-label="Search" name="q" placeholder="Search"></label>' +
    '<button title="Submit" type="submit">Search</button></form>';
  function html(h) {
    var t = document.createElement("template");
    t.innerHTML = h;
    return t.content.firstChild;
  }
  function menuLists() {
    return document.querySelectorAll("#nav > ul, nav.tree > div > ul, nav.tree > ul");
  }
  // A logo needs the name and its h2 wrapped in a div, with the linked image
  // right after it and no space between (see Site Name)
  var sitename = document.getElementById("sitename");
  function setLogo(on) {
    var wrap = sitename.querySelector(":scope > .kit-try-name");
    if (on && !wrap) {
      wrap = document.createElement("div");
      wrap.className = "kit-try-name";
      while (sitename.firstChild) wrap.appendChild(sitename.firstChild);
      sitename.appendChild(wrap);
      sitename.appendChild(
        html(
          // A placeholder from PlaceMellon: Scotty on white, about as tall as the name and h2
          '<a class="kit-try-logo" href="https://placemellon.andrew.cmu.edu/"><img src="https://placemellon.andrew.cmu.edu/110.svg?scotty&white" width="110" height="110" alt="Logo placeholder"></a>',
        ),
      );
    } else if (!on && wrap) {
      sitename.querySelector(".kit-try-logo").remove();
      while (wrap.firstChild) sitename.insertBefore(wrap.firstChild, wrap);
      wrap.remove();
    }
  }
  function apply() {
    document.querySelectorAll(".kit-try-added").forEach(function (el) {
      el.remove();
    });
    if (sitename) setLogo(state.logo === "on");
    roof.classList.toggle("red", state.roof === "red");
    roof.classList.toggle("darkgrey", state.roof === "gray");
    roof.classList.toggle("invert", state.roof !== "white");
    var row = roof.querySelector(":scope > div");
    if (state.search === "on") {
      row.querySelector(".menu-btn").after(html(searchForm));
      var tree = document.querySelector("nav.tree");
      if (tree) tree.querySelector(".menu-btn").after(html(searchForm));
    }
    if (state.account !== "none") {
      var inn = state.account === "in",
        pic = state.photo === "on" ? '<img class="cmu-avatar" src="images/scotty.png" alt="">' : "",
        prefs = state.prefs === "on" ? '<a href="accounts.html#preferences">Preferences</a>' : "";
      var a = html(
        inn
          ? '<a class="cmu-account cmu-account-open kit-try-added" href="#nav">' +
              pic +
              "Andrew Carnegie</a>"
          : '<a class="cmu-account kit-try-added" href="layout.html#try-header">Sign In</a>',
      );
      if (inn)
        a.addEventListener("click", function (e) {
          e.preventDefault();
          roof.querySelector(".menu-btn").click();
        });
      row.appendChild(a);
      menuLists().forEach(function (ul) {
        ul.prepend(
          html(
            inn
              ? '<li class="secondary cmu-account-menu kit-try-added"><a class="cmu-account-name">' +
                  pic +
                  "Andrew Carnegie</a>" +
                  prefs +
                  '<a href="layout.html#try-header">Sign Out</a></li>'
              : '<li class="secondary cmu-account-menu kit-try-added"><a href="layout.html#try-header">Sign In</a></li>',
          ),
        );
      });
    }
    var acting = state.acting === "on";
    document.body.classList.toggle("cmu-acting-as", acting);
    if (acting) {
      var bar = html(actingBar);
      bar.addEventListener("submit", function (e) {
        e.preventDefault();
        set("acting", "off");
      });
      document.body.appendChild(bar);
    }
    // The form shows the state: radio buttons by value, checkboxes on or off
    document.querySelectorAll("[data-kit-key]").forEach(function (input) {
      var v = state[input.dataset.kitKey];
      input.checked = input.type === "radio" ? v === input.value : v === "on";
    });
    document.querySelectorAll("[data-kit-acting]").forEach(function (b) {
      b.textContent = acting ? "Hide the Frame" : "Show the Frame on This Page";
    });
  }
  function set(k, v) {
    state[k] = v;
    try {
      sessionStorage.setItem("kit-header", JSON.stringify(state));
    } catch {
      /* storage can be blocked; keep going */
    }
    apply();
  }
  document.querySelectorAll("[data-kit-key]").forEach(function (input) {
    input.addEventListener("change", function () {
      set(
        input.dataset.kitKey,
        input.type === "radio" ? input.value : input.checked ? "on" : "off",
      );
    });
  });
  document.querySelectorAll("[data-kit-acting]").forEach(function (b) {
    b.addEventListener("click", function () {
      set("acting", state.acting === "on" ? "off" : "on");
    });
  });
  document.querySelectorAll("[data-kit-reset]").forEach(function (b) {
    b.addEventListener("click", function () {
      state = Object.assign({}, DEFAULTS);
      try {
        sessionStorage.removeItem("kit-header");
      } catch {
        /* storage can be blocked; keep going */
      }
      apply();
    });
  });
  // Now, so the template's script copies the search and menu item into its
  // menu as it builds it; and again once it has, for anything it rebuilt
  apply();
  window.addEventListener("load", apply);
})();

// The Components table: sort by a column (click again to reverse), filter as
// you type and by the Requires checkboxes (a row shows if it has any checked
// label). The search and the checked labels go in the URL (?q=, ?requires=).
// Hidden rows go to the end, so the stripes stay even.
document.querySelectorAll("table[data-kit-sortable]").forEach(function (table) {
  var body = table.tBodies[0],
    rows = Array.prototype.slice.call(body.rows);
  var input = document.querySelector('[data-kit-filter-table="' + table.id + '"]');
  var count = input && document.getElementById(input.dataset.kitCount);
  var noun = input ? input.dataset.kitNoun : "row";
  var checks = Array.prototype.slice.call(
    document.querySelectorAll('[data-kit-filter-checks="' + table.id + '"] input'),
  );
  var params = new URLSearchParams(location.search);
  if (input && params.get("q")) input.value = params.get("q");
  var wanted = (params.get("requires") || "").split(",");
  checks.forEach(function (c) {
    c.checked = wanted.indexOf(c.value) >= 0;
  });
  function kinds(r) {
    return Array.prototype.map.call(r.querySelectorAll('[class^="kit-where-"]'), function (el) {
      return el.className.replace("kit-where-", "");
    });
  }
  function saveFilters(q, on) {
    var p = new URLSearchParams(location.search);
    q ? p.set("q", q) : p.delete("q");
    on.length ? p.set("requires", on.join(",")) : p.delete("requires");
    var qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }
  var key = 0,
    dir = 1;
  function cell(r, i) {
    return r.cells[i].textContent.trim().toLowerCase();
  }
  function render() {
    var q = input ? input.value.trim().toLowerCase() : "",
      on = checks
        .filter(function (c) {
          return c.checked;
        })
        .map(function (c) {
          return c.value;
        }),
      shown = [],
      hidden = [];
    saveFilters(input ? input.value.trim() : "", on);
    rows
      .slice()
      .sort(function (a, b) {
        return dir * (cell(a, key) < cell(b, key) ? -1 : cell(a, key) > cell(b, key) ? 1 : 0);
      })
      .forEach(function (r) {
        var text = !q || r.textContent.toLowerCase().indexOf(q) >= 0;
        var label =
          !on.length ||
          kinds(r).some(function (k) {
            return on.indexOf(k) >= 0;
          });
        (text && label ? shown : hidden).push(r);
      });
    shown.forEach(function (r) {
      r.hidden = false;
      body.appendChild(r);
    });
    hidden.forEach(function (r) {
      r.hidden = true;
      body.appendChild(r);
    });
    if (count)
      count.textContent = !shown.length
        ? "Sorry, no results to display."
        : shown.length === rows.length
          ? "Showing all " + rows.length + " " + noun + "s"
          : "Showing " + shown.length + " of " + rows.length + " " + noun + "s";
  }
  table.querySelectorAll("th[data-sort-key] .cmu-sort").forEach(function (b) {
    b.addEventListener("click", function () {
      var th = b.closest("th"),
        i = th.cellIndex;
      dir = i === key ? -dir : 1;
      key = i;
      table.querySelectorAll("th[data-sort-key]").forEach(function (h) {
        h.removeAttribute("aria-sort");
        h.querySelector(".cmu-sort-arrow").textContent = "";
      });
      th.setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");
      th.querySelector(".cmu-sort-arrow").textContent = dir === 1 ? " ▲" : " ▼";
      render();
    });
  });
  if (input) input.addEventListener("input", render);
  checks.forEach(function (c) {
    c.addEventListener("change", render);
  });
  render();
});

// The template gives the header's tabs its hero-page style (nav.b, no line
// under the tabs) when the page has any .hero, even one in an example. Once
// it has run, take that off unless the page's own hero is there.
function unHeroNav() {
  var heroes = document.querySelectorAll(".hero");
  var own = Array.prototype.some.call(heroes, function (h) {
    return !h.closest(".kit-demo");
  });
  if (!own)
    document.querySelectorAll("header nav.b").forEach(function (n) {
      n.classList.remove("b");
    });
}
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(unHeroNav);
  });
else setTimeout(unHeroNav);

// Code blocks, examples' and written ones alike: one block per line, so a
// long line wraps with its continuation hanging under its own indent instead
// of scrolling. The newlines between them keep copied code as it was.
document.querySelectorAll("pre.kit-code > code").forEach(function (code) {
  var lines = code.textContent.split("\n");
  code.textContent = "";
  lines.forEach(function (l, i) {
    if (i) code.appendChild(document.createTextNode("\n"));
    var line = document.createElement("div");
    line.className = "kit-line";
    // The line keeps its own leading spaces (they're copied with it), so its
    // first row is pulled back by the whole padding; wrapped rows hang 4
    // characters deeper than the line's indent
    var hang = l.match(/^ */)[0].length + 4 + "ch";
    line.style.paddingLeft = hang;
    line.style.textIndent = "-" + hang;
    line.textContent = l;
    code.appendChild(line);
  });
});

// A heading's labels (kit-where) never sit on a line by themselves: they wrap
// together with the heading's last word
document.querySelectorAll(".kit-where").forEach(function (where) {
  var text = where.previousSibling;
  while (text && text.nodeType === 3 && !text.textContent.trim()) text = text.previousSibling;
  if (!text || text.nodeType !== 3) return;
  var words = text.textContent.replace(/\s+$/, "");
  var at = words.lastIndexOf(" ") + 1;
  var keep = document.createElement("span");
  keep.className = "kit-keep";
  keep.textContent = words.slice(at) + " ";
  text.textContent = words.slice(0, at);
  where.parentNode.insertBefore(keep, where);
  keep.appendChild(where);
});

// Demo selection: a bulk bar with data-kit-select="table body id" counts the
// checked rows, and shows each data-kit-bulk button with how many selected
// rows have that data-kit-status. The header checkbox selects all.
document.querySelectorAll("[data-kit-select]").forEach(function (bar) {
  var body = document.getElementById(bar.dataset.kitSelect),
    all = body.closest("table").querySelector("thead input[type=checkbox]"),
    count = bar.querySelector(".cmu-selection-count"),
    buttons = bar.querySelectorAll("[data-kit-bulk]"),
    labels = Array.prototype.map.call(buttons, function (b) {
      return b.textContent.replace(/ \(\d+\)$/, "");
    });
  function boxes() {
    return Array.prototype.slice.call(body.querySelectorAll("input[type=checkbox]"));
  }
  function update() {
    var picked = boxes().filter(function (b) {
        return b.checked;
      }),
      n = picked.length;
    count.textContent = n
      ? n + " section" + (n === 1 ? "" : "s") + " selected"
      : "No sections selected";
    count.classList.toggle("cmu-has-selection", n > 0);
    buttons.forEach(function (b, i) {
      var k = picked.filter(function (box) {
        return box.closest("tr").dataset.kitStatus === b.dataset.kitBulk;
      }).length;
      b.textContent = labels[i] + " (" + k + ")";
      b.hidden = !k;
    });
    all.checked = n > 0 && n === boxes().length;
    all.indeterminate = n > 0 && n < boxes().length;
  }
  body.addEventListener("change", update);
  all.addEventListener("change", function () {
    boxes().forEach(function (b) {
      b.checked = all.checked;
    });
    update();
  });
  update();
});

// Demo question card: a form with data-kit-steps holds one fieldset per
// question. The arrows show the one before or after; the back arrow hides on
// the first question, and Submit takes the forward arrow's place on the last.
document.querySelectorAll("[data-kit-steps]").forEach(function (form) {
  var steps = Array.prototype.slice.call(form.querySelectorAll("fieldset")),
    back = form.querySelector(".cmu-question-back"),
    next = form.querySelector('[aria-label="Next question"]'),
    submit = form.querySelector('[type="submit"]');
  function show(i) {
    steps.forEach(function (s, j) {
      s.hidden = j !== i;
    });
    back.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    submit.hidden = !next.hidden;
  }
  function current() {
    return steps.findIndex(function (s) {
      return !s.hidden;
    });
  }
  back.addEventListener("click", function () {
    show(current() - 1);
  });
  next.addEventListener("click", function () {
    show(current() + 1);
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
  });
  show(current());
});

// Demo Load More: a button with data-kit-load-more="table body id" shows the
// next data-kit-batch hidden rows, updates the count, moves focus to the first
// new row and hides its paragraph once everything is showing. A real app loads
// the rows from the server instead.
document.querySelectorAll("[data-kit-load-more]").forEach(function (button) {
  var body = document.getElementById(button.dataset.kitLoadMore),
    count = document.getElementById(button.dataset.kitCount),
    batch = Number(button.dataset.kitBatch) || 20;
  button.addEventListener("click", function () {
    var rows = Array.prototype.slice.call(body.rows),
      next = rows
        .filter(function (r) {
          return r.hidden;
        })
        .slice(0, batch);
    next.forEach(function (r) {
      r.hidden = false;
    });
    var shown = rows.filter(function (r) {
      return !r.hidden;
    }).length;
    count.textContent =
      shown === rows.length
        ? "Showing all " + rows.length + " sections"
        : "Showing " + shown + " of " + rows.length + " sections";
    if (next[0]) {
      next[0].tabIndex = -1;
      next[0].focus();
    }
    if (shown === rows.length) button.closest("p").hidden = true;
  });
});

// The ID Tap example: answer a tap or a search with a made-up person, and
// clear the field for the next card
document.querySelectorAll("[data-kit-tap]").forEach(function (form) {
  var result = form.querySelector("[data-kit-tap-result]");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var card = form.querySelector("[data-cmu-tap]");
    var find = form.querySelector('input[type="search"]');
    var who =
      find && find.value.trim() ? find.value.trim() : card.value ? "Andrew Carnegie (ac00)" : "";
    result.textContent = who ? "Checked in: " + who + "." : "";
    card.value = "";
    if (find) find.value = "";
  });
});

// Search Suggestions demo: campus buildings that contain the typed text
document.querySelectorAll("[data-kit-suggest]").forEach(function (input) {
  var buildings = [
    "Baker Hall",
    "Cohon University Center",
    "College of Fine Arts",
    "Doherty Hall",
    "Gates and Hillman Centers",
    "Hamerschlag Hall",
    "Hunt Library",
    "Margaret Morrison Carnegie Hall",
    "Mellon Institute",
    "Porter Hall",
    "Posner Center",
    "Posner Hall",
    "Purnell Center for the Arts",
    "Scaife Hall",
    "Tepper Building",
    "Wean Hall",
  ];
  var list = document.getElementById(input.getAttribute("aria-controls"));
  input.addEventListener("input", function () {
    var typed = input.value.trim().toLowerCase();
    list.replaceChildren.apply(
      list,
      buildings
        .filter(function (name) {
          return typed && name.toLowerCase().includes(typed) && name.toLowerCase() !== typed;
        })
        .map(function (name) {
          var option = document.createElement("li");
          option.textContent = name;
          return option;
        }),
    );
  });
});

// Page Layout's Try It: while its form is on screen, the header it changes
// stays pinned to the top of the window (docs.css), the way a scroll gallery
// holds its picture while its steps go by
var kitTryForm = document.querySelector("form.kit-try");
if (kitTryForm && window.IntersectionObserver)
  new IntersectionObserver(function (entries) {
    document.body.classList.toggle("kit-pin-header", entries[0].isIntersecting);
  }).observe(kitTryForm);
