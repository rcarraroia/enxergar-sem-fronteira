/**
 * ADMIN LAYOUT V2 - Componente base para todas as páginas admin
 * Arquitetura limpa sem violações de hooks
 */

import React from 'react'
import { AdminNavigation } from './Navigation'
import { AdminHeader } from './Header'
import { AdminBreadcrumbs } from './Breadcrumbs'

export interface BreadcrumbItem {
  label: string
  path: string
}

export interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  breadcrumbs = [],
  actions
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader title={title} actions={actions} />
      
      <div className="flex">
        {/* Sidebar Navigation */}
        <AdminNavigation />
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <AdminBreadcrumbs items={breadcrumbs} />
          )}
          
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
          
          {/* Page Content */}
          <div className="space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}