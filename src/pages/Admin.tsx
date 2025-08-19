
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MetricCard } from '@/components/admin/MetricCard';
import { QuickActions } from '@/components/admin/QuickActions';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { NotificationTemplatesCard } from '@/components/admin/NotificationTemplatesCard';
import { ReminderJobsCard } from '@/components/admin/ReminderJobsCard';
import { SystemHealthCard } from '@/components/admin/SystemHealthCard';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { Users, Calendar, MessageSquare, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const { user } = useAuth();
  const { data: metrics, isLoading } = useAdminMetrics();
  const { data: activities = [] } = useRecentActivity();
  const navigate = useNavigate();

  if (!user) return null;

  const handleCreateEvent = () => {
    navigate('/admin/events/new');
  };

  const handleViewTodayRegistrations = () => {
    navigate('/admin/registrations?filter=today');
  };

  const handleExportReports = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Painel Administrativo
            </h1>
            <p className="text-gray-600 mt-2">
              Visão geral do sistema e ferramentas de gestão
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total de Pacientes"
              value={metrics?.totalPatients || 0}
              icon={Users}
              trend={{
                value: 5.2,
                label: "vs mês anterior",
                isPositive: true
              }}
            />
            <MetricCard
              title="Eventos Ativos"
              value={metrics?.activeEvents || 0}
              icon={Calendar}
              trend={{
                value: 2.1,
                label: "vs semana anterior",
                isPositive: true
              }}
            />
            <MetricCard
              title="Inscrições Este Mês"
              value={metrics?.thisWeekRegistrations || 0}
              icon={TrendingUp}
              trend={{
                value: 12.5,
                label: "vs mês anterior",
                isPositive: true
              }}
            />
            <MetricCard
              title="Taxa de Ocupação"
              value={`${metrics?.occupancyRate || 0}%`}
              icon={MessageSquare}
              trend={{
                value: 8.3,
                label: "vs média anterior",
                isPositive: true
              }}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Actions & Health */}
            <div className="space-y-6">
              <QuickActions 
                onCreateEvent={handleCreateEvent}
                onViewTodayRegistrations={handleViewTodayRegistrations}
                onExportReports={handleExportReports}
              />
              <SystemHealthCard />
            </div>

            {/* Middle Column - Activity Feed */}
            <div>
              <ActivityFeed activities={activities} />
            </div>

            {/* Right Column - Templates & Jobs */}
            <div className="space-y-6">
              <NotificationTemplatesCard />
            </div>
          </div>

          {/* Full Width - Reminder Jobs */}
          <ReminderJobsCard />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
