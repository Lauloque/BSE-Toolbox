// ==UserScript==
// @name         BSE Toolbox
// @namespace    https://github.com/Lauloque/BSE-Toolbox
// @version      0.0.6
// @description  Adds a floating window with message templates to Blender Stack Exchange sites.
// @author       Loïc "Lauloque" Dautry
// @match        *blender.stackexchange.com/questions/*/*
// @match        *blender.meta.stackexchange.com/questions/*/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://github.com/Lauloque/BSE-Toolbox/raw/refs/heads/main/BSE-Toolbox.user.js
// @downloadURL  https://github.com/Lauloque/BSE-Toolbox/raw/refs/heads/main/BSE-Toolbox.user.js
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @require      https://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// ==/UserScript==

(function () {
  let activeTextarea = null;

  function findActiveTextarea() {
    if (activeTextarea && document.contains(activeTextarea)) {
      return activeTextarea;
    }

    const focused = document.activeElement;
    if (focused && focused.tagName === 'TEXTAREA') {
      return focused;
    }

    return document.getElementById('wmd-input') || document.querySelector('textarea');
  }

  function insertTextAtEnd(text, textarea) {
    if (!textarea) {
      textarea = findActiveTextarea();
    }

    if (textarea) {
      const { selectionStart, selectionEnd } = textarea;
      textarea.value =
        textarea.value.substring(0, selectionStart) + text + textarea.value.substring(selectionEnd);
      textarea.selectionStart = selectionStart + text.length;
      textarea.selectionEnd = selectionStart + text.length;

      textarea.focus();
      activeTextarea = textarea;

      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function createFloatingWindow(templates) {
    const container = $("<div>", {
      id: "bse-toolbox-panel",
      class: "bse-toolbox-window",
      style: "position: fixed; right: 20px; top: 50%; transform: translateY(-50%); z-index: 9999; width: 300px; border: 1px solid #ccc; border-radius: 5px; padding: 0; background: #fff;",
    });

    container.append(
    '<div class="header", style="height: 40px;background: #dae6ee;display: flex;padding: 0 10px;margin:auto;font-weight: bold;flex-direction: row-reverse;align-items: center;justify-content: center;">'+
    '<h2 style="margin: 0;">'+
    'BSE Toolbox <a href="https://github.com/L0Lock/BSE-Toolbox" style="font-size: 0.5em; text-decoration: none; margin-left: 8px; display: inline-flex; align-items: center; gap: 3px;" title="View source code"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16,18 22,12 16,6"></polyline><polyline points="8,6 2,12 8,18"></polyline></svg>Source</a>'+
    '</h2>'+
    '</div>'
    );

    const content = $("<div>", {
      id: "bse-toolbox-content",
      style: "padding: 10px; overflow-y: auto; max-height: 400px;",
    });

    function updateDisplayedTemplates() {
      content.empty();
      templates.sort((a, b) => a.title.localeCompare(b.title));

      templates.forEach((template) => {
        const title = $("<div>", {
          text: template.title,
          class: "bse-toolbox-template-item",
          style: "cursor: pointer; margin-bottom: 2px; padding: 3px 5px; border-radius: 3px;",
        });

        title.on("mouseenter", function() {
          $(this).css("background-color", "#f0f0f0");
        }).on("mouseleave", function() {
          $(this).css("background-color", "");
        });

        title.on("click", function (e) {
          e.preventDefault();
          e.stopPropagation();

          const targetTextarea = findActiveTextarea();

          insertTextAtEnd(template.message, targetTextarea);

          setTimeout(() => {
            if (targetTextarea) {
              targetTextarea.focus();
            }
          }, 10);
        });

        content.append(title);
      });
    }

    updateDisplayedTemplates();

    container.append(content);

    $("body").append(container);

    container.draggable({
      handle: ".bse-toolbox-header",
      stop: function () {
        GM_setValue("bseToolboxPosX", $(this).position().left);
        GM_setValue("bseToolboxPosY", $(this).position().top);
      },
    });

    setTimeout(() => {
      if (typeof feather !== 'undefined') {
        feather.replace();
      }
    }, 100);
  }

  GM_addStyle(
    "@import url('https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css'); #bse-toolbox-panel .ui-draggable { cursor: move; }"
  );

  $('head').append('<script src="https://unpkg.com/feather-icons"></script>');

  fetch("https://raw.githubusercontent.com/Lauloque/BSE-Toolbox/main/templates.json")
    .then((response) => response.json())
    .then((data) => createFloatingWindow(data.templates))
    .catch((error) => console.error("Error fetching templates:", error));

  const observer = new MutationObserver(function (mutationsList) {
    for (const mutation of mutationsList) {
      if (mutation.addedNodes && mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (node.tagName === "TEXTAREA" && node.id === "wmd-input") {
            createFloatingWindow();
            break;
          }
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener("focus", function (event) {
    if (event.target.tagName === "TEXTAREA") {
      activeTextarea = event.target;
    }
  }, true);

  document.addEventListener("click", function (event) {
    if (event.target.tagName === "TEXTAREA") {
      activeTextarea = event.target;
    }
  });
})();