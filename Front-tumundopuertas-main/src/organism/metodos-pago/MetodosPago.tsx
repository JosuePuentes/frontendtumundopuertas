import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CrearMetodoPago from './CrearMetodoPago'; // Asegúrate que la ruta sea correcta
import api from '@/lib/api';

interface MetodoPago {
  id: string;
  nombre: string;
  banco: string;
  numero_cuenta: string;
  titular: string;
  moneda: string;
}

const MetodosPago: React.FC = () => {
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const fetchMetodos = async () => {
    try {
      setLoading(true);
      const response = await api('/metodos-pago');
      setMetodos(response);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Error al cargar los métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetodos();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Métodos de Pago</CardTitle>
          <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>Agregar Método de Pago</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Método de Pago</DialogTitle>
              </DialogHeader>
              <CrearMetodoPago />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading && <p>Cargando...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Titular</TableHead>
                  <TableHead>Cuenta/Correo</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metodos.map((metodo) => (
                  <TableRow key={metodo.id}>
                    <TableCell>{metodo.nombre}</TableCell>
                    <TableCell>{metodo.banco}</TableCell>
                    <TableCell>{metodo.titular}</TableCell>
                    <TableCell>{metodo.numero_cuenta}</TableCell>
                    <TableCell>{metodo.moneda}</TableCell>
                    <TableCell>
                      {/* Aquí irán los botones de editar y eliminar */}
                      <Button variant="outline" size="sm" className="mr-2">Editar</Button>
                      <Button variant="destructive" size="sm">Eliminar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MetodosPago;
