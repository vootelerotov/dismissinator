#!/bin/bash

# Build the TypeScript code first
npm run build

# Run the compiled version with the provided arguments
npm start -- vulnerabilities "$@"
