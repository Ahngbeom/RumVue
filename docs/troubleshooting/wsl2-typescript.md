# WSL2 TypeScript Configuration Guide

## Problem

When developing a TypeScript/Nuxt project on WSL2 (Windows Subsystem for Linux), you may encounter a case-sensitivity error:

```
File name 'g:/MyToyProjects/RumVue/node_modules/vue/dist/vue.d.ts' differs from already
included file name 'g:/mytoyprojects/rumvue/node_modules/vue/dist/vue.d.ts' only in casing.
```

## Root Cause

This error occurs due to the fundamental difference between Windows and Linux file systems:

1. **Windows File System**: Case-insensitive
   - `G:\MyToyProjects\RumVue` and `g:\mytoyprojects\rumvue` are treated as the same path

2. **Linux/WSL2 File System**: Case-sensitive
   - `/mnt/g/MyToyProjects/RumVue` and `/mnt/g/mytoyprojects/rumvue` are different paths

3. **TypeScript's `forceConsistentCasingInFileNames`**: Enabled by default in strict mode
   - Enforces that all references to a file use consistent casing
   - Treats different casing as different files

### When This Happens

The error typically occurs when:
- VSCode (Windows) accesses files using Windows path format: `G:\MyToyProjects\RumVue`
- TypeScript language server in WSL2 sees: `/mnt/g/MyToyProjects/RumVue`
- Module resolution creates references with inconsistent casing
- TypeScript detects the same file referenced with different casing

## Solution

### 1. Configure VSCode Settings

Create or update `.vscode/settings.json`:

```json
{
  // Use project's TypeScript version
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,

  // Ensure consistent file path casing
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/.nuxt/**": true,
    "**/.output/**": true
  },

  // Use WSL as the default terminal
  "terminal.integrated.defaultProfile.windows": "WSL",

  // Vue/Volar specific settings
  "volar.tsdk": "node_modules/typescript/lib",
  "volar.typescript.tsdk": "node_modules/typescript/lib"
}
```

### 2. Install TypeScript as Dev Dependency

Ensure consistent TypeScript version across the project:

```bash
npm install --save-dev typescript vue-tsc
```

### 3. Add Typecheck Script

Add to `package.json`:

```json
{
  "scripts": {
    "typecheck": "nuxi typecheck"
  }
}
```

### 4. Clean and Regenerate Nuxt Configuration

After changes, clean the generated files:

```bash
rm -rf .nuxt
npx nuxi prepare
npm run typecheck
```

## Prevention

### Best Practices for WSL2 Development

1. **Always use consistent casing in paths**
   - Use the exact casing as it appears in the file system
   - Example: If the folder is `MyToyProjects`, always use that casing

2. **Use Remote-WSL extension in VSCode**
   - Install "Remote - WSL" extension
   - Open project directly in WSL: `code .` from WSL terminal
   - This ensures VSCode and TypeScript use the same file system layer

3. **Configure Git for case sensitivity**
   ```bash
   git config core.ignorecase false
   ```

4. **Store projects in WSL filesystem** (recommended)
   - Instead of `/mnt/g/MyToyProjects/RumVue` (Windows drive)
   - Use `~/projects/RumVue` (WSL home directory)
   - This avoids the Windows/Linux filesystem boundary entirely
   - Better performance and no case-sensitivity issues

5. **Use WSL-native paths in imports**
   - Rely on Nuxt's path aliases: `@/`, `~/`, `#app/`
   - Let Nuxt handle path resolution

## Verification

After applying the fix, verify everything works:

```bash
# Type checking
npm run typecheck

# Build
npm run build

# Development
npm run dev
```

## Additional Resources

- [Nuxt TypeScript Documentation](https://nuxt.com/docs/guide/concepts/typescript)
- [WSL Best Practices](https://learn.microsoft.com/en-us/windows/wsl/filesystems)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig#forceConsistentCasingInFileNames)

## Troubleshooting

### Error persists after applying fix

1. **Restart VSCode TypeScript server**
   - Open Command Palette: `Ctrl+Shift+P`
   - Run: "TypeScript: Restart TS Server"

2. **Clear all caches**
   ```bash
   rm -rf .nuxt .output node_modules/.cache
   npm run postinstall
   ```

3. **Verify VSCode is using WSL**
   - Check bottom-left corner of VSCode
   - Should show: "WSL: Ubuntu" (or your distro)

4. **Check for case-sensitive issues in imports**
   ```bash
   # Find all TypeScript/Vue files
   find app -type f \( -name "*.ts" -o -name "*.vue" \) -exec grep -l "import.*from" {} \;
   ```

### Project won't start after changes

If the dev server fails to start:

```bash
# Full clean and reinstall
rm -rf node_modules package-lock.json .nuxt .output
npm install
npx nuxi prepare
npm run dev
```
