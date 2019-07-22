document.addEventListener("DOMContentLoaded", function (event) {
  // Default settings.
  var settings = {
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

  // Detect tooltip links.
  var links = document.getElementsByClassName('xiv-tooltip-link');

  // Main iteration loop.
  for (var link of links) {
    var site, type, locale, id;
    locale = settings.locale;

    var parts;

    switch (link.hostname) {
      case 'ffxivteamcraft.com':
        site = 'teamcraft';
        // Ensure the right Teamcraft URL.
        parts = link.pathname.split('/');
        if (!parts.length || parts[1] !== 'db') {
          continue;
        }
        locale = parts[2];
        type = parts[3];
        id = parts[4];
        break;

      case 'garlandtools.org':
        site = 'garlandtools';
        var fullpath = link.pathname + link.hash;
        // Ensure the right Garland Tools URL.
        parts = fullpath.split('/');
        if (!parts.length || parts[1] !== 'db') {
          continue;
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
          if (link.classList.contains('has-icon')) {
            var icon = document.createElement('img');
            icon.setAttribute('src', `https://xivapi.com${result['Icon']}`)
            link.prepend(icon);
          }
          console.debug(result[`Name_${locale}`], result[`Description_${locale}`]);
        });
  }
});