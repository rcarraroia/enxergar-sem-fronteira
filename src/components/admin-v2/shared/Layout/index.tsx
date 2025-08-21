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
        <main className="flex-1 lg:ml-0 ml-0 transition-all duration-300">
          <div className="p-4 lg:p-6">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="mb-4">
                <AdminBreadcrumbs items={breadcrumbs} />
              </div>
            )}
            
            {/* Page Title */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">{title}</h1>
                {actions && (
                  <div className="flex-shrink-0">
                    {actions}
                  </div>
                )}
              </div>
            </div>
            
            {/* Page Content */}
            <div className="space-y-4 lg:space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}