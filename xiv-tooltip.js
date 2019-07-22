document.addEventListener("DOMContentLoaded", function (event) {
  // Default settings.
  var settings = {
    targetSelector: 'a.xiv-tooltip-link',
    targetUrl: function (element) {
      return element.hostname;
    },
    targetPath: function (element) {
      return element.pathname + element.hash;
    },
    locale: 'en',
  };

  // Override with user settings, if available.
  if (typeof xivTooltipSettings !== 'undefined') {
    settings = Object.assign(settings, xivTooltipSettings);
  }

  // Embed XIV Tooltip CSS.
  var cssLink = document.createElement('link');
  cssLink.setAttribute('rel', 'stylesheet');
  cssLink.setAttribute('href', 'xiv-tooltip.css');
  document.getElementsByTagName('body')[0].appendChild(cssLink);

  // Tooltip initiation function.
  var initTooltip = function(element) {
    var site, type, locale, id;
    locale = settings.locale;

    var parts;

    switch (settings.targetUrl(element)) {
      case 'ffxivteamcraft.com':
        site = 'teamcraft';
        // Ensure the right Teamcraft URL.
        parts = settings.targetPath(element).split('/');
        if (!parts.length || parts[1] !== 'db') {
          exit;
        }
        locale = parts[2];
        type = parts[3];
        id = parts[4];
        break;

      case 'garlandtools.org':
        site = 'garlandtools';
        // Ensure the right Garland Tools URL.
        parts = settings.targetPath(element).split('/');
        if (!parts.length || parts[1] !== 'db') {
          exit;
        }
        type = parts[2].substr(1);
        id = parts[3];
        break;
    }

    // Post-process edge cases in the data before proceeding.
    if (type === 'action' && id > 100000) {
      type = 'CraftAction';
    }

    // We have identified the data. Let's fetch it!
    fetch(`https://xivapi.com/${type}/${id}`)
        .then(function (response) {
          return response.json();
        })
        .then(function (result) {
          if (element.classList.contains('has-icon')) {
            var icon = document.createElement('img');
            icon.setAttribute('src', `https://xivapi.com${result['Icon']}`)
            element.prepend(icon);
          }
          console.debug(result[`Name_${locale}`], result[`Description_${locale}`]);
        });
  }

  var obs = function(mutationsList, observer) {
    for (var mutation of mutationsList) {
      for (node of mutation.addedNodes) {
        if (node.matches(settings.targetSelector)) {
          initTooltip(node);
        }
      }
    }
  };

  // Detect tooltip links.
  var links = document.querySelectorAll(settings.targetSelector);
  console.debug(links);

  // Main iteration loop.
  for (var link of links) {
    initTooltip(link);
  }

// Create an observer instance linked to the callback function
  var observer = new MutationObserver(obs);

// Start observing the target node for configured mutations
  observer.observe(document.getElementsByTagName('body')[0], {
    childList: true,
    subtree: true,
  });

  // Test observer.
  var newLink = document.createElement('a');
  newLink.setAttribute('href', "https://ffxivteamcraft.com/db/en/action/100063/Careful-Synthesis");
  newLink.setAttribute('class', 'xiv-tooltip-link has-icon');
  newLink.innerText = 'Careful Synthesis (added with javascript!)';
  document.getElementsByTagName('body')[0].appendChild(newLink);
});