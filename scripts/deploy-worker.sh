#!/bin/bash
cd "$(dirname "$0")/../worker"
npm install
npx wrangler deploy
