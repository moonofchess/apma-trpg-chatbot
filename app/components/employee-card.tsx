import {
  DEFAULT_PROFILE,
  EMPTY_PROFILE_LABEL,
  type ChapterInfo,
  type EmployeeProfile,
} from "@/lib/trpg/employee-profile";

import { getIntakeFullName, type IntakeData } from "./onboarding-form";

type EmployeeCardProps = {
  profile: EmployeeProfile;
  chapter: ChapterInfo | null;
  hasSession: boolean;
  intake?: IntakeData | null;
};

export function EmployeeCard({
  profile,
  chapter,
  hasSession,
  intake,
}: EmployeeCardProps) {
  const gmAssigned =
    hasSession && profile.name !== DEFAULT_PROFILE.name && profile.name !== "—";

  const displayName = gmAssigned
    ? profile.name
    : intake
      ? getIntakeFullName(intake)
      : EMPTY_PROFILE_LABEL;

  const displayAge = gmAssigned ? profile.age : intake?.age;

  const isRegistered = gmAssigned || Boolean(intake?.name);

  return (
    <aside className="employee-card">
      <div className="card-photo">{isRegistered ? "🪪" : "👤"}</div>
      <div className="card-info">
        <p className="card-label">사원증</p>
        {chapter && <p className="card-chapter">{chapter.title}</p>}
        <dl className="card-details">
          <div>
            <dt>이름</dt>
            <dd>{displayName}</dd>
          </div>
          {displayAge && (
            <div>
              <dt>나이</dt>
              <dd>{displayAge}</dd>
            </div>
          )}
          <div>
            <dt>부서</dt>
            <dd>{gmAssigned ? profile.department : intake ? "배정 대기" : profile.department}</dd>
          </div>
          <div>
            <dt>직급</dt>
            <dd>{gmAssigned ? profile.rank : intake ? "신규" : profile.rank}</dd>
          </div>
          <div>
            <dt>사번</dt>
            <dd>{gmAssigned ? profile.employeeId : intake ? "발급 대기" : profile.employeeId}</dd>
          </div>
          {profile.clearance && (
            <div>
              <dt>결재권</dt>
              <dd>{profile.clearance}</dd>
            </div>
          )}
        </dl>
      </div>
    </aside>
  );
}
