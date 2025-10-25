/**
 * Thor Dynamic Autocomplete Utility
 *
 * Handles dynamic URI lookups for autocompletion via external APIs.
 * Supports caching, URL templates, and multiple response formats.
 */

const ThorDynamicAutocomplete = (function() {
  // Cache for API responses (query -> results)
  // Using a simple time-based cache with 5-minute TTL
  const cache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  const REQUEST_TIMEOUT = 5000; // 5 seconds

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
   * Fetch autocomplete suggestions from an API
   */
  async function fetchSuggestions(urlTemplate, query) {
    // Build the URL by replacing {query} with the encoded query
    const url = urlTemplate.replace('{query}', encodeURIComponent(query));

    // Check cache first
    const cacheKey = url;
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.data;
    }

    // Check if request is already in flight
    if (inflightRequests.has(cacheKey)) {
      return inflightRequests.get(cacheKey);
    }

    // Create the fetch promise with timeout
    const fetchPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

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

        // Cache the result
        cache.set(cacheKey, {
          data: normalized,
          timestamp: Date.now()
        });

        return normalized;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`Thor Dynamic Autocomplete: Request timeout for ${url}`);
        } else {
          console.warn(`Thor Dynamic Autocomplete: Fetch error for ${url}:`, error.message);
        }
        return [];
      } finally {
        inflightRequests.delete(cacheKey);
      }
    })();

    // Store the in-flight request
    inflightRequests.set(cacheKey, fetchPromise);

    return fetchPromise;
  }

  /**
   * Clear the cache (useful for testing or manual refresh)
   */
  function clearCache() {
    cache.clear();
  }

  /**
   * Get cache statistics (useful for debugging)
   */
  function getCacheStats() {
    return {
      size: cache.size,
      keys: Array.from(cache.keys())
    };
  }

  return {
    fetchSuggestions,
    clearCache,
    getCacheStats
  };
})();
