# Design - Finalização do Sistema Enxergar Sem Fronteira

## Overview

Este documento detalha o design para completar a implementação do sistema Enxergar Sem Fronteira, focando nas funcionalidades críticas que faltam para tornar o sistema totalmente operacional.

## Architecture

### Estrutura de Páginas Faltantes

#### Páginas do Organizador
```
/organizer/dashboard - Dashboard personalizado do organizador
/organizer/events - Lista de eventos do organizador
/organizer/events/new - Criar novo evento
/organizer/events/:id/edit - Editar evento específico
/organizer/events/:id/registrations - Ver inscrições do evento
/organizer/profile - Perfil e configurações do organizador
```

#### Páginas Públicas de Eventos
```
/events/:id - Página detalhada do evento individual
/events/:id/register - Página de inscrição específica do evento
```

#### Páginas do Usuário Final
```
/profile - Perfil do usuário
/my-registrations - Minhas inscrições
/auth/forgot-password - Recuperação de senha
/auth/reset-password - Redefinir senha
```

## Components and Interfaces

### Novos Componentes Necessários

#### Componentes do Organizador
```typescript
// Dashboard Components
<OrganizerDashboard />
<OrganizerEventCard />
<OrganizerMetrics />

// Event Management
<OrganizerEventForm />
<OrganizerEventList />
<OrganizerRegistrationsList />

// Layout
<OrganizerLayout />
<OrganizerSidebar />
```

#### Componentes de Eventos Públicos
```typescript
// Event Details
<EventDetailsPage />
<EventMap />
<EventRegistrationButton />
<EventWaitingList />

// Registration
<EventRegistrationForm />
<RegistrationConfirmation />
```

#### Componentes do Usuário
```typescript
// User Profile
<UserProfile />
<UserRegistrationsList />
<RegistrationCard />

// Authentication
<ForgotPasswordForm />
<ResetPasswordForm />
```

#### Componentes Administrativos Atualizados
```typescript
// Donation System (renamed from Payment)
<DonationForm />
<DonationsList />
<CampaignMetrics />

// API Keys Configuration
<AsaasApiKeysForm />
<OrganizerApiKeyField />
<CreateAsaasAccountButton />

// Organizers Card
<OrganizersManagementCard />
```

## Data Models

### Modelos Atualizados

#### Event Model (com múltiplas datas)
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  city: string;
  coordinates?: { lat: number; lng: number };
  organizerId: string;
  status: 'active' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
  
  // Relacionamento com datas
  eventDates: EventDate[];
}

interface EventDate {
  id: string;
  eventId: string;
  date: string;
  startTime: string;
  endTime: string;
  totalSlots: number;
  availableSlots: number;
  status: 'active' | 'cancelled' | 'completed';
}
```

#### Waiting List Model
```typescript
interface WaitingList {
  id: string;
  eventDateId: string;
  patientId: string;
  position: number;
  notifiedAt?: string;
  expiresAt?: string;
  status: 'waiting' | 'notified' | 'confirmed' | 'expired';
  createdAt: string;
}
```

#### System Settings Model (atualizado)
```typescript
interface SystemSettings {
  // Existing fields
  project_name: string;
  project_description: string;
  social_links: {
    facebook: string;
    instagram: string;
    linkedin: string;
  };
  logo_header: string;
  logo_footer: string;
  
  // New API Keys fields
  asaas_ong_coracao_valente: string;
  asaas_projeto_visao_itinerante: string;
  asaas_renum_tecnologia: string;
  
  // Twilio settings
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_whatsapp_number: string;
  twilio_sms_number: string;
}
```

## Database Schema Updates

### Novas Tabelas

#### Waiting List Table
```sql
CREATE TABLE public.waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date_id UUID REFERENCES public.event_dates(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  notified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'confirmed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_date_id, patient_id)
);
```

#### Event Dates Table (se não existir)
```sql
CREATE TABLE public.event_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 0,
  available_slots INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Atualizações de Tabelas Existentes

#### System Settings Updates
```sql
-- Add new API Keys fields
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS key TEXT UNIQUE;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS value JSONB;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS description TEXT;

-- Insert new settings
INSERT INTO public.system_settings (key, value, description) VALUES
('asaas_ong_coracao_valente', '""', 'API Key do Asaas da ONG Coração Valente (25% do split)'),
('asaas_projeto_visao_itinerante', '""', 'API Key do Asaas do Projeto Visão Itinerante (25% do split)'),
('asaas_renum_tecnologia', '""', 'API Key do Asaas da Renum Tecnologia (25% do split)'),
('twilio_account_sid', '""', 'Twilio Account SID para WhatsApp e SMS'),
('twilio_auth_token', '""', 'Twilio Auth Token'),
('twilio_whatsapp_number', '""', 'Número do WhatsApp Business'),
('twilio_sms_number', '""', 'Número para envio de SMS');
```

## API Endpoints

### Novos Endpoints para Organizadores

```typescript
// Organizer Dashboard
GET /api/organizer/dashboard - Get organizer metrics
GET /api/organizer/events - Get organizer's events
POST /api/organizer/events - Create new event
PUT /api/organizer/events/:id - Update event
DELETE /api/organizer/events/:id - Delete event
GET /api/organizer/events/:id/registrations - Get event registrations

// Organizer Profile
GET /api/organizer/profile - Get organizer profile
PUT /api/organizer/profile - Update organizer profile
```

### Novos Endpoints para Eventos Públicos

```typescript
// Public Event Details
GET /api/events/:id/details - Get detailed event information
GET /api/events/:id/availability - Get real-time availability
POST /api/events/:id/waiting-list - Join waiting list
DELETE /api/events/:id/waiting-list - Leave waiting list
```

### Novos Endpoints para Usuários

```typescript
// User Profile
GET /api/user/profile - Get user profile
PUT /api/user/profile - Update user profile
GET /api/user/registrations - Get user registrations
DELETE /api/user/registrations/:id - Cancel registration

// Password Recovery
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password - Reset password with token
```

### Endpoints para Notificações

```typescript
// Twilio Integration
POST /api/notifications/whatsapp - Send WhatsApp message
POST /api/notifications/sms - Send SMS message
POST /api/notifications/bulk - Send bulk notifications
GET /api/notifications/status/:id - Get notification status
```

## User Interface Design

### Organizer Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header: Logo | Organizador: Nome | Logout              │
├─────────────────────────────────────────────────────────┤
│ Sidebar:                │ Main Content:                 │
│ - Dashboard             │ ┌─────────────────────────────┐ │
│ - Meus Eventos          │ │ Métricas Resumidas          │ │
│ - Criar Evento          │ │ - Total de Eventos          │ │
│ - Inscrições            │ │ - Total de Inscrições       │ │
│ - Perfil                │ │ - Próximos Eventos          │ │
│                         │ └─────────────────────────────┘ │
│                         │ ┌─────────────────────────────┐ │
│                         │ │ Eventos Recentes            │ │
│                         │ │ - Lista de eventos          │ │
│                         │ │ - Status e inscrições       │ │
│                         │ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Event Details Page Layout
```
┌─────────────────────────────────────────────────────────┐
│ Header: Logo | Login/Profile                           │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Event Hero Section                                  │ │
│ │ - Título do Evento                                  │ │
│ │ - Status (Vagas Disponíveis/Lotado)                │ │
│ │ - Botão de Inscrição Principal                      │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────┐ ┌─────────────────────────────────┐ │
│ │ Detalhes        │ │ Mapa e Localização              │ │
│ │ - Data/Horário  │ │ - Google Maps Integrado         │ │
│ │ - Local         │ │ - Endereço Completo             │ │
│ │ - Vagas         │ │ - Como Chegar                   │ │
│ │ - Organizador   │ └─────────────────────────────────┘ │
│ └─────────────────┘                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Informações Importantes                             │ │
│ │ - O que levar                                       │ │
│ │ - Condições da consulta                             │ │
│ │ - Contato do organizador                            │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Security Considerations

### API Keys Encryption
- Todas as API Keys devem ser criptografadas antes do armazenamento
- Usar criptografia AES-256 com chave derivada de variável de ambiente
- Implementar rotação de chaves periodicamente

### Authentication & Authorization
- Organizadores só podem acessar seus próprios eventos
- Usuários só podem ver/editar suas próprias inscrições
- Administradores têm acesso total ao sistema

### Data Privacy
- Implementar logs de auditoria para alterações sensíveis
- Garantir conformidade com LGPD
- Permitir exclusão de dados pessoais quando solicitado

## Performance Optimization

### Caching Strategy
- Cache de eventos públicos por 5 minutos
- Cache de configurações do sistema por 1 hora
- Invalidação automática quando dados são alterados

### Database Optimization
- Índices em campos de busca frequente
- Paginação em listagens grandes
- Queries otimizadas para relacionamentos

## Integration Points

### Google Maps Integration
- API Key configurável via variáveis de ambiente
- Componente reutilizável para mapas
- Geocoding automático de endereços

### Twilio Integration
- Configuração via system_settings
- Templates de mensagens configuráveis
- Retry automático para falhas de envio
- Logs de entrega e status

### Asaas Integration Updates
- Suporte para múltiplas API Keys (4 entidades)
- Split automático configurável
- Webhook handling melhorado
- Rastreamento de origem das doações