
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MetricCard } from '@/components/admin/MetricCard';
import { QuickActions } from '@/components/admin/QuickActions';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { NotificationTemplatesCard } from '@/components/admin/NotificationTemplatesCard';
import { ReminderJobsCard } from '@/components/admin/ReminderJobsCard';
import { SystemHealthCard } from '@/components/admin/SystemHealthCard';
import { AlertBanner } from '@/components/admin/AlertBanner';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { Users, Calendar, MessageSquare, TrendingUp } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const { metrics, isLoading } = useAdminMetrics();

  if (!user) return null;

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

          {/* System Alerts */}
          <AlertBanner />

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total de Pacientes"
              value={metrics?.totalPatients || 0}
              icon={Users}
              trend={5.2}
              isLoading={isLoading}
            />
            <MetricCard
              title="Eventos Ativos"
              value={metrics?.activeEvents || 0}
              icon={Calendar}
              trend={2.1}
              isLoading={isLoading}
            />
            <MetricCard
              title="Inscrições Este Mês"
              value={metrics?.registrationsThisMonth || 0}
              icon={TrendingUp}
              trend={12.5}
              isLoading={isLoading}
            />
            <MetricCard
              title="Notificações Enviadas"
              value={metrics?.notificationsSent || 0}
              icon={MessageSquare}
              trend={8.3}
              isLoading={isLoading}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Actions & Health */}
            <div className="space-y-6">
              <QuickActions />
              <SystemHealthCard />
            </div>

            {/* Middle Column - Activity Feed */}
            <div>
              <ActivityFeed />
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
