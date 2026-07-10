# 열대어 도감 & 합사 호환성 체커 (Tropical Fish Species Guide & Compatibility Checker)

개인 프로젝트 — 열대어 사육자를 위한 종 도감, 어항 합사(tankmate) 호환성 판정 엔진, 개인 어항 관리 도구.

**Live prototype**: (배포 후 링크 추가 예정)

---

## 이 프로젝트에서 보여주고 싶은 것

이 저장소는 실서비스 아키텍처(React/Supabase)로 전환하기 전, **데이터 모델링 → 데이터 검증 → 규칙 기반 의사결정 엔진 설계**를 처음부터 끝까지 직접 해본 기록입니다. BI/데이터 분석 업무에서 실제로 쓰는 프로세스와 동일한 흐름으로 진행했습니다.

| 업무 프로세스 | 이 프로젝트에서 한 것 |
|---|---|
| 데이터 모델링 | 정규화된 관계형 구조 설계 (`species` ↔ `careGroups`, 1:N) |
| ETL / 데이터 파이프라인 | Excel ↔ JSON 양방향 변환 스크립트, 라운드트립 검증 |
| 다중 소스 데이터 검증 | 2개 이상의 출처(FishLore, AquaticCommunity) 교차 대조, 불일치 항목 조정 |
| 데이터 품질 관리 | 자동 유효성 검사(범위 역전, enum 오류, 참조 무결성), taxonomy 오분류 탐지·수정 |
| 규칙 기반 의사결정 엔진 | 카테고리 매트릭스 + 단계적 다운그레이드 규칙 + 예외 테이블 구조 설계 |

자세한 방법론은 [`docs/DATA_METHODOLOGY.md`](docs/DATA_METHODOLOGY.md) 참고.

---

## 폴더 구조

```
app/        실행 가능한 프론트엔드 프로토타입 (HTML/CSS/JS, PWA)
data/       종 데이터 (JSON) + 사람이 검토용으로 보는 Excel 버전
scripts/    데이터 파이프라인 (Excel↔JSON 변환, 소스 교차검증, Excel 리포트 생성)
docs/       데이터 모델링·검증 방법론 문서
```

## 데이터 모델

```
careGroups (그룹 ID를 PK로 하는 스펙 테이블)
├── temp, ph, tankMin        수질/사육 조건
├── temperament               성격 카테고리 (peaceful/semi-aggressive/aggressive)
├── finNipper, predatory 등   행동 플래그 (boolean)
└── ...

species (그룹을 FK로 참조하는 개체 테이블)
├── id, name, latin, genus, origin, maxSize
├── aliases[]                 유통명 (동일 종의 색상/품종 변이)
├── groupId → careGroups.id
└── note                      이 종만의 예외 사항
```
색상 변이가 많은 종(구피, 시클리드 등)을 종마다 스펙을 중복 저장하지 않고, 그룹 단위로 스펙을 공유하도록 설계했습니다. SQL로 옮기면 `careGroups`가 부모 테이블, `species`가 `groupId`를 FK로 참조하는 1:N 관계가 됩니다.

## 합사 판정 엔진

숫자 데이터(온도·pH)는 범위 겹침 계산으로, 정성 데이터(성격)는 **3×3 카테고리 매트릭스 룩업**으로 처리합니다. 정성적 판단에 임의의 점수(예: "공격성 7점")를 매기지 않고, 근거 있는 카테고리 조합만 사용하는 것이 설계 원칙입니다.

보조 리스크 요인(니치 경쟁, 수질 예민도 등)은 점수 합산이 아니라 **한 단계씩만 낮추는 다운그레이드 규칙**으로 처리해, 최종 판정 근거를 항상 역추적할 수 있게 했습니다. 규칙만으로 안 잡히는 실제 사육 사례는 `species_pair_override` 예외 테이블로 별도 관리합니다.

## 기술 스택 (현재 프로토타입)

- Frontend: Vanilla HTML/CSS/JS (프레임워크 없음), PWA
- 데이터 파이프라인: Python (openpyxl)
- 데이터 저장: 정적 JSON (앱 내장) + 개인 데이터는 브라우저 localStorage

## 다음 단계

React + Supabase(PostgreSQL)로 마이그레이션 예정. 자세한 로드맵은 프로젝트 이슈에서 관리합니다.
