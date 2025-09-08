#!/bin/bash

# Fix all route references in E2E tests to use /auth instead of separate login/register routes

echo "Fixing E2E test route references..."

# Update all files in e2e directory
find /Users/troyedwards/dev/gamegen_nextjs/e2e -name "*.ts" -type f -exec sed -i.bak \
  -e 's|page\.goto("/login")|page.goto("/auth")|g' \
  -e 's|page\.goto("/register")|page.goto("/auth")|g' \
  -e 's|page\.goto("/signin")|page.goto("/auth")|g' \
  -e 's|page\.goto("/signup")|page.goto("/auth")|g' \
  -e 's|toHaveURL(/login|signin/)|toHaveURL(/auth/)|g' \
  -e 's|toHaveURL(/register|signup/)|toHaveURL(/auth/)|g' \
  -e 's|/\(login\|register\)/ { timeout:|/auth/ { timeout:|g' \
  {} \;

echo "Updated route references in E2E tests"

# Clean up backup files
find /Users/troyedwards/dev/gamegen_nextjs/e2e -name "*.bak" -delete

echo "Cleanup complete"