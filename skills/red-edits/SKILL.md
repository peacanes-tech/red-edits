---
name: red-edits
description: Claude가 문서를 작성·수정할 때 Claude가 바꾸거나 새로 채운 글자를 빨간색으로 표시한다. HWP/HWPX, Word(.docx), Excel(.xlsx), HTML, Markdown 문서를 편집하거나 서식·신청서를 채울 때 항상 적용한다. "수정한 부분 빨간색", "바뀐 곳 표시", "레드라인", "red edits" 요청에도 사용.
---

# red-edits — Claude가 수정한 부분은 빨간 글자

사용자가 문서를 검토할 때 **Claude가 손댄 곳만 한눈에 보이도록**, 편집 결과물에서 Claude가 추가·변경한 텍스트의 글자색을 빨간색(`#FF0000`)으로 바꾼다.

## 규칙

1. **칠하는 대상**: Claude가 새로 넣거나 바꾼 글자만. 원래 있던 글자, 양식의 항목명(라벨)은 원래 색 그대로 둔다.
   - 빈 양식/신청서를 채우는 경우: 채워 넣은 값만 빨간색, 항목명은 검정.
   - 문서를 처음부터 새로 만드는 경우: 사용자가 준 내용이 아닌, Claude가 지어낸/작성한 내용을 빨간색.
2. **삭제한 글자**는 색으로 표시할 수 없으므로 작업 후 보고에 "삭제: ○○" 형태로 적는다.
3. 원본은 덮어쓰지 않는다. 결과는 새 파일(예: `원본명_수정.hwp`)로 저장한다.
4. 작업 후 보고에 칠한 구간 개수와 결과 파일 경로를 적는다.
5. 사용자가 다른 색을 원하면 그 색을 쓴다.

## 형식별 방법

### HWP / HWPX — `scripts/hwp-redline.mjs`
`rhwp-edit` 스킬(k-skill-rhwp)로 내용을 편집한 **뒤**, 결과 파일에 색을 입힌다. 결과는 항상 `.hwp`로 저장된다.

아래에서 `<SKILL_DIR>` 는 이 SKILL.md 가 있는 폴더(설치 위치에 따라 `~/.claude/skills/red-edits`, `.claude/skills/red-edits`, `.agents/skills/red-edits` 등)를 뜻한다.

처음 한 번 의존성 설치 (`<SKILL_DIR>/scripts/node_modules` 가 없을 때, Node.js 18+ 필요):
```bash
cd "<SKILL_DIR>/scripts" && npm install
```

```bash
# 바뀐 문구로 찾아서 칠하기 (본문 문단 대상, 여러 번 지정 가능)
node "<SKILL_DIR>/scripts/hwp-redline.mjs" 편집본.hwp 결과.hwp --find "2027년 1월 1일" --find "홍길동"

# 좌표로 칠하기 (표 셀 안이거나, 같은 문구가 원래 다른 곳에도 있을 때)
node "<SKILL_DIR>/scripts/hwp-redline.mjs" 편집본.hwp 결과.hwp --ranges ranges.json
```
`ranges.json`:
```json
[
  { "section": 0, "paragraph": 3, "start": 5, "end": 12 },
  { "section": 0, "parentParagraph": 2, "control": 0, "cell": 4, "cellParagraph": 0, "start": 0, "end": 6 }
]
```
- `start`/`end`는 문단(또는 셀 문단) 안 글자 위치, `end`는 미포함. rhwp-edit 명령의 반환값(`charOffset` 등)과 삽입한 글자 수로 계산한다.
- `--find`는 원래 문서에도 있던 같은 문구까지 칠하므로, 원문에 없던 문구일 때만 쓴다. 아니면 `--ranges`.
- Windows Git Bash에서는 `~`나 `/c/...` 경로가 Node에 잘못 전달될 수 있다(특히 경로에 `'` 등 특수문자가 있을 때). 스크립트와 파일 경로는 `C:/...` 형식(`pwd -W`)의 절대경로로 넘긴다.
- 칠한 곳이 0개면 exit code 1 — 문구/좌표를 다시 확인한다.

### Word (.docx)
python-docx: 바뀐 텍스트를 별도 run으로 분리하고 `run.font.color.rgb = RGBColor(0xFF, 0, 0)`.
XML 직접 편집 시: 해당 `<w:r>`의 `<w:rPr>`에 `<w:color w:val="FF0000"/>`.

### Excel (.xlsx)
openpyxl: 바뀐 셀에 `cell.font = cell.font.copy(color="FFFF0000")` (기존 글꼴 유지). 셀 일부만 바뀌었으면 `CellRichText`/`TextBlock`으로 그 부분만 빨간색.

### HTML
`<span style="color:#FF0000">바뀐 글자</span>`

### Markdown
`<span style="color:red">바뀐 글자</span>` (HTML을 렌더링하는 뷰어 기준). 렌더링이 안 되는 곳이면 보고에 수정 목록을 따로 적는다.

## 적용하지 않는 경우
- 소스 코드, 설정 파일 등 글자색 개념이 없는 파일 — 대신 보고에 변경 요약을 적는다.
- 사용자가 "색 없이", "최종본으로" 등 표시를 원하지 않는다고 할 때.
