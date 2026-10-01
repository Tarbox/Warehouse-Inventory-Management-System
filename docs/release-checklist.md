# v1.0.0 Release Checklist

Run this checklist from a fresh clone after the final code changes are merged.

## 1. Audit history before publishing

The repository previously contained a tracked local cookie file. Remove it from all Git history before making the repository public.

Use a fresh mirror clone:

```bash
git clone --mirror git@github.com:Tarbox/warehouse-inventory.git
cd warehouse-inventory.git
```

Install `git-filter-repo` and remove local-only artifacts:

```bash
git filter-repo --path backend/cookies.txt   --path backend/.agents   --path backend/.claude   --path backend/.windsurf   --path backend/skills-lock.json   --path frontend/AGENTS.md   --path frontend/CLAUDE.md   --invert-paths
```

Inspect the rewritten history, then force-update the remote:

```bash
git push --force --mirror origin
```

After the rewrite, search the complete history again for `warehouse_session`, credentials, private keys, tokens, and local agent artifacts.

## 2. Fresh clone

```bash
cd ..
rm -rf warehouse-inventory
git clone https://github.com/Tarbox/warehouse-inventory.git
cd warehouse-inventory
```

## 3. Development environment

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

Open `http://localhost:8080`.

## 4. Tests

```bash
docker compose -f docker-compose.test.yml up -d
cp backend/.env.test.example backend/.env.test

cd backend
npx prisma migrate deploy
npm test

cd ../frontend
npm run lint
npm run typecheck
npm run build
```

## 5. Release tag

Return to the repository root and verify the working tree is clean:

```bash
git status
git tag --list
```

Create and push the release tag:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## 6. Publish

Only after the history audit and clean-clone verification are complete, change the repository visibility to Public.

GitHub: **Settings → Danger Zone → Change repository visibility → Public**.

GitHub CLI:

```bash
gh repo edit Tarbox/warehouse-inventory \
  --visibility public \
  --accept-visibility-change-consequences
```

## 7. Post-release verification

Verify:

```bash
git remote -v
git describe --tags --abbrev=0
git ls-remote --tags origin
```

Then open the public repository in a private browser window and confirm the README, license, SECURITY policy, architecture docs, CI status, and v1.0.0 tag are visible.
