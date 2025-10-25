# Thor Autocomplete API Specification

## Overview

This document specifies the API format for dynamic URI lookup services that can be used with Thor's autocompletion system. This allows Thor to query external services for suggestions instead of relying solely on static lists in `config.json`.

## Version

Version: 1.0
Last Updated: 2025-10-25

---

## Configuration Format

### Static Configuration (Backwards Compatible)

Thor supports static arrays in `config.json` (backwards compatible):

```json
{
  "autocomplete": {
    "classes": ["http://schema.org/Person", "http://schema.org/Place"],
    "prefixes": ["schema: <http://schema.org/>"],
    "properties": ["http://schema.org/name", "http://schema.org/description"],
    "services": ["http://dbpedia.org/sparql"],
    "uris": ["http://example.org/resource/1"]
  }
}
```

### Dynamic Configuration

With dynamic lookup support, each autocomplete type can accept a **URL template string** instead of an array:

```json
{
  "autocomplete": {
    "classes": "https://example.com/api/autocomplete/classes?query={query}",
    "properties": "https://example.com/api/autocomplete/properties?q={query}",
    "uris": "https://example.com/api/autocomplete/uris?search={query}"
  }
}
```

### Mixed Configuration

You can mix static arrays and dynamic URLs across different autocomplete types:

```json
{
  "autocomplete": {
    "classes": "https://example.com/api/autocomplete/classes?query={query}",
    "prefixes": ["schema: <http://schema.org/>"],
    "properties": ["http://schema.org/name", "http://schema.org/description"],
    "services": ["http://dbpedia.org/sparql"],
    "uris": "https://example.com/api/autocomplete/uris?search={query}"
  }
}
```

---

## URL Template Syntax

URL templates use `{query}` as a placeholder for the user's input.

### Examples

- `https://api.example.com/lookup?q={query}`
- `https://api.example.com/autocomplete/classes?query={query}&limit=10`
- `https://api.example.com/search?term={query}`

The `{query}` placeholder will be **URL-encoded** automatically before making the request.

### Query Processing

1. User types text in the editor (e.g., `Person`)
2. Thor constructs the URL by replacing `{query}` with the URL-encoded input
3. Request is made: `https://api.example.com/lookup?q=Person`

---

## API Request Specification

### HTTP Method

**GET** - All requests use the HTTP GET method.

### Request Headers

```http
Accept: application/json
```

### Query Parameters

The API receives the user's partial input via the query parameter specified in the URL template.

**Example Request:**

```
GET https://example.com/api/autocomplete/classes?query=Pers HTTP/1.1
Accept: application/json
```

---

## API Response Specification

### Response Format

APIs must return a **JSON array** of suggestion objects.

### Response Schema

```json
[
  {
    "value": "http://schema.org/Person",
    "label": "Person",
    "description": "A person (alive, dead, undead, or fictional)."
  },
  {
    "value": "http://xmlns.com/foaf/0.1/Person",
    "label": "foaf:Person",
    "description": "A person in FOAF vocabulary."
  }
]
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | string | **Yes** | The actual value to insert (full URI for classes/properties/uris, full prefix declaration for prefixes) |
| `label` | string | No | Human-readable label to display in the autocomplete dropdown (defaults to `value` if not provided) |
| `description` | string | No | Optional description/help text to show in autocomplete UI |

### Minimal Response (Value Only)

If you only provide values, Thor will use them as both the inserted value and display label:

```json
[
  {"value": "http://schema.org/Person"},
  {"value": "http://schema.org/Place"},
  {"value": "http://schema.org/Event"}
]
```

### Simplified Array Response

For simple use cases, APIs may return a **plain array of strings**:

```json
[
  "http://schema.org/Person",
  "http://schema.org/Place",
  "http://schema.org/Event"
]
```

Thor will automatically convert these to the object format internally.

---

## Response Examples by Type

### Classes

```json
[
  {
    "value": "http://schema.org/Person",
    "label": "schema:Person",
    "description": "A person (alive, dead, undead, or fictional)."
  },
  {
    "value": "http://schema.org/Organization",
    "label": "schema:Organization",
    "description": "An organization such as a school, NGO, corporation, club, etc."
  }
]
```

### Properties

```json
[
  {
    "value": "http://www.w3.org/2000/01/rdf-schema#label",
    "label": "rdfs:label",
    "description": "A human-readable name for the subject."
  },
  {
    "value": "http://schema.org/name",
    "label": "schema:name",
    "description": "The name of the item."
  }
]
```

### Prefixes

**Important:** Prefix values must include the full SPARQL prefix declaration format.

```json
[
  {
    "value": "schema: <http://schema.org/>",
    "label": "schema:",
    "description": "Schema.org vocabulary"
  },
  {
    "value": "foaf: <http://xmlns.com/foaf/0.1/>",
    "label": "foaf:",
    "description": "Friend of a Friend vocabulary"
  }
]
```

### Services

```json
[
  {
    "value": "http://dbpedia.org/sparql",
    "label": "DBpedia",
    "description": "DBpedia SPARQL endpoint"
  },
  {
    "value": "https://query.wikidata.org/sparql",
    "label": "Wikidata",
    "description": "Wikidata Query Service"
  }
]
```

### URIs

```json
[
  {
    "value": "http://www.wikidata.org/entity/Q5",
    "label": "Q5 (Human)",
    "description": "Any member of Homo sapiens"
  },
  {
    "value": "http://www.wikidata.org/entity/Q515",
    "label": "Q515 (City)",
    "description": "Large permanent human settlement"
  }
]
```

---

## Performance Recommendations

### Response Time

- Target response time: **< 200ms**
- Maximum acceptable: **< 500ms**
- Requests taking longer than 5 seconds will be cancelled by the client

### Result Limits

- Recommended: Return **10-20 results**
- Maximum: **50 results** (more may impact UI performance)

### Caching

Implement server-side caching where appropriate:
- Cache frequently requested queries
- Use short TTL (5-60 minutes) for dynamic data
- Use longer TTL (24 hours) for stable ontologies

### Rate Limiting

If implementing rate limiting, use standard HTTP status codes:
- `429 Too Many Requests` - Include `Retry-After` header

---

## Error Handling

### Error Response Format

When errors occur, return appropriate HTTP status codes. Thor will gracefully fall back to static suggestions or show no results.

### HTTP Status Codes

| Code | Meaning | Thor Behavior |
|------|---------|---------------|
| `200` | Success | Display results |
| `400` | Bad Request | Ignore, use static fallback |
| `404` | Not Found | Ignore, use static fallback |
| `429` | Too Many Requests | Ignore, use static fallback |
| `500` | Server Error | Ignore, use static fallback |
| `503` | Service Unavailable | Ignore, use static fallback |

### Error Response Body (Optional)

```json
{
  "error": "Invalid query parameter",
  "message": "Query must be at least 2 characters"
}
```

Thor will log errors to the browser console but continue functioning.

---

## Security Considerations

### CORS (Cross-Origin Resource Sharing)

APIs **must** support CORS if hosted on a different domain than Thor:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Allow-Headers: Accept
```

Or restrict to specific origins:

```http
Access-Control-Allow-Origin: https://your-thor-instance.com
```

### HTTPS

APIs **should** use HTTPS to protect data in transit.

### Input Validation

APIs should validate and sanitize the `query` parameter to prevent injection attacks.

### Rate Limiting

Implement rate limiting to prevent abuse:
- Per-IP limits
- Per-session limits (if authenticated)

---

## Implementation Examples

### Python (Flask)

```python
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/autocomplete/classes')
def autocomplete_classes():
    query = request.args.get('query', '').lower()

    # Sample data - replace with database query
    all_classes = [
        {
            "value": "http://schema.org/Person",
            "label": "schema:Person",
            "description": "A person"
        },
        {
            "value": "http://schema.org/Place",
            "label": "schema:Place",
            "description": "A place"
        }
    ]

    # Filter results
    results = [c for c in all_classes if query in c['label'].lower()]

    return jsonify(results[:20])

if __name__ == '__main__':
    app.run()
```

### Node.js (Express)

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/api/autocomplete/classes', (req, res) => {
  const query = (req.query.query || '').toLowerCase();

  // Sample data - replace with database query
  const allClasses = [
    {
      value: "http://schema.org/Person",
      label: "schema:Person",
      description: "A person"
    },
    {
      value: "http://schema.org/Place",
      label: "schema:Place",
      description: "A place"
    }
  ];

  // Filter results
  const results = allClasses
    .filter(c => c.label.toLowerCase().includes(query))
    .slice(0, 20);

  res.json(results);
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### PHP

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$query = strtolower($_GET['query'] ?? '');

// Sample data - replace with database query
$allClasses = [
    [
        'value' => 'http://schema.org/Person',
        'label' => 'schema:Person',
        'description' => 'A person'
    ],
    [
        'value' => 'http://schema.org/Place',
        'label' => 'schema:Place',
        'description' => 'A place'
    ]
];

// Filter results
$results = array_filter($allClasses, function($class) use ($query) {
    return strpos(strtolower($class['label']), $query) !== false;
});

// Limit to 20 results
$results = array_slice($results, 0, 20);

echo json_encode(array_values($results));
```

---

## Testing Your API

### Manual Testing

Test your API with curl:

```bash
curl "https://example.com/api/autocomplete/classes?query=Pers" \
  -H "Accept: application/json"
```

Expected response:
```json
[
  {
    "value": "http://schema.org/Person",
    "label": "schema:Person",
    "description": "A person"
  }
]
```

### Testing with Thor

1. Update your `config.json`:
   ```json
   {
     "autocomplete": {
       "classes": "https://example.com/api/autocomplete/classes?query={query}"
     }
   }
   ```

2. Open Thor in your browser
3. Start typing a class name in the SPARQL editor
4. Watch the browser's Network tab to see API requests
5. Verify autocomplete suggestions appear

### Testing Checklist

- [ ] API returns valid JSON
- [ ] CORS headers are present
- [ ] Response time is under 500ms
- [ ] Results are properly filtered by query
- [ ] Empty query returns sensible results
- [ ] Special characters are handled correctly
- [ ] Error responses don't break Thor

---

## Changelog

### Version 1.0 (2025-10-25)

- Initial specification
- Support for URL template format
- Support for hybrid static/dynamic configuration
- Defined request/response formats
- Added implementation examples
