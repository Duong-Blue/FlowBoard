# MCP Client Contract

## Overview
Standardized API interaction for all MCP tools.

## Core Principles
- **No Direct Fetch**: All HTTP requests MUST use pre-defined adapters. Direct `fetch` bypasses auth interceptors and error handling.
- **Typed Adapters**: Use `src/adapters/` for all domain-specific API calls.
- **Error Handling**: Catch `ApiError` consistently.

## Authentication
- Handled globally by `api_helper`.
- Do not pass tokens manually in headers.

## Pagination & Security
- Follow standard pagination structures provided by the API.
- Never log raw request bodies containing sensitive auth tokens.

## Implementation Guide
Example:
```typescript
// Good: Use adapter
const projects = await projectAdapter.getAll();

// Bad: Direct fetch
const res = await fetch('/api/projects');
```
