const info = {
  description: 'Express.js API Boilerplate - Template untuk pengembangan REST API dengan fitur lengkap',
  version: '1.0.0',
  title: 'Express.js API Boilerplate Documentation',
  contact: {
    email: 'your-email@example.com'
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT'
  }
}

const servers = [
  {
    url: '/api/netsuite/',
    description: 'Development server'
  },
  {
    url: 'https://gateway.motorsights.com/api/netsuite',
    description: 'Production server'
  },
  {
    url: 'https://dev-gateway.motorsights.com/api/netsuite',
    description: 'Develop server'
  }
]

// Import schemas
// Tambahkan schema module Anda di sini
const commonSchema = require('./schema/common');
// const exampleSchema = require('./schema/example');
const authSchema = require('./schema/auth');
const purchasingOrdersSchema = require('./schema/purchasing_orders');
const componenSchema = require('./schema/componen');

// Import paths
// Tambahkan path module Anda di sini
// const examplePaths = require('./path/example');
const authPaths = require('./path/auth');
const purchasingOrdersPaths = require('./path/purchasing_orders');
const componenPaths = require('./path/componen');

// Combine all schemas
const schemas = {
  ...commonSchema,
  // ...exampleSchema,
  ...authSchema,
  ...purchasingOrdersSchema,
  ...componenSchema,
  // ...yourModuleSchema,
};

// Combine all paths
const paths = {
  // ...examplePaths,
  ...authPaths,
  ...purchasingOrdersPaths,
  ...componenPaths,
  // ...yourModulePaths,
};

const index = {
  openapi: '3.0.0',
  info,
  servers,
  paths,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas
  }
}

module.exports = {
  index
}
