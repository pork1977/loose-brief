/*
 * site.js for the downloaded homepage: the behaviour React provides inside
 * Loose Brief, in plain JavaScript with no dependencies. It works with the
 * markup from the Website component in export mode (data-ws and data-wx
 * hooks) and the coastline frames written into the page.
 *
 * Kept deliberately small and readable, since people will open it.
 */
export const SITE_SCRIPT = String.raw`/* Homepage behaviour. Made with Loose Brief. No dependencies. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Mobile menu ---- */

  var menuButton = document.querySelector('[data-ws="menu-button"]');
  if (menuButton) {
    var menu = document.getElementById(menuButton.getAttribute("aria-controls"));
    var header = menuButton.closest("header");
    var label = menuButton.querySelector(".visually-hidden");
    var setMenu = function (open) {
      menuButton.setAttribute("aria-expanded", String(open));
      if (header) header.setAttribute("data-open", String(open));
      if (menu) menu.hidden = !open;
      if (label) label.textContent = open ? "Close menu" : "Open menu";
    };
    menuButton.addEventListener("click", function () {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });
    if (menu) {
      menu.addEventListener("click", function (event) {
        if (event.target.closest("a")) setMenu(false);
      });
    }
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        menuButton.focus();
      }
    });
  }

  /* ---- Demo request form ---- */
  /* This checks the email address and shows a thank-you message. It does not
     send anything: connect it to a form service or your own server (see README). */

  var form = document.querySelector('[data-ws="form"]');
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = form.elements.email;
      var error = form.querySelector('[data-ws="form-error"]');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        error.hidden = false;
        email.setAttribute("aria-invalid", "true");
        email.focus();
        return;
      }
      error.hidden = true;
      email.removeAttribute("aria-invalid");
      form.hidden = true;
      // Move focus to the message, or it's left on a field that has just disappeared.
      var success = document.querySelector('[data-ws="form-success"]');
      success.hidden = false;
      success.setAttribute("tabindex", "-1");
      success.focus();
    });
  }

  /* ---- Sections fade in as they scroll into view ---- */

  if (!reduceMotion && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-reveal", "shown");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.setAttribute("data-reveal", "waiting");
        observer.observe(el);
      }
    });
  }

  /* ---- Coastline explorer ---- */

  var framesData = document.getElementById("coastline-frames");
  var explorer = document.querySelector('[data-wx="explorer"]');
  if (framesData && explorer) {
    var data = JSON.parse(framesData.textContent);
    var q = function (name) { return explorer.querySelector('[data-wx="' + name + '"]'); };
    var slider = q("slider");
    var playButton = q("play");
    var year = Number(slider.value);
    var siteId = "saltings";
    var playing = false;

    var render = function () {
      var frame = data.frames[year - data.firstYear];
      frame.contours.forEach(function (d, i) { q("contour-" + i).setAttribute("d", d); });
      ["lost", "land", "shore", "tide"].forEach(function (name) { q(name).setAttribute("d", frame[name]); });

      var active = frame.sites[0];
      frame.sites.forEach(function (site) {
        var isActive = site.id === siteId;
        if (isActive) active = site;
        var group = explorer.querySelector('[data-wx-site="' + site.id + '"]');
        group.setAttribute("data-active", String(isActive));
        var circles = group.querySelectorAll("circle");
        circles[0].setAttribute("cx", site.x);
        circles[1].setAttribute("cx", site.x);
        circles[1].setAttribute("r", isActive ? 8 : 6);
        group.querySelector("text").setAttribute("x", site.x + 16);
        explorer.querySelector('[data-wx-site-button="' + site.id + '"]').setAttribute("aria-pressed", String(isActive));
        explorer.querySelector('[data-wx-site-value="' + site.id + '"]').textContent = site.moved + " m";
      });

      q("badge").textContent = frame.projected ? "Projection · " + year : String(year);
      q("year").textContent = year;
      q("projected").hidden = !frame.projected;
      slider.value = year;
      slider.setAttribute("aria-valuetext", year + (frame.projected ? ", projected" : ""));
      q("readout-name").textContent = active.name;
      q("readout-value").textContent = active.moved;
      q("readout-text").textContent = "of shoreline lost since 2000" + (year > data.firstYear ? ", about " + active.rate + " m a year" : "") + ".";
      q("caption").textContent = "Illustrative map of a coastline in " + year + (frame.projected ? " (projected)" : "") + ". Shoreline lost since 2000: " +
        frame.sites.map(function (s) { return s.name + " " + s.moved + " metres"; }).join(", ") + ".";
    };

    var setPlaying = function (on) {
      playing = on;
      playButton.setAttribute("aria-label", on ? "Pause" : "Play through the years");
      q("play-icon").innerHTML = on
        ? '<rect x="3" y="2.5" width="3.5" height="11" rx="1"></rect><rect x="9.5" y="2.5" width="3.5" height="11" rx="1"></rect>'
        : '<path d="M4 2.5v11l9-5.5-9-5.5Z"></path>';
    };

    slider.addEventListener("input", function () {
      setPlaying(false);
      year = Number(slider.value);
      render();
    });

    explorer.querySelectorAll("[data-wx-site-button]").forEach(function (button) {
      button.addEventListener("click", function () {
        siteId = button.getAttribute("data-wx-site-button");
        render();
      });
    });

    playButton.addEventListener("click", function () {
      if (playing) return setPlaying(false);
      if (reduceMotion) {
        year = data.lastYear;
        return render();
      }
      var from = year >= data.lastYear ? data.firstYear : year;
      var start = performance.now();
      setPlaying(true);
      var tick = function (now) {
        if (!playing) return;
        year = Math.min(data.lastYear, Math.round(from + ((now - start) / 5000) * (data.lastYear - data.firstYear)));
        render();
        if (year < data.lastYear) requestAnimationFrame(tick);
        else setPlaying(false);
      };
      requestAnimationFrame(tick);
    });
  }
})();
`;
