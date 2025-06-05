// ==UserScript==
// @name         BSE Toolbox
// @namespace    https://github.com/L0Lock/BSE-Toolbox
// @version      0.0.4
// @description  Adds a floating window with message templates to Blender Stack Exchange sites.
// @author       Loïc "L0Lock" Dautry
// @match        *blender.stackexchange.com/questions/*/*
// @match        *blender.meta.stackexchange.com/questions/*/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://github.com/L0Lock/BSE-Toolbox/raw/refs/heads/main/BSE-Toolbox.user.js
// @downloadURL  https://github.com/L0Lock/BSE-Toolbox/raw/refs/heads/main/BSE-Toolbox.user.js
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @require      https://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// ==/UserScript==

(function () {
  let activeTextarea = null;

  // Function to find the currently active textarea
  function findActiveTextarea() {
    // First try to use the stored activeTextarea if it's still valid
    if (activeTextarea && document.contains(activeTextarea)) {
      return activeTextarea;
    }
    
    // Look for focused textarea
    const focused = document.activeElement;
    if (focused && focused.tagName === 'TEXTAREA') {
      return focused;
    }
    
    // Fallback to finding any textarea with wmd-input id
    return document.getElementById('wmd-input') || document.querySelector('textarea');
  }

  // Function to insert text at the end of the textarea with the ID "wmd-input"
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
      
      // Ensure the textarea stays focused and active
      textarea.focus();
      activeTextarea = textarea;
      
      // Trigger input event to ensure any listeners are notified
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // Function to create and handle the click event of the floating button
  function createFloatingWindow(templates) {
    const container = $("<div>", {
      id: "oc-mod-panel",
      class: "window",
      style: "position: fixed; right: 20px; top: 50%; transform: translateY(-50%); z-index: 9999; width: 300px; border: 1px solid #ccc; border-radius: 5px; padding: 0; background: #fff;",
    });

      /*
    const header = $("<h2>", {
      class: "oc-mod-title",
      style: "height: 40px; background: #dae6ee; display: flex; align-items: center; padding: 0 10px; font-weight: bold;",
      html: "BSE Toolbox",
    });
    */

    container.append(
    '<div class="header", style="height: 40px;background: #dae6ee;display: flex;padding: 0 10px;margin:auto;font-weight: bold;flex-direction: row-reverse;align-items: baseline;justify-content: center;">'+
    '<h2>'+
    'BSE Toolbox <a href="https://github.com/L0Lock/BSE-Toolbox", style="font-size: 0.5em;">Source</a>'+
    '</h2>'+
    '</div>'
    );

    const content = $("<div>", {
      id: "oc-mod-content",
      style: "padding: 10px; overflow-y: auto; max-height: 400px;",
    });

    function updateDisplayedTemplates() {
      content.empty(); // Clear previous content
      templates.sort((a, b) => a.title.localeCompare(b.title));

      templates.forEach((template) => {
        const title = $("<div>", {
          text: template.title,
          style: "cursor: pointer; margin-bottom: 5px; padding: 5px; border-radius: 3px;",
        });

        // Add hover effect
        title.on("mouseenter", function() {
          $(this).css("background-color", "#f0f0f0");
        }).on("mouseleave", function() {
          $(this).css("background-color", "");
        });

        // Use click instead of mousedown to avoid focus issues
        title.on("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Find the target textarea
          const targetTextarea = findActiveTextarea();
          
          // Insert the text
          insertTextAtEnd(template.message, targetTextarea);
          
          // Small delay to ensure focus is maintained
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

    //$(".window" ).draggable({ handle: ".header" });

    // Make the container draggable using jQuery UI
    container.draggable({
      handle: ".header",
      stop: function () {
        GM_setValue("modPosX", $(this).position().left);
        GM_setValue("modPosY", $(this).position().top);
      },
    });
  }

  // Inject jQuery UI CSS
  GM_addStyle(
    "@import url('https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css'); #oc-mod-panel .ui-draggable { cursor: move; }"
  );

  // Fetch the templates.json from the provided link
  fetch("https://raw.githubusercontent.com/L0Lock/BSE-Toolbox/main/templates.json")
    .then((response) => response.json())
    .then((data) => createFloatingWindow(data.templates))
    .catch((error) => console.error("Error fetching templates:", error));

  // Watch for changes in the DOM to add the window to new textareas added dynamically
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

  // Listen for focus events on textareas to update activeTextarea
  document.addEventListener("focus", function (event) {
    if (event.target.tagName === "TEXTAREA") {
      activeTextarea = event.target;
    }
  }, true);

  // Also listen for clicks on textareas as backup
  document.addEventListener("click", function (event) {
    if (event.target.tagName === "TEXTAREA") {
      activeTextarea = event.target;
    }
  });
})();