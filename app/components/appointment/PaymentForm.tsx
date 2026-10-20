"use client"
import React, { useState } from 'react';

export const PaymentForm: React.FC = () => {
  const [method, setMethod] = useState<'pix' | 'card' | 'plan'>('card');

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
      <h3 className="font-bold text-blue-900 text-lg">Pagamento</h3>

      {/* Opções de Método */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { id: 'pix', label: 'Pix' },
          { id: 'card', label: 'Cartão de crédito' },
          { id: 'plan', label: 'Plano de saúde' },
        ].map((item) => {
          const isSelected = method === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setMethod(item.id as 'pix' | 'card' | 'plan')}
              className={`p-3 border rounded-xl flex items-center space-x-3 text-xs font-bold transition-all ${
                isSelected
                  ? 'border-blue-600 bg-sky-50 text-blue-900 ring-1 ring-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-blue-600' : 'border-gray-300'
                }`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Formulário do Cartão */}
      {method === 'card' && (
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Número do cartão
            </label>
            <input
              type="text"
              defaultValue="•••• •••• •••• 4417"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-600 text-gray-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nome no cartão
              </label>
              <input
                type="text"
                defaultValue="JULIA SANTOS"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-600 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Validade
              </label>
              <input
                type="text"
                defaultValue="08/29"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-600 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="password"
                defaultValue="123"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-600 text-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Parcelas
            </label>
            <select className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-600 text-gray-700 bg-white">
              <option>1x de R$ 150,00 sem juros</option>
            </select>
          </div>
        </div>
      )}

      {/* Nota de Segurança */}
      <p className="text-xs text-gray-400 flex items-center pt-2">
        <span className="mr-1">🔒</span> Pagamento criptografado · Você só é cobrada após confirmar
      </p>
    </div>
  );
};