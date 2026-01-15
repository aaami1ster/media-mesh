# Removing Secrets from Git History

GitHub detected OpenAI API keys in `ecosystem.config.js` in commit `4de931b`. Follow these steps to remove them from git history.

## Option 1: Remove File from History (Recommended)

Since the file was already removed in a later commit, we need to remove it from the entire git history:

```bash
# Install git-filter-repo (if not installed)
# macOS: brew install git-filter-repo
# Or use: pip install git-filter-repo

# Remove ecosystem.config.js from entire git history
git filter-repo --path ecosystem.config.js --invert-paths

# Force push (WARNING: This rewrites history)
git push origin dev --force
```

## Option 2: Use BFG Repo-Cleaner (Alternative)

```bash
# Download BFG Repo-Cleaner
# https://rtyley.github.io/bfg-repo-cleaner/

# Remove the file from history
java -jar bfg.jar --delete-files ecosystem.config.js

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin dev --force
```

## Option 3: Manual Commit Amendment (If it's the last commit)

If the commit with secrets is the most recent one:

```bash
# Remove the file from the commit
git rm --cached ecosystem.config.js
git commit --amend --no-edit

# Force push
git push origin dev --force
```

## After Removing Secrets

1. **Verify the file is ignored**: Check `.gitignore` includes `ecosystem.config.js` ✅ (already done)

2. **Create local config**: Copy the example file:
   ```bash
   cp ecosystem.config.example.js ecosystem.config.js
   ```

3. **Add your secrets locally**: Edit `ecosystem.config.js` with your actual secrets (this file is now ignored by git)

4. **Never commit secrets again**: Always use environment variables or `.env` files (which are also in `.gitignore`)

## Best Practice Going Forward

- Use environment variables instead of hardcoding secrets
- Store secrets in `.env` files (already in `.gitignore`)
- Use `ecosystem.config.example.js` as a template
- Never commit files with real API keys or passwords

## If Secrets Were Already Exposed

If the secrets were already pushed to GitHub:
1. **Rotate the API keys immediately** - Generate new keys from OpenAI
2. **Remove from git history** (using methods above)
3. **Update your local config** with new keys
