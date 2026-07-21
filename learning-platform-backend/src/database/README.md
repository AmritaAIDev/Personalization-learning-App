# Database configuration

All schema changes are represented by TypeORM migrations. Runtime and CLI
connections keep `synchronize: false`. When TLS is enabled, legacy PostgreSQL
URL aliases such as `sslmode=require` are normalized to `verify-full`, matching
the application's certificate-verification policy without exposing credentials
in source code.
