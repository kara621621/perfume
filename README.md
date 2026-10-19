# Scent Branding Lab

React와 Tailwind CSS로 만든 향수 브랜딩 워크시트입니다.

## 로컬 실행

Node.js 20.19 이상 또는 22.12 이상을 설치한 후 실행합니다.

```sh
npm ci
npm run dev
```

터미널에 표시된 로컬 주소로 접속합니다.

## 배포용 빌드

```sh
npm run build
```

생성된 `dist` 폴더를 정적 웹 호스팅에 배포할 수 있습니다.

## 주요 기능

- 향기 선호 선택 및 노트 구성
- 브랜드 컨셉 프롬프트 복사
- 레시피 표 입력과 붙여넣기
- 제품 이미지 업로드
- PDF 다운로드

PDF 다운로드 기능은 cdnjs에서 html2pdf.js를 불러오므로 인터넷 연결이 필요합니다.
