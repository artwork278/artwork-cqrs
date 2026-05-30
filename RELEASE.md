# Release

This package is published as a public scoped npm package.

## Preconditions

- The working tree is clean.
- `package.json` contains the target version.
- The npm account has publish access to the `@artworkdev` scope.
- GitHub Actions has an `NPM_TOKEN` secret with read/write publish
  permission for the `artworkdev` organization.

## Local checks

```bash
bun install --frozen-lockfile
bun run validate
bun run build
bun run pack:dry-run
bun run publish:dry-run
```

## Publish

Use the manual `Release` GitHub Actions workflow and pass the exact
`package.json` version.

For an emergency local publish:

```bash
bun run release:public
```
