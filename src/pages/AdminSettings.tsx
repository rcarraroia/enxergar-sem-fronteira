
import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings } from 'lucide-react'
import { SystemSettingsForm } from '@/components/admin/SystemSettingsForm'

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="logos">Logos</TabsTrigger>
          <TabsTrigger value="social">Redes Sociais</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <SystemSettingsForm section="general" />
        </TabsContent>

        <TabsContent value="logos" className="space-y-4">
          <SystemSettingsForm section="logos" />
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <SystemSettingsForm section="social" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminSettings
