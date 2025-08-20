/**
 * ADMIN BREADCRUMBS V2 - Navegação estrutural
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { BreadcrumbItem } from './index'

interface AdminBreadcrumbsProps {
  items: BreadcrumbItem[]
}

export const AdminBreadcrumbs: React.FC<AdminBreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
      <Link 
        to="/admin-v2" 
        className="flex items-center hover:text-gray-700 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          <ChevronRight className="h-4 w-4" />
          {index === items.length - 1 ? (
            <span className="text-gray-900 font-medium">{item.label}</span>
          ) : (
            <Link 
              to={item.path}
              className="hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}