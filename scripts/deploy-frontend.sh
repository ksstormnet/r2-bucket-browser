#!/bin/bash
cd "$(dirname "$0")/../frontend"
npm install
npm run build
npx wrangler pages deploy build/
