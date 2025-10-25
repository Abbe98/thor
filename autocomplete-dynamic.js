/**
 * Thor Dynamic Autocomplete Utility
 *
 * Handles dynamic URI lookups for autocompletion via external APIs.
 * Supports URL templates and multiple response formats.
 * Caching is handled by the browser via HTTP cache headers from the server.
 */

const ThorDynamicAutocomplete = (function() {
  // Configuration with defaults
  let config = {
    requestTimeout: 5000 // 5 seconds default
  };

  // In-flight requests to prevent duplicate API calls
  const inflightRequests = new Map();

  /**
   * Normalize API response to standard format
   * Handles three formats:
   * 1. Array of strings: ["uri1", "uri2"]
   * 2. Array of objects with just value: [{value: "uri1"}]
   * 3. Array of rich objects: [{value: "uri1", label: "Label", description: "Desc"}]
   */
  function normalizeResponse(data) {
    if (!Array.isArray(data)) {
      console.warn('Thor Dynamic Autocomplete: API response is not an array', data);
      return [];
    }

    return data.map(item => {
      // Handle plain strings
      if (typeof item === 'string') {
        return item;
      }

      // Handle objects
      if (typeof item === 'object' && item !== null) {
        // For YASQE compatibility, we primarily need the value
        // Labels and descriptions could be used for enhanced UI in the future
        return item.value || '';
      }

      return '';
    }).filter(item => item !== ''); // Remove empty strings
  }

  /**
   * Configure the autocomplete utility
   */
  function configure(options) {
    if (options.requestTimeout) {
      config.requestTimeout = options.requestTimeout;
    }
  }

  /**
   * Fetch autocomplete suggestions from an API
   * Caching is handled by browser HTTP cache based on server cache headers
   */
  async function fetchSuggestions(urlTemplate, query) {
    // Build the URL by replacing {query} with the encoded query
    const url = urlTemplate.replace('{query}', encodeURIComponent(query));

    // Check if request is already in flight
    if (inflightRequests.has(url)) {
      return inflightRequests.get(url);
    }

    // Create the fetch promise with timeout
    const fetchPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.requestTimeout);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`Thor Dynamic Autocomplete: API returned ${response.status} for ${url}`);
          return [];
        }

        const data = await response.json();
        const normalized = normalizeResponse(data);

        return normalized;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`Thor Dynamic Autocomplete: Request timeout for ${url}`);
        } else {
          console.warn(`Thor Dynamic Autocomplete: Fetch error for ${url}:`, error.message);
        }
        return [];
      } finally {
        inflightRequests.delete(url);
      }
    })();

    // Store the in-flight request
    inflightRequests.set(url, fetchPromise);

    return fetchPromise;
  }

  return {
    configure,
    fetchSuggestions
  };
})();
