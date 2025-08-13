
import React from 'react'
import { PatientRegistrationForm } from '@/components/PatientRegistrationForm'
import { EventsList } from '@/components/EventsList'

export default function Registration() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Enxergar sem Fronteiras
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cadastre-se para participar de nossos eventos oftalmológicos gratuitos e 
            transforme sua visão e qualidade de vida.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-center mb-8">
              Eventos Disponíveis
            </h2>
            <EventsList />
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-center mb-8">
              Realizar Cadastro
            </h2>
            <PatientRegistrationForm />
          </section>
        </div>
      </div>
    </div>
  )
}
