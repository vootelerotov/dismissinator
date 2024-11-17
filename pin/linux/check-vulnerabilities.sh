#!/bin/bash

# Check if arguments are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <github-token> <github-org>"
    exit 1
fi

# Run the vulnerabilities command with provided arguments
npm run dev -- vulnerabilities -t "$1" -o "$2"
