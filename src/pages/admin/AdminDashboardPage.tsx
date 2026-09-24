import AdminDashboard from '../../components/AdminDashboard';
import { useGymData } from '../../context/GymDataProvider';

export default function AdminDashboardPage() {
  const data = useGymData();

  if (data.loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <p className="text-orange-500 text-sm animate-pulse">Loading gym data...</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 rounded-xl border border-red-500/20 bg-red-500/5">
        <p className="text-red-400 font-medium mb-2">Could not connect to server</p>
        <p className="text-sm text-zinc-500 mb-4">{data.error}</p>
        <p className="text-xs text-zinc-600 mb-4">
          Make sure PostgreSQL is running (<code className="text-zinc-400">docker compose up -d</code>) and the API server is started.
        </p>
        <button
          type="button"
          onClick={() => data.refresh()}
          className="px-4 py-2 rounded-lg bg-orange-600 text-black text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AdminDashboard
      plans={data.plans}
      onUpdatePlans={data.setPlans}
      lobbyToken={data.lobbyToken}
      onRefreshLobbyToken={data.onRefreshLobbyToken}
      members={data.members}
      staff={data.staff}
      expenses={data.expenses}
      inventory={data.inventory}
      payments={data.payments}
      attendance={data.attendance}
      auditLogs={data.auditLogs}
      onAddAuditLog={data.onAddAuditLog}
      onUpdateMember={data.onUpdateMember}
      onDeleteMember={data.onDeleteMember}
      onAddExpense={data.onAddExpense}
      onUpdateExpenses={data.onUpdateExpenses}
      onAddPayment={data.onAddPayment}
      onUpdateInventory={data.onUpdateInventory}
      onUpdateStaff={data.onUpdateStaff}
      onCheckInMember={data.onCheckInMember}
      onCheckOutMember={data.onCheckOutMember}
      ownerPhoto={data.ownerPhoto}
      onUpdateOwnerPhoto={data.onUpdateOwnerPhoto}
      gallery={data.gallery.map(g => g.url)}
      onUpdateGallery={(urls) => data.onUpdateGallery(urls.map((url, i) => ({ url, sortOrder: i, active: true, caption: '', featured: false })))}
      logoUrl={data.logoUrl}
      onUpdateLogoUrl={data.onUpdateLogoUrl}
      testimonials={data.testimonials}
      onApproveTestimonial={data.onApproveTestimonial}
      onDeleteTestimonial={data.onDeleteTestimonial}
    />
  );
}
