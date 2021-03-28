# Thor SPARQL Editor

_A platform-agnostic, configurable, and brandable SPARQL editor and visualization interface._

## Features

 * Autocompletion of your entire ontology
 * Result visualizations modes including a table, an image grid, a pie chart and a map
 * Integration with your query library
 * Shareable queries
 * A resizable code editor
 * An interactive tour of the GUI
 * _...and plenty of others..._

## Configuration / Setup

In Thor you can configure:

 * the SPARQL endpoint
 * a custom query library endpoint
 * the name of your editor
 * the color scheme
 * the demo tour
 * autocompletion of classes, prefixes, properties, federated services, URIs

[An almost complete configuration example is available in this repository.](https://github.com/Abbe98/thor/blob/master/config/config.json)

Notes on configuration:

 * leaving `sparql_endpoint` out will enable the user to input their own endpoint.
 * leaving out `demo_tour` will disable the feature tour.
 * `header_brand_content` can take HTML code.
