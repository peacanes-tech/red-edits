#!/usr/bin/env node
// HWP/HWPX 문서의 지정 구간 글자색을 빨간색으로 바꿔 새 .hwp 파일로 저장한다.
//
// 사용법:
//   node hwp-redline.mjs <input> <output.hwp> --find "바뀐 문구" [--find "다른 문구" ...] [--color "#FF0000"]
//   node hwp-redline.mjs <input> <output.hwp> --ranges ranges.json [--color "#FF0000"]
//
// ranges.json 예시 (offset은 문단 내 글자 위치, end는 미포함):
//   [ { "section": 0, "paragraph": 3, "start": 5, "end": 12 },
//     { "section": 0, "parentParagraph": 2, "control": 0, "cell": 4, "cellParagraph": 0, "start": 0, "end": 6 } ]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const corePath = join(here, 'node_modules', '@rhwp', 'core');
const { initSync, HwpDocument } = await import(pathToFileURL(join(corePath, 'rhwp.js')).href);

// rhwp 레이아웃 엔진이 요구하는 글자 폭 측정 콜백 (색만 바꾸므로 근사치로 충분)
globalThis.measureTextWidth = (_font, text) => [...text].length * 10;
initSync({ module: readFileSync(join(corePath, 'rhwp_bg.wasm')) });

const args = process.argv.slice(2);
const [input, output] = args;
if (!input || !output) {
  console.error('usage: hwp-redline.mjs <input> <output.hwp> (--find TEXT ... | --ranges FILE) [--color #RRGGBB]');
  process.exit(2);
}
const finds = [];
let rangesFile = null;
let color = '#FF0000';
for (let i = 2; i < args.length; i++) {
  if (args[i] === '--find') finds.push(args[++i]);
  else if (args[i] === '--ranges') rangesFile = args[++i];
  else if (args[i] === '--color') color = args[++i];
}

const doc = new HwpDocument(new Uint8Array(readFileSync(input)));
const props = JSON.stringify({ textColor: color });
const applied = [];

if (rangesFile) {
  for (const r of JSON.parse(readFileSync(rangesFile, 'utf8'))) {
    if (r.end <= r.start) continue;
    if (r.cell !== undefined) {
      doc.applyCharFormatInCell(r.section, r.parentParagraph, r.control, r.cell, r.cellParagraph ?? 0, r.start, r.end, props);
    } else {
      doc.applyCharFormat(r.section, r.paragraph, r.start, r.end, props);
    }
    applied.push(r);
  }
}

// --find: 본문 문단에서 문구의 모든 등장 위치를 찾아 칠한다 (표 셀 안은 --ranges 사용)
for (const query of finds) {
  const len = [...query].length;
  for (let s = 0; s < doc.getSectionCount(); s++) {
    for (let p = 0; p < doc.getParagraphCount(s); p++) {
      const plen = doc.getParagraphLength(s, p);
      if (plen < len) continue;
      const text = [...doc.getTextRange(s, p, 0, plen)];
      for (let o = 0; o + len <= text.length; o++) {
        if (text.slice(o, o + len).join('') === query) {
          doc.applyCharFormat(s, p, o, o + len, props);
          applied.push({ section: s, paragraph: p, start: o, end: o + len, text: query });
          o += len - 1;
        }
      }
    }
  }
}

writeFileSync(output, doc.exportHwp());
console.log(JSON.stringify({ ok: true, output, color, count: applied.length, applied }, null, 2));
if (applied.length === 0) process.exitCode = 1;
