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
    iconSelector: '.has-icon',
    apiDomain: 'https://xivapi.com',
    locale: 'en',
    replaceText: false,
  };

  // Override with user settings, if available.
  if (typeof xivTooltipSettings !== 'undefined') {
    settings = Object.assign(settings, xivTooltipSettings);
  }

  console.debug(settings);

  // Embed XIV Tooltip CSS.
  var cssLink = document.createElement('link');
  cssLink.setAttribute('rel', 'stylesheet');
  cssLink.setAttribute('href', 'xiv-tooltip.css');
  document.getElementsByTagName('body')[0].appendChild(cssLink);

  // Tooltip initiation function.
  var getMetadata = function (element) {
    var site, type, id;

    var parts;

    switch (settings.targetUrl(element)) {
      case 'ffxivteamcraft.com':
        site = 'teamcraft';
        // Ensure the right Teamcraft URL.
        parts = settings.targetPath(element).split('/');
        if (!parts.length || parts[1] !== 'db') {
          exit;
        }
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

    return [site, type, id];
  };

  function initTooltip(element) {
    var [site, type, id] = getMetadata(element);
    // We have identified the data. Let's fetch it!
    var fetchUrl = new URL(`${settings.apiDomain}/${type}/${id}`);
    var fetchParams = new URLSearchParams();
    fetchParams.append('language', settings.locale);
    fetchUrl.search = fetchParams.toString();

    fetch(fetchUrl)
        .then(function (response) {
          return response.json();
        })
        .then(function (result) {
          console.debug(result[`Name`], result[`Description`]);
        });
  };

  async function requestLinkData(type, entries, ids) {
    // Build the fetch request.
    var fetchUrl = new URL(`${settings.apiDomain}/${type}`);
    var fetchParams = new URLSearchParams();
    fetchParams.append('language', settings.locale);
    fetchParams.append('ids', ids.join(','));
    fetchUrl.search = fetchParams.toString();

    var response = await fetch(fetchUrl);
    return response.json()
        .then(function (result) {
          if (result.Results.length && result.Results[0] !== false) {
            for (var entry of entries) {
              for (var resultRow of result.Results) {
                if (entry.id == resultRow.ID) {
                  if (settings.replaceText) {
                    entry.element.innerText = resultRow.Name;
                  }
                  if (entry.element.matches(settings.iconSelector)) {
                    console.debug('Does match icon selector');
                    var icon = document.createElement('img');
                    icon.setAttribute('class', 'xiv-tooltip-icon');
                    icon.setAttribute('src', `https://xivapi.com${resultRow.Icon}`);
                    entry.element.prepend(icon);
                  }
                  break;
                }
              }
            }
          }
        });
  }

  function processLinks(elements) {
    // data: keyed by type (item, action)
    var data = {};

    // Go through all the link elements!
    for (element of elements) {
      if (!element.matches(settings.iconSelector) && !settings.replaceText) {
        continue;
      }
      // Grab the metadata from the link URL.
      var [site, type, id] = getMetadata(element);
      // Initiate the type's array.
      if (typeof data[type] === 'undefined') {
        data[type] = [];
      }
      // Add an entry to that type.
      data[type].push({
        id: id,
        element: element,
      });
    }
    // Let's do a fetch request per type!
    for (var type in data) {
      var entries = data[type];

      if (!entries.length) {
        continue;
      }

      // Collect the entry IDs for the API request.
      var ids = [];
      for (var entry of entries) {
        if (ids.indexOf(entry.id) === -1) {
          ids.push(entry.id);
        }
      }

      requestLinkData(type, entries, ids);
    }
  };

  // Observe the document for new links.
  var obs = function (mutationsList, observer) {
    var nodes = [];
    for (var mutation of mutationsList) {
      for (node of mutation.addedNodes) {
        if (node instanceof HTMLElement && node.matches(settings.targetSelector)) {
          nodes.push(node);
        }
      }
    }
    processLinks(nodes);
  };

  var observer = new MutationObserver(obs);
  observer.observe(document.getElementsByTagName('body')[0], {
    childList: true,
    subtree: true
  });

  // Detect tooltip links.
  var links = document.querySelectorAll(settings.targetSelector);
  processLinks(links);
});