import { useState } from "react";
import { useMetodosPago } from "../../hooks/useMetodosPago";
import type { MetodoPago } from "../../hooks/useMetodosPago";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import CrearMetodoPago from "./CrearMetodoPago";
import ModificarMetodoPago from "./ModificarMetodoPago";

import CargarDinero from "./CargarDinero";

const MetodosPago = () => {
  const { metodos, loading, error, removeMetodoPago, fetchMetodosPago, updateMetodoSaldo } = useMetodosPago();

  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isCargarModalOpen, setCargarModalOpen] = useState(false);
  const [selectedMetodo, setSelectedMetodo] = useState<MetodoPago | null>(null);

  const handleEdit = (metodo: MetodoPago) => {
    setSelectedMetodo(metodo);
    setUpdateModalOpen(true);
  };

  const handleCargar = (metodo: MetodoPago) => {
    setSelectedMetodo(metodo);
    setCargarModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este método de pago?")) {
      await removeMetodoPago(id!);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de Pago</CardTitle>

      </CardHeader>
      <CardContent>
        {loading && <p>Cargando...</p>}
        {error && <p>Error: {error}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Banco</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead>Nro. Cuenta</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Saldo</TableHead>
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
                <TableCell>{metodo.saldo.toFixed(2)}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(metodo)}>
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(metodo.id!)}>
                    Eliminar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCargar(metodo)}>Cargar</Button>
                  <Button variant="outline" size="sm" onClick={() => handleTransferir(metodo)}>Transferir</Button>
                  <Button variant="outline" size="sm">Historial</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <CrearMetodoPago onCreated={fetchMetodosPago} />

        {selectedMetodo && (
          <ModificarMetodoPago
            isOpen={isUpdateModalOpen}
            onClose={() => setUpdateModalOpen(false)}
            onUpdated={fetchMetodosPago}
            metodo={selectedMetodo}
          />
        )}

        {selectedMetodo && (
          <CargarDinero
            isOpen={isCargarModalOpen}
            onClose={() => setCargarModalOpen(false)}
            onSuccess={(updatedMetodo) => {
              updateMetodoSaldo(selectedMetodo.id!, updatedMetodo);
            }}
            metodo={selectedMetodo}
          />
        )}

        {selectedMetodo && (
          <TransferirDinero
            isOpen={isTransferirModalOpen}
            onClose={() => setTransferirModalOpen(false)}
            onSuccess={(updatedMetodo) => {
              updateMetodoSaldo(selectedMetodo.id!, updatedMetodo);
            }}
            metodo={selectedMetodo}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MetodosPago;