## 구현 범위 (1번 + 2번)

### 1. Upstage Information Extract 통합
`src/routes/api/analyze.ts`에 IE 단계를 추가합니다. Whisper 대본을 Upstage IE API에 사용자 정의 JSON 스키마와 함께 보내, 다음 구조화 데이터를 안정적으로 뽑습니다:

```
{
  target_audience: string,
  key_topics: string[],
  emotional_hooks: string[],     // 시청자의 감정 자극 포인트
  visual_moments: string[],      // 썸네일 후보가 될 만한 장면
  call_to_actions: string[],
  content_pillars: string[],     // 콘텐츠 핵심 기둥
  suggested_tags: string[]       // 추천 태그/해시태그
}
```

- 엔드포인트: `https://api.upstage.ai/v1/information-extraction`
- 기존 Solar 호출과 병렬로 실행 (Phase 3 단계에 추가)
- 실패해도 전체 분석은 계속 진행 (graceful degradation)
- 응답에 `extracted` 필드로 추가

결과 화면(`ResultsView`)에 "AI 추출 인사이트" 섹션을 새로 추가하여 카드/태그 형태로 시각화합니다.

### 2. Lovable Cloud 히스토리 저장

**Cloud 활성화** + 다음 테이블 생성:

```sql
analyses (
  id uuid pk,
  session_id text not null,    -- 클라이언트 UUID
  filename text,
  category text,
  score_total int,
  result jsonb,                  -- 전체 AnalysisResult
  extracted jsonb,               -- IE 결과
  created_at timestamptz
)
```

- 익명 사용을 위해 `session_id` 기반 (브라우저에 UUID 1개 저장)
- RLS: 본인 session_id만 읽기/쓰기 (anon role 허용)

**서버 함수** (`src/lib/history.functions.ts`):
- `saveAnalysis({ session_id, item })` — Cloud에 저장
- `listAnalyses({ session_id })` — 본인 분석 목록 조회

**클라이언트 변경** (`src/routes/index.tsx`):
- `loadHistory`/`saveHistory`를 서버 함수 호출로 교체
- IndexedDB 폴백은 오프라인/실패 시에만 사용
- 분석 완료 시 Cloud에 자동 저장
- HistoryView 로딩 상태 표시

### 기술 메모

- Upstage Information Extract는 `model: "information-extract"` + `response_format: { type: "json_schema", json_schema: { ... } }` 사용
- 기존 Solar 키 (`SOLAR_API_KEY`)와 동일한 Upstage 키 재사용 가능
- 클라이언트 session_id는 `localStorage`에 UUID 영구 저장
- 마이그레이션은 SQL로 생성, RLS는 anon에 허용 (auth 미구현 상태)

### 변경 파일

1. `supabase/migrations/<ts>_create_analyses.sql` (신규)
2. `src/routes/api/analyze.ts` (IE 단계 추가)
3. `src/lib/history.functions.ts` (신규)
4. `src/routes/index.tsx` (히스토리 로직 교체 + Insights 섹션 추가)
