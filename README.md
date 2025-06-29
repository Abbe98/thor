# Thor SPARQL Editor

_A platform-agnostic, configurable, and brandable SPARQL editor and visualization interface._

## Features

 - Autocompletion of your entire ontology
 - Result visualizations modes including; a table, an image grid, a pie chart, and a map
 - Integration with your query library
 - Shareable queries / URLs
 - A resizable code editor
 - An interactive tour of the GUI
 - A configurable color scheme
 - _...and plenty more..._

## Usage

Thor is a set of static files and all you need to get started is to serve it and a configuration file at `config/config.json`.

To create a configuration file you can start from an existing configuration or create on from scratch using the reference below.

Example configurations:

 - [FornPunkt](https://github.com/fornpunkt/sparql/blob/main/thor-configuration/config.json)
 - [TORA (National Archives of Sweden)](https://github.com/Riksarkivet/ra-sokprototyper/blob/main/thor/config.json)

The FornPunkt project does contain a full configuration for the Caddy webserver showing how to serve Thor and the necessary configuration files. You can also read more about deploying static files in the guides below:

 - [NGINX: Serving Static Content](https://docs.nginx.com/nginx/admin-guide/web-server/serving-static-content/)
 - [Caddy: Static files quick-start](https://caddyserver.com/docs/quick-starts/static-files)

Not that nothing is stopping you form serving Thor configuration from a non-static source. You can therefore dynamicly change your endpoint or provide an interface for updating the configuration if you want to.

## Configuration reference

### Struture

```json
{
    "sparql_endpoint": "",
    "query_library_endpoint": "",
    "title": "",
    "documentation_paragraphs": [],
    "demo_tour": {
        "demo_query": "",
        "demo_query_cursor_position": {
            "line": 1,
            "ch": 1
        }
    },
    "map_background": {
        "url_template": "",
        "attribution": ""
    },
    "enable_explore_graph": false,
    "color_scheme": {
        "main_brand": "",
        "main_brand_darkened": "",
        "secondary_brand": "",
        "secondary_brand_darkened": "",
        "main_text": "",
        "main_text_lighted": "",
        "secondary_text": "",
        "background": "",
        "background_shaded": "",
        "border": ""
    },
    "favicons": {
        "favicon_success": "",
        "favicon_error": "",
        "favicon_progess": ""
    },
    "autocomplete": {
        "classes": [],
        "prefixes": [],
        "properties": [],
        "services": [],
        "uris": []
    }
}
```

### `sparql_endpoint`

The SPARQL endpoint to use. If left out, the user will be able to input their own endpoint.

### `query_library_endpoint`

The endpoint to use for the query library. If left out, the query library will be disabled.

### `title`

The title of the editor.

### `documentation_paragraphs`

An array of strings which will be inserted as paragraphs at the start of the documentation modal.

### `demo_tour`

An object for the demo tour configuration. If left out, the demo tour will be disabled. Note that the `demo_query` and `demo_query_cursor_position` can be used to trigger/demo autocompletion features as if a real user would be typing.

 - `demo_query`: The query to use for the demo tour. Use `\n` for newlines.
 - `demo_query_cursor_position`: The cursor position to use for the demo tour.
    - `line`: The line number for the cursor position.
    - `ch`: The character number for the cursor position.

### `map_background`

Optional map background settings.

 - `url_template`: URL template for map tiles. [See URL template at leafletjs.com](https://leafletjs.com/reference.html#tilelayer).
 - `attribution`: String to use for map attribution, can take HTML.

### `enable_explore_graph`

Setting this to `true` enables the Explore Graph view.

### `autocomplete`

An object for the autocompletion configuration.

 - `classes`: An array of plain-class-URIs to autocomplete, `http://schema.org/CreativeWork` not `schema:CreativeWork`.
 - `prefixes`: An array of prefixes to autocomplete, following SPARQL format, `rdfs: <http://www.w3.org/2000/01/rdf-schema#>`, etc.
 - `properties`: An array of plain-property-URIs to autocomplete, `http://www.w3.org/2000/01/rdf-schema#label` not `rdfs:label`.
 - `services`: An array of federated endpoints to autocomplete, `http://dbpedia.org/sparql`, etc.
 - `uris`: An array of URIs to autocomplete.

### `color_scheme`

An object for the color scheme configuration. These are all exposed as `root` CSS variables so you can tweak the defaults in the browser's dev tools before adding them to the configuration.

 - `main_brand`
 - `main_brand_darkened`
 - `secondary_brand`
 - `secondary_brand_darkened`
 - `main_text`
 - `main_text_lighted`
 - `secondary_text`
 - `background`
 - `background_shaded`
 - `border`

## SPARQL magic-comments reference

Thor uses the same comment system as the Wikidata Query Service GUI to allow users to control the page title and default visualization.

### `defaultView`

The `defaultView` comment allows users to pick one of the following as the default result visualization: `Table`, `Map`, `PieChart`, and `ImageGrid`.

Example: `#defaultView:Map`

### `Title`

The `Title` comment sets the page title.

Example: `#title:My best query`

## URL parameter reference

### `config`

The `config` parameter allows a single Thor instance to use multiply configuirations. This parameter is only used if alternative configurations extists in the `config` directory. Note that the value of the parameter should be the configuration filename minus the file-suffix.

### `query` (URI fragment)

The `query` URI fragment can be set to populate the editor with text. The text should be URL encoded. Example: `#query=Hello%20World`

## Query libraries

A query library is a JSON file containing an array of queries. Each query is an object with the following properties:

 - `title`: The title of the query.
 - `tags`: An array of tags for the query.
 - `body`: The query body.

It's common to generate this JSON file from a code-snippet library or from induvidual SPARQL query files. [Here is an example, generating a library from `.rq` files using Python.](https://github.com/fornpunkt/sparql/tree/main#adding-queries-to-the-library)

### Example

```json
[
  {
    "title": "List users by the number of monuments registered with a given tag",
    "tags": [
      "monuments",
      "users",
      "tags"
    ],
    "body": "PREFIX schema: <http://schema.org/>\n\nSELECT ?creator (COUNT(?monument) AS ?monument_count) WHERE {\n  BIND(<https://fornpunkt.se/tagg/stensattning> AS ?tag)\n  ?monument schema:keywords ?tag ;\n        a schema:CreativeWork ;\n        schema:creator ?creator .\n}\nGROUP BY ?creator\nORDER BY DESC(?monument_count)\n"
  },
]
```

