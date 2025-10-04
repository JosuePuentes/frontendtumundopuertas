import { useState } from "react";
import { useMetodosPago, MetodoPago } from "../../hooks/useMetodosPago";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import CrearMetodoPago from "./CrearMetodoPago";
import ModificarMetodoPago from "./ModificarMetodoPago";

const MetodosPago = () => {
  const { metodos, loading, error, removeMetodoPago, fetchMetodosPago } = useMetodosPago();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedMetodo, setSelectedMetodo] = useState<MetodoPago | null>(null);

  const handleEdit = (metodo: MetodoPago) => {
    setSelectedMetodo(metodo);
    setUpdateModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este método de pago?")) {
      await removeMetodoPago(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de Pago</CardTitle>
        <Button onClick={() => setCreateModalOpen(true)}>Agregar Método de Pago</Button>
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
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metodos.map((metodo) => (
              <TableRow key={metodo._id}>
                <TableCell>{metodo.nombre}</TableCell>
                <TableCell>{metodo.banco}</TableCell>
                <TableCell>{metodo.titular}</TableCell>
                <TableCell>{metodo.numero_cuenta}</TableCell>
                <TableCell>{metodo.moneda}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(metodo)}>
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(metodo._id!)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <CrearMetodoPago
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={fetchMetodosPago}
        />

        {selectedMetodo && (
          <ModificarMetodoPago
            isOpen={isUpdateModalOpen}
            onClose={() => setUpdateModalOpen(false)}
            onUpdated={fetchMetodosPago}
            metodo={selectedMetodo}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MetodosPago;