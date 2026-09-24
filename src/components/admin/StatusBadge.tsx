import { MemberDisplayStatus } from '../../types';
import { statusBadgeClass } from '../../lib/memberUtils';

export default function StatusBadge({ status }: { status: MemberDisplayStatus | string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadgeClass(status as MemberDisplayStatus)}`}>
      {status}
    </span>
  );
}
