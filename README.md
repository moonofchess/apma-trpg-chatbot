# APMA TRPG Chatbot

괴이현상관리국(APMA) 세계관을 바탕으로 한 Next.js TRPG 챗봇입니다. 사용자는 신규 직원 정보를 입력하고, AI GM은 온보딩과 근무 기록 형식으로 이야기를 진행합니다.

## Stack

- Next.js 15 App Router
- React 19
- Vercel AI SDK
- OpenAI API
- TypeScript

## Setup

1. 의존성을 설치합니다.

```bash
npm install
```

2. 환경변수를 준비합니다.

```bash
cp .env.example .env.local
```

`.env.local`에 OpenAI API 키를 넣습니다.

```env
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-5.4-mini
```

`OPENAI_MODEL`은 생략하면 `gpt-5.4-mini`를 사용합니다. 다른 모델 접근 권한이 있으면 이 값만 바꿔서 비교할 수 있습니다.
OpenAI 생성 옵션은 `reasoningEffort: "high"`와 `textVerbosity: "high"`로 설정되어 있습니다.

3. 개발 서버를 실행합니다.

```bash
npm run dev
```

Windows PowerShell 실행 정책 때문에 `npm`이 막히면 아래처럼 실행할 수 있습니다.

```bash
npm.cmd run dev
```

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
npm run start
```

## Project Structure

- `app/page.tsx`: 채팅 화면, 온보딩 폼, 직원증, 추천 응답 UI
- `app/api/chat/route.ts`: OpenAI 스트리밍 응답 API
- `app/components`: 메시지, 직원증, 추천 응답, 텍스트 렌더링 컴포넌트
- `lib/trpg`: 세계관, 시스템 프롬프트, 도구 호출, 주사위, 게임 상태 추출 로직

## Notes

- `.env.local`은 Git에 포함되지 않습니다.
- AI 응답은 대사, 생각, 강조, 서술이 한 줄에 섞이지 않도록 분리해서 렌더링합니다.
- 모바일 화면에서는 직원증 영역을 압축하고 입력창과 추천 응답 버튼을 터치하기 쉽게 표시합니다.
