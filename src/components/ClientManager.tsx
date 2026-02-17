import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useClients, useInvoices } from '../hooks/useData';
import ClientList from './clients/ClientList';
import ClientDetails from './clients/ClientDetails';

const ClientManager: React.FC = () => {
  const clients = useClients();
  const invoices = useInvoices();

  return (
    <Routes>
      <Route path="/" element={<ClientList clients={clients} invoices={invoices} />} />
      <Route path="/:id" element={<ClientDetails clients={clients} invoices={invoices} />} />
      <Route path="*" element={<Navigate to="/clients" replace />} />
    </Routes>
  );
};

export default ClientManager;
