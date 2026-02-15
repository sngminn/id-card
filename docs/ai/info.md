네, 앞서 논의한 **Vite + React + TypeScript** 중심의 'Local-First' 기술 스택을 완벽하게 반영하여 기획서를 재구성했습니다.

이 기획서는 바로 개발에 착수하실 수 있도록 **기술적 구현 방법(Implementation Strategy)**까지 포함하고 있습니다.

---

# [Project Spec] PureClient ID Station (가제)

## 1. 프로젝트 개요

- **프로젝트명:** PureClient ID Station
- **한줄 소개:** 서버 없이 브라우저만으로 증명사진 촬영, 신분증 스캔 편집, 일괄 저장을 처리하는 보안 중심의 도구
- **핵심 목표:**

1. **Privacy First:** 사용자의 민감한 이미지(얼굴, 신분증)가 서버로 전송되지 않음을 보장.
2. **High Performance:** 웹캠 스트림과 고해상도 이미지 처리를 버벅임 없이 구현.
3. **FE Competency:** Canvas API, Binary Data(Blob/File), IndexedDB 등 프론트엔드 핵심 기술 심화 활용.

---

## 2. 기술 스택 (Tech Stack) & 선정 이유

### Core Framework

- **Build Tool:** `Vite` (빠른 HMR, 로컬 서버 구동 최적화)
- **Library:** `React` (컴포넌트 기반 UI 구성)
- **Language:** `TypeScript` (이미지/Canvas 데이터 조작 시 엄격한 타입 관리 필수)

### State & Storage

- **State Management:** `Zustand` (가볍고 보일러플레이트 없는 전역 상태 관리)
- **Local DB:** `Dexie.js` (IndexedDB Wrapper)
- _선정 이유:_ LocalStorage는 용량 제한(약 5MB)으로 고화질 이미지 저장이 불가능함. 대용량 바이너리 저장을 위해 IndexedDB 사용 필수.

### Styling

- **CSS Framework:** `Tailwind CSS` (빠른 스타일링, 다크모드 지원 용이)
- **UI Components:** `Radix UI` or `Headless UI` (접근성이 보장된 모달/탭 컴포넌트 활용 권장)

### Image Processing (Core)

- **Webcam:** `react-webcam` (카메라 스트림 제어)
- **Crop:** `react-easy-crop` (터치/드래그 제스처 지원 크롭 UI)
- **Compression:** `browser-image-compression` (10MB 이하 용량 최적화 로직)
- **Download:** `jszip` (다중 파일 압축), `file-saver` (클라이언트 다운로드 트리거)

---

## 3. 상세 기능 명세 (Specifications)

### 3.1. 탭 1: 증명사진 (ID Photo Studio)

**[기능 목표]** 웹캠 촬영부터 이름 마킹, 규격화, 저장까지 원스톱 처리

1. **웹캠 촬영 & 프리뷰**

- `<Webcam />` 컴포넌트로 실시간 스트림 송출.
- [촬영] 버튼 클릭 시 `getScreenshot()`으로 Base64 데이터 추출.
- _Edge Case:_ 카메라 권한 거부 시 대체 UI(파일 업로드 버튼) 노출.

2. **이미지 편집기 (Modal)**

- **Crop:** 3:4 비율(Aspect Ratio) 고정. 줌/팬(Zoom/Pan) 기능 제공.
- **Text Overlay:**
- Canvas API의 `ctx.fillText()` 사용.
- 이미지 좌측 하단(padding 20px)에 흰색 텍스트 + 검은색 그림자(Shadow) 적용.
- 텍스트 크기는 이미지 해상도에 비례하여 자동 계산.

3. **저장 및 최적화**

- **용량 제한:** 결과물이 10MB를 초과할 경우 `browser-image-compression`으로 `maxSizeMB: 9.5` 설정하여 재압축.
- **파일명:** `01_{입력한이름}.jpg` 형식 자동 생성.
- **DB 저장:** 처리된 Blob 데이터를 Dexie.js(`idPhotos` 테이블)에 저장.

4. **사이드바 (History List)**

- Dexie.js `useLiveQuery`를 통해 저장된 사진 실시간 리스트업.
- [전체 다운로드] 클릭 시: 저장된 모든 사진을 순회하며 `JSZip`에 담아 `photos.zip`으로 다운로드.

---

### 3.2. 탭 2: 신분증 스캐너 (ID Card Manager)

**[기능 목표]** 불규칙한 신분증 사진을 규격화된 템플릿에 맞춰 깔끔하게 정리

1. **파일 업로드**

- Dropzone 영역 구현.
- `accept="image/*"`, `multiple` 속성 사용.
- Validation: 최대 10장 제한, 이미지 파일 형식 확인.

2. **그리드 뷰 & 정렬**

- CSS Grid(`grid-cols-2` ~ `grid-cols-4`) 활용.
- Slider input으로 컬럼 개수 실시간 조정 가능.
- `DnD Kit` 라이브러리 등을 사용하여 카드 순서 변경 (선택사항, 난이도 조절).

3. **템플릿 편집 (Masking Editor)**

- 각 카드 클릭 시 편집 모달 진입.
- **유형 선택:** [주민등록증] / [운전면허증] / [여권] 등.
- **마스킹 로직:**
- 화면 중앙에 '신분증 모양의 투명 구멍이 뚫린 검은색 오버레이(SVG Mask)' 배치.
- 사용자는 뒷배경의 원본 이미지를 움직여 구멍에 신분증을 맞춤.
- 저장 시 Canvas의 `globalCompositeOperation = 'destination-in'`을 사용하여 마스크 영역만큼만 잘라냄.

- **필터:** 흑백(Grayscale), 이진화(Threshold - 복사본 느낌) 필터 옵션 제공.

---

## 4. 데이터 구조 (IndexedDB Schema)

`Dexie.js` 설정 파일(`db.ts`) 예시입니다.

```typescript
import Dexie, { Table } from "dexie";

export interface IDPhoto {
  id?: number;
  name: string;
  blob: Blob;
  createdAt: Date;
}

export interface IDCard {
  id?: number;
  type: "driver" | "resident" | "custom";
  blob: Blob;
  order: number; // 그리드 순서용
}

export class MyDatabase extends Dexie {
  idPhotos!: Table<IDPhoto>;
  idCards!: Table<IDCard>;

  constructor() {
    super("PrivacyIDMakerDB");
    this.version(1).stores({
      idPhotos: "++id, name, createdAt",
      idCards: "++id, type, order",
    });
  }
}

export const db = new MyDatabase();
```

---

## 5. UI/UX 와이어프레임 (Layout Structure)

```text
[Header]
Logo: PureClient ID Station  |  Tabs: [증명사진] [신분증]  |  [설정(Reset DB)]

[Main Content Area - Tab 1: 증명사진]
+---------------------------------------+  +------------------------+
|                                       |  |  Saved List (DB)       |
|  [ Webcam View / Capture Area ]       |  |                        |
|                                       |  |  [IMG] 01_김승민.jpg    |
|   - 가이드라인 오버레이 (3:4 Box)       |  |  [IMG] 02_홍길동.jpg    |
|   - [촬영 버튼]                       |  |                        |
|                                       |  |  [Download All (.zip)] |
+---------------------------------------+  +------------------------+
|  [Name Input]  [Manual Upload Btn]    |
+---------------------------------------+

[Main Content Area - Tab 2: 신분증]
+---------------------------------------+
|  [ Drag & Drop Zone (Click to Add) ]  |
+---------------------------------------+
|  Control: [Grid Size Slider]          |
+---------------------------------------+
|  [ Grid Container ]                   |
|  +-------+  +-------+  +-------+      |
|  | ID 1  |  | ID 2  |  | ID 3  |      |
|  +-------+  +-------+  +-------+      |
+---------------------------------------+

```

## 6. 개발 단계별 마일스톤 (Milestones)

1. **Step 1 (환경 설정):** Vite + React + TS + Tailwind 설치 및 Git 초기화.
2. **Step 2 (기본 웹캠):** `react-webcam` 연동하여 화면에 내 얼굴 띄우기.
3. **Step 3 (캔버스 기초):** 캡처한 이미지를 Canvas에 그리고 텍스트 합성해보기.
4. **Step 4 (스토리지):** Dexie.js 세팅하여 Blob 데이터 저장/불러오기 구현.
5. **Step 5 (신분증 탭):** 파일 업로드 및 Grid UI 구현, 마스킹(Crop) 로직 적용.
6. **Step 6 (최적화):** 이미지 압축 로직, Zip 다운로드, UI 폴리싱.
