# Verifying Published Package Matches Your Code

## What Gets Published

Based on your `package.json` `files` field, only these files are published:
- `index.js` - Your main MCP server code
- `README.md` - Documentation
- `package.json` - Package metadata (automatically included)

## Verify Before Publishing

1. **Check what will be published:**
   ```bash
   npm pack --dry-run
   ```

2. **Test the package locally:**
   ```bash
   npm pack
   tar -xzf postgres-mysql-mcp-server-*.tgz
   # Inspect the package/ directory
   ```

3. **Compare published vs local:**
   ```bash
   # Download published package
   cd /tmp
   npm pack postgres-mysql-mcp-server
   tar -xzf postgres-mysql-mcp-server-*.tgz
   
   # Compare files
   diff package/index.js /path/to/your/local/index.js
   diff package/README.md /path/to/your/local/README.md
   ```

## Publishing Process

1. **Update version in package.json:**
   ```bash
   npm version patch  # or minor, major
   ```

2. **Create and push tag:**
   ```bash
   git push && git push --tags
   ```

3. **The GitHub Actions workflow will automatically:**
   - Trigger on tag push (v*)
   - Install dependencies
   - Publish to npm with provenance

## Troubleshooting

If the published package doesn't match your code:

1. **Check the version:**
   ```bash
   npm view postgres-mysql-mcp-server version
   ```

2. **Verify files field in package.json:**
   ```json
   "files": [
     "index.js",
     "README.md"
   ]
   ```

3. **Check GitHub Actions logs:**
   - Go to your repository → Actions
   - Check the latest workflow run
   - Verify it completed successfully

4. **Manual verification:**
   ```bash
   npm install postgres-mysql-mcp-server
   # Check node_modules/postgres-mysql-mcp-server/
   ```

## Important Notes

- Only files listed in `package.json` `files` array are published
- `package.json` is always included automatically
- `node_modules` and other files are excluded
- The workflow publishes exactly what's in your repository at the tag

