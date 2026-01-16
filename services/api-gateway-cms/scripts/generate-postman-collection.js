#!/usr/bin/env node

/**
 * Generate Postman Collection from Swagger/OpenAPI documentation
 * 
 * Usage: node scripts/generate-postman-collection.js
 * 
 * This script fetches the Swagger JSON from the running API Gateway
 * and converts it to a Postman collection.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:8081';
const OUTPUT_FILE = path.join(__dirname, '../postman-collection.json');

async function fetchSwaggerJson() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}/api/docs-json`);
    const client = url.protocol === 'https:' ? https : http;

    client
      .get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error(`Failed to parse Swagger JSON: ${error.message}`));
            }
          } else {
            reject(new Error(`Failed to fetch Swagger JSON: ${res.statusCode}`));
          }
        });
      })
      .on('error', (error) => {
        reject(new Error(`Failed to fetch Swagger JSON: ${error.message}`));
      });
  });
}

function convertToPostmanCollection(swaggerJson) {
  const collection = {
    info: {
      name: swaggerJson.info.title || 'MediaMesh CMS API Gateway',
      description: swaggerJson.info.description || '',
      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _exporter_id: 'mediamesh-api-gateway',
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{jwt_token}}',
          type: 'string',
        },
      ],
    },
    variable: [
      {
        key: 'base_url',
        value: API_URL,
        type: 'string',
      },
      {
        key: 'jwt_token',
        value: '',
        type: 'string',
      },
    ],
    item: [],
  };

  // Group endpoints by tags
  const endpointsByTag = {};

  Object.entries(swaggerJson.paths || {}).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const tag = operation.tags?.[0] || 'Default';
      if (!endpointsByTag[tag]) {
        endpointsByTag[tag] = [];
      }

      const postmanItem = {
        name: operation.summary || operation.operationId || `${method} ${path}`,
        request: {
          method: method.toUpperCase(),
          header: [],
          url: {
            raw: `{{base_url}}${path}`,
            host: ['{{base_url}}'],
            path: path.split('/').filter(Boolean),
          },
          description: operation.description || '',
        },
        response: [],
      };

      // Add authentication
      if (operation.security && operation.security.length > 0) {
        postmanItem.request.auth = {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: '{{jwt_token}}',
              type: 'string',
            },
          ],
        };
      }

      // Add parameters
      if (operation.parameters) {
        operation.parameters.forEach((param) => {
          if (param.in === 'header') {
            postmanItem.request.header.push({
              key: param.name,
              value: param.example || '',
              description: param.description || '',
            });
          } else if (param.in === 'query') {
            if (!postmanItem.request.url.query) {
              postmanItem.request.url.query = [];
            }
            postmanItem.request.url.query.push({
              key: param.name,
              value: param.example || '',
              description: param.description || '',
              disabled: !param.required,
            });
          } else if (param.in === 'path') {
            // Path parameters are handled in the URL path
          }
        });
      }

      // Add request body
      if (operation.requestBody) {
        const content = operation.requestBody.content;
        const contentType = Object.keys(content)[0];
        const schema = content[contentType]?.schema;

        postmanItem.request.body = {
          mode: 'raw',
          raw: JSON.stringify(generateExampleFromSchema(schema), null, 2),
          options: {
            raw: {
              language: 'json',
            },
          },
        };

        postmanItem.request.header.push({
          key: 'Content-Type',
          value: contentType,
        });
      }

      // Add response examples
      if (operation.responses) {
        Object.entries(operation.responses).forEach(([statusCode, response]) => {
          if (response.content && response.content['application/json']) {
            const schema = response.content['application/json'].schema;
            postmanItem.response.push({
              name: `${statusCode} ${response.description || ''}`,
              originalRequest: {
                method: method.toUpperCase(),
                header: [],
                url: {
                  raw: `{{base_url}}${path}`,
                  host: ['{{base_url}}'],
                  path: path.split('/').filter(Boolean),
                },
              },
              status: statusCode,
              code: parseInt(statusCode),
              _postman_previewlanguage: 'json',
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json',
                },
              ],
              body: JSON.stringify(
                generateExampleFromSchema(schema),
                null,
                2,
              ),
            });
          }
        });
      }

      endpointsByTag[tag].push(postmanItem);
    });
  });

  // Convert to Postman folder structure
  Object.entries(endpointsByTag).forEach(([tag, items]) => {
    collection.item.push({
      name: tag,
      item: items,
    });
  });

  return collection;
}

function generateExampleFromSchema(schema) {
  if (!schema) return {};

  if (schema.example) {
    return schema.example;
  }

  if (schema.type === 'object' && schema.properties) {
    const example = {};
    Object.entries(schema.properties).forEach(([key, prop]) => {
      if (prop.example !== undefined) {
        example[key] = prop.example;
      } else if (prop.type === 'string') {
        example[key] = `example_${key}`;
      } else if (prop.type === 'number' || prop.type === 'integer') {
        example[key] = 0;
      } else if (prop.type === 'boolean') {
        example[key] = true;
      } else if (prop.type === 'array') {
        example[key] = [];
      } else if (prop.type === 'object') {
        example[key] = generateExampleFromSchema(prop);
      }
    });
    return example;
  }

  return {};
}

async function main() {
  try {
    console.log(`Fetching Swagger JSON from ${API_URL}/api/docs-json...`);
    const swaggerJson = await fetchSwaggerJson();

    console.log('Converting to Postman collection...');
    const collection = convertToPostmanCollection(swaggerJson);

    console.log(`Writing collection to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(collection, null, 2));

    console.log('✅ Postman collection generated successfully!');
    console.log(`📁 Collection saved to: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Error generating Postman collection:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchSwaggerJson, convertToPostmanCollection };
