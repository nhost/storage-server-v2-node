# hasura-storage

## Endpoints

### `/upload`

Upload file

### `/file/<pathname>`

Get file

### `/generate-signed-url/<pathname>

Generate signed URL

### `/file-signed/<pathname>?token=<token>`

Get file using a signed URL

## Environment Variables

- DATABASE_URL
- S3_ACCESS_KEY
- S3_SECRET_KEY
- S3_ENDPOINT
- GRAPHQL_ENDPOINT
- HASURA_GRAPHQL_ADMIN_SECRET
- JWT_SECRET
- ENCYPTION_SECRET
