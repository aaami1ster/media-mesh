Fix it (recommended): make Prisma client output local per service

```prisma
generator client {
  provider      = "prisma-client-js"
  output        = "../node_modules/@prisma/client"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

```bash
cd services/metadata-service

# clean old generated artifacts
rm -rf node_modules/.prisma node_modules/@prisma/client

# reinstall + regenerate for THIS service schema
npm i
npm run prisma:generate

# build again
npm run build
```