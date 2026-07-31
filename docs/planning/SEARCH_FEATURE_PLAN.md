# Search Feature Plan

> **Project:** MiniFaceBook (Hizo)
> **Status:** Phase 1 local implementation complete; relevance/cursor/cache scale work remains planned
> **Scope:** Post search MVP, followed by public user discovery
> **Related policy:** [`PROFILE_PRIVACY_POLICY.md`](../guidelines/PROFILE_PRIVACY_POLICY.md)

## 1. Product Goal And Scope

Provide a fast, predictable way for an authenticated user to find relevant public posts from the Home search entry point. The existing header says `Tìm bài viết...` and is intentionally visible only on Home; the first release must preserve that contract.

The product must not promise an unrealistic fixed latency such as 1-5 ms. The user-facing goals are:

| Flow | Target SLO |
| --- | --- |
| Search suggestions, p95 | Under 150 ms from API receipt to response on a warm service |
| Full post results, p95 | Under 400 ms |
| API error rate | Below 1% excluding client cancellation |
| Suggestion result limit | At most 5 posts in the dropdown |

### In Scope: Phase 1

- Search public, non-deleted post text.
- Header suggestion dropdown on Home.
- Full `/search?q=...` page with `Tất cả` and `Bài viết` views. Both views show posts in Phase 1.
- Vietnamese-friendly normalization, URL-shareable query state, pagination, loading, empty and failure states.

### Phase 1 Implementation Status

- Implemented: Mongock text index, authenticated `/posts/search` and `/posts/search/suggestions`, 2-100 character normalization, Home suggestion dropdown and `/search?q=` page.
- Implemented: lightweight suggestion DTO without `myReactionType`/email, Mongo `$text` query, 5-result suggestion bound and integration coverage.
- Temporary implementation choice: conventional page pagination (`page`, `size`) is used instead of cursor pagination. Keep page depth bounded and migrate to cursor/search-after before deep-result scaling.
- Deferred: Redis search cache, advanced relevance ranking, user discovery and Atlas Search/OpenSearch evaluation.

### Deferred: Phase 2

- Public user discovery under a `Mọi người` tab.
- Search only public display name or a future public handle. Email is never searchable or returned.
- Search ranking beyond keyword relevance, including recency and engagement signals.

### Deferred: Scale Trigger

MongoDB text search is acceptable for the keyword-search MVP. Evaluate Atlas Search or OpenSearch when autocomplete, typo tolerance, synonym support, diacritic-aware ranking, complex filters, or measured p95 latency can no longer meet the SLO.

## 2. UX Flow

### Header Suggestions

1. The user focuses the Home search input and enters a query.
2. The client trims and normalizes the query. Queries with fewer than 2 meaningful characters do not issue a request.
3. After a 300 ms debounce, the client requests one lightweight suggestion endpoint.
4. The dropdown shows a maximum of 5 post snippets: author, highlighted excerpt, date and optional thumbnail.
5. `Enter` or `Xem tất cả kết quả cho "..."` navigates to `/search?q=<encoded-query>`.
6. `Escape`, click outside, route change, clearing the input, or a stale response closes the dropdown.

The dropdown must support keyboard navigation with Arrow Up/Down, Enter and Escape; it must have correct combobox/listbox semantics and keep focus in the input while navigating options.

### Search Page

- The URL is the source of truth: `/search?q=ca%20phe`.
- Invalid or empty `q` renders a search hint without calling the API.
- Results show the normalized query, loading skeleton, retryable error state and explicit empty state.
- A post result must use the same permitted interaction model as `PostCard`; a click on an excerpt opens the post context when a dedicated post permalink exists.
- Preserve results while a new page is loading to avoid visual flicker.

## 3. Query Contract And Edge Cases

### Normalization And Validation

The server owns validation. The client mirrors it only to avoid unnecessary requests.

1. Trim leading/trailing whitespace and collapse repeated internal whitespace.
2. Normalize Unicode to NFC before cache key generation and querying.
3. Require 2-100 Unicode code points after normalization.
4. Reject a missing, blank or overlong query with a validation response; do not silently execute a broad search.
5. Treat punctuation-only queries as no-result or validation errors according to the finalized product copy.
6. Never build an unescaped regex from user input.

The implementation and tests must cover Vietnamese diacritic variants, mixed casing, emoji, quotes, symbols, content containing only media, deleted posts, an author banned after indexing, concurrent post deletion and expired authentication.

### API: Suggestions

```http
GET /api/search/suggestions?q={query}
```

Response returns a fixed maximum of 5 post summaries. It does not return personalized reaction fields such as `myReactionType`.

```json
{
  "data": {
    "query": "ca phe",
    "posts": [
      {
        "id": "post-id",
        "authorId": "author-id",
        "authorName": "Nguyen Van A",
        "authorAvatar": "https://...",
        "excerpt": "...ca phe trung...",
        "createdAt": "2026-07-31T00:00:00Z"
      }
    ]
  }
}
```

One aggregate endpoint prevents two network round trips per keystroke. User suggestions may be added to this endpoint only in Phase 2 after privacy review.

### API: Full Post Results

```http
GET /api/posts/search?q={query}&cursor={opaque-cursor}&size=10
```

- `size` is constrained to 1-20.
- Use an opaque cursor based on the final deterministic sort tuple rather than deep offset pagination.
- Sort by relevance score, then `createdAt` descending, then `id` as a tie-breaker.
- Return `nextCursor` instead of requiring an expensive total count. A total can be omitted or marked approximate.
- The response may hydrate per-viewer fields after search IDs are resolved; it must not cache a full personalized `PostResponse` across viewers.

The original `page` contract may remain temporarily for a small MVP, but it must have a documented maximum depth and a migration path to cursor pagination.

## 4. Authorization, Privacy And Data Rules

Search is an authenticated operation. The backend applies the same visibility rules used by feed/profile APIs before returning any result.

- Exclude deleted posts and content from banned or deleted users.
- When per-post audience or block lists are introduced, filter them before ranking and before caching.
- Never expose email, roles, account timestamps or profile visibility settings in search responses.
- Phase 2 user discovery searches `name` and a future public handle only. It never indexes or searches `email`.
- Snippets are plain text. Highlighting must be generated safely; never inject raw post content or query HTML into the DOM.

## 5. Backend Design

### Persistence And Search Strategy

`findByContentContainingIgnoreCase...` is not MongoDB text search. It must not be described as an indexed full-text query.

For Phase 1, use MongoDB `$text` search deliberately:

- Add a single text index for searchable post content, with explicit weights if title or future fields are added.
- Use `TextCriteria` or an explicit `$text` query and project/sort by `textScore`.
- Combine the text query with `deleted != true` and the finalized authorization filters.
- Verify index creation and query plans in a staging-sized dataset before release.

MongoDB permits only one text index per collection and does not deliver Facebook-grade autocomplete or typo correction. Do not add `@TextIndexed` while keeping a `ContainingIgnoreCase` repository method and assume the index is used.

### Application Boundaries

- `PostSearchController`: validates request parameters and resolves the authenticated viewer.
- `PostSearchService`: normalizes input, applies authorization, coordinates search/cache and maps DTOs.
- `PostSearchRepository`: owns Mongo `$text` query and cursor boundary conditions.
- `PostSearchResponse`: a search-specific DTO. Do not reuse a full feed DTO for suggestions.

### Cache Strategy

Redis is optional for Phase 1 and must be introduced only with measurement proving it is needed.

If enabled:

- Cache only non-personalized IDs or public summary projections.
- Canonical key includes normalized query, search algorithm version, cursor/page, size and sort/filter version.
- Do not cache `myReactionType`, friendship state, viewer-specific visibility or any private profile data in a shared key.
- Use a short TTL with jitter, for example 60-120 seconds, to limit stale content and cache stampedes.
- Evict or version keys after post create/update/delete, author ban and future visibility changes.
- Record cache hit rate, eviction failures and query fallback latency.

## 6. Frontend Design

### Search State

- Create `searchService.ts` with `getSuggestions(query, signal)` and `searchPosts(query, cursor, signal)`.
- Use `AbortController` or a monotonic request ID so an older response cannot replace a newer query.
- Debounce input by 300 ms; cancel pending work when query is invalid, the component unmounts or the route changes.
- Cache recent normalized suggestions in memory for the current session only; do not persist search history without product/privacy approval.

### Components

- `HeaderSearch`: controlled input, suggestion state and accessible keyboard interaction.
- `SearchSuggestions`: presentation-only dropdown with a bounded result list.
- `SearchPage`: query parsing, tabs, cursor pagination and states for loading/error/empty results.
- Reuse existing friendship action components in Phase 2 rather than duplicating friendship state logic.

Mobile remains Home-only unless product requirements intentionally expand search to other routes. The mobile header search icon must navigate to or focus the same post-search flow, not a separate unimplemented feature.

## 7. Delivery Plan

### Phase 1: Post Search MVP

1. Finalize public post visibility rules and API DTOs.
2. Create Mongo text index and repository integration test.
3. Ship suggestions and full post search APIs without Redis cache.
4. Ship Home dropdown and `/search` page.
5. Measure SLOs in staging, then decide whether Redis is justified.

### Phase 2: Public User Discovery

1. Define public handle/name matching and ban/block behavior.
2. Perform a privacy review against `PROFILE_PRIVACY_POLICY.md`.
3. Add `Mọi người` tab and aggregate suggestions without email.

### Phase 3: Scale And Relevance

1. Add query analytics using hashed or redacted query values; do not log raw sensitive searches by default.
2. Add relevance experiments and monitors.
3. Migrate to Atlas Search/OpenSearch only when metrics justify the operational cost.

## 8. Verification Plan

### Automated Tests

- Unit tests: normalization, validation, cache-key construction and cursor encoding.
- Repository integration tests: text index use, deleted/banned filtering and deterministic ordering.
- Service/API tests: authorization, empty results, malformed cursor, query bounds and no email in user results.
- Cache tests: two users with different `myReactionType` must never receive each other's state.
- Playwright tests: debounce, cancellation of stale responses, Enter navigation, keyboard navigation, empty/error states and mobile Home behavior.
- Run `mvn clean test`, `npm run build` and the relevant Playwright project before merge.

### Performance And Operations

- Run a representative load test against a staging-sized dataset with cold and warm caches.
- Record p50/p95/p99 end-to-end latency, Mongo query time, error rate, cache hit rate and result count distribution.
- Add rate limiting appropriate for authenticated search and alert on error-rate or latency SLO breaches.
- Document index rollout, monitoring dashboard and rollback procedure before enabling the feature.

## 9. Completion Checklist

- [ ] Product scope confirms Post-only MVP and Phase 2 user discovery.
- [ ] Search contract, validation limits and visibility rules are approved.
- [ ] Text index and query implementation are verified with explain/query-plan evidence.
- [ ] Shared cache contains no viewer-specific data.
- [ ] Search is keyboard accessible and supports loading, empty and error states.
- [ ] API, integration, E2E and load verification meet the agreed SLO.
- [ ] Update `PROGRESS.md`, `ROADMAP.md`, `SESSION_HANDOFF.md`, `README.md` and CV highlights only after implementation is complete.
