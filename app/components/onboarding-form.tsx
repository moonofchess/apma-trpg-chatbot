"use client";

import { FormEvent, useState } from "react";

export type IntakeData = {
  name: string;
  age: string;
  hirePath: string;
  background: string;
  secret: string;
};

type OnboardingFormProps = {
  onSubmit: (data: IntakeData) => void;
  disabled?: boolean;
};

const HIRE_PATHS = ["일반 공채", "추천 입사", "현장 채용", "계약직 전환"];

export function buildIntakeMessage(data: IntakeData): string {
  return [
    "입사 신고합니다. 아래 정보로 등록해 주세요.",
    "",
    `이름: ${data.name}`,
    `나이: ${data.age}`,
    `입사 경로: ${data.hirePath}`,
    `이전 배경: ${data.background || "미기재"}`,
    `숨기는 비밀: ${data.secret || "없음"}`,
    "",
    "오늘 입사 첫날입니다. 인사팀 오리엔테이션(OT)부터 시작해 주세요.",
    "OT 도중 사원증을 발급하고 부서·직급·사번을 배정해 주세요.",
  ].join("\n");
}

export function OnboardingForm({ onSubmit, disabled }: OnboardingFormProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [hirePath, setHirePath] = useState(HIRE_PATHS[0]);
  const [background, setBackground] = useState("");
  const [secret, setSecret] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !age.trim() || disabled) return;

    onSubmit({
      name: name.trim(),
      age: age.trim(),
      hirePath,
      background: background.trim(),
      secret: secret.trim(),
    });
  };

  return (
    <form className="intake-form" onSubmit={handleSubmit}>
      <p className="empty-badge">입사 D-Day</p>
      <p className="empty-title">신규 직원 등록</p>
      <p className="empty-hint">
        사원증 발급 전 기본 정보를 입력하세요. 확인 후 OT가 시작됩니다.
      </p>

      <label className="intake-field">
        <span>이름 *</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          required
          disabled={disabled}
        />
      </label>

      <label className="intake-field">
        <span>나이 *</span>
        <input
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="27"
          inputMode="numeric"
          required
          disabled={disabled}
        />
      </label>

      <label className="intake-field">
        <span>입사 경로 *</span>
        <select
          value={hirePath}
          onChange={(e) => setHirePath(e.target.value)}
          disabled={disabled}
        >
          {HIRE_PATHS.map((path) => (
            <option key={path} value={path}>
              {path}
            </option>
          ))}
        </select>
      </label>

      <label className="intake-field">
        <span>이전 배경</span>
        <input
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder="예: 행정직 2년, 민간 보안"
          disabled={disabled}
        />
      </label>

      <label className="intake-field">
        <span>숨기는 비밀</span>
        <input
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="선택 입력"
          disabled={disabled}
        />
      </label>

      <button type="submit" className="start-button" disabled={disabled || !name.trim() || !age.trim()}>
        OT 시작
      </button>
    </form>
  );
}
