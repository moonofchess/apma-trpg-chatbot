import {
  DEFAULT_PROFILE,
  EMPTY_PROFILE_LABEL,
  type ChapterInfo,
  type EmployeeProfile,
} from "@/lib/trpg/employee-profile";

type EmployeeCardProps = {
  profile: EmployeeProfile;
  chapter: ChapterInfo | null;
  hasSession: boolean;
};

export function EmployeeCard({
  profile,
  chapter,
  hasSession,
}: EmployeeCardProps) {
  const isAssigned =
    hasSession && profile.name !== DEFAULT_PROFILE.name && profile.name !== "—";

  return (
    <aside className="employee-card">
      <div className="card-photo">{isAssigned ? "🪪" : "👤"}</div>
      <div className="card-info">
        <p className="card-label">사원증</p>
        {chapter && <p className="card-chapter">{chapter.title}</p>}
        <dl className="card-details">
          <div>
            <dt>이름</dt>
            <dd>{isAssigned ? profile.name : EMPTY_PROFILE_LABEL}</dd>
          </div>
          <div>
            <dt>부서</dt>
            <dd>{profile.department}</dd>
          </div>
          <div>
            <dt>직급</dt>
            <dd>{profile.rank}</dd>
          </div>
          <div>
            <dt>사번</dt>
            <dd>{profile.employeeId}</dd>
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
