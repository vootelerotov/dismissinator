#!/bin/bash

# Check if environment variables are set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is not set"
    exit 1
fi

if [ -z "$GITHUB_ORG" ]; then
    echo "Error: GITHUB_ORG environment variable is not set"
    exit 1
fi

# Run the vulnerabilities command
npm run dev -- vulnerabilities -t "$GITHUB_TOKEN" -o "$GITHUB_ORG"
