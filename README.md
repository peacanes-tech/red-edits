# red-edits

AI 에이전트가 문서를 작성·수정할 때, **에이전트가 바꾸거나 새로 채운 글자를 빨간색으로 표시**하는 에이전트 스킬입니다.
검토자가 AI가 손댄 부분만 한눈에 확인할 수 있습니다.

- 지원 형식: HWP / HWPX, Word(.docx), Excel(.xlsx), HTML, Markdown
- HWP는 번들 스크립트 `scripts/hwp-redline.mjs` (엔진: [@rhwp/core](https://www.npmjs.com/package/@rhwp/core))로 글자색을 입힙니다. 표 셀 안도 지원합니다.
- 원본은 덮어쓰지 않고, 삭제한 글자는 작업 보고에 따로 적습니다.

## 설치 ([skills.sh](https://skills.sh))

```bash
npx skills add peacanes-tech/red-edits
```

HWP 기능을 쓰려면 설치된 스킬 폴더에서 한 번 의존성을 설치하세요 (Node.js 18+):

```bash
cd <설치된 스킬 폴더>/scripts && npm install
```

## 사용 예

- "이 계약서 날짜 2027년으로 바꿔줘" → 바뀐 날짜만 빨간색
- "전기사용신청서 작성해줘" → 항목명은 검정, 채운 값은 빨간색

HWP 스크립트 직접 실행:

```bash
node scripts/hwp-redline.mjs 편집본.hwp 결과.hwp --find "바뀐 문구"
node scripts/hwp-redline.mjs 편집본.hwp 결과.hwp --ranges ranges.json
```

자세한 규칙은 [skills/red-edits/SKILL.md](skills/red-edits/SKILL.md)를 참고하세요.

## License

MIT
