import { useState, useEffect } from "react";
import { useMetodosPago } from "../../hooks/useMetodosPago";
import type { MetodoPago } from "../../hooks/useMetodosPago";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import CrearMetodoPago from "./CrearMetodoPago";
import ModificarMetodoPago from "./ModificarMetodoPago";
import CargarDinero from "./CargarDinero";
import TransferirDinero from "./TransferirDinero";
import HistorialTransacciones from "./HistorialTransacciones";

const MetodosPago = () => {
  const { metodos, loading, error, removeMetodoPago, fetchMetodosPago, updateMetodoSaldo } = useMetodosPago();

  // Refrescar métodos de pago automáticamente cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMetodosPago();
    }, 30000); // 30 segundos

    // Refrescar cuando el usuario regresa a la página
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMetodosPago();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchMetodosPago]);

  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isCargarModalOpen, setCargarModalOpen] = useState(false);
  const [isTransferirModalOpen, setTransferirModalOpen] = useState(false);
  const [isHistorialModalOpen, setHistorialModalOpen] = useState(false);
  const [selectedMetodo, setSelectedMetodo] = useState<MetodoPago | null>(null);

  const handleEdit = (metodo: MetodoPago) => {
    setSelectedMetodo(metodo);
    setUpdateModalOpen(true);
  };

  const handleCargar = (metodo: MetodoPago) => {
    setSelectedMetodo(metodo);
    setCargarModalOpen(true);
  };

  const handleTransferir = (metodo: MetodoPago) => {
    setSelectedMetodo(metodo);
    setTransferirModalOpen(true);
  };

  const handleHistorial = (metodo: MetodoPago) => {
    setSelectedMetodo(metodo);
    setHistorialModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este método de pago?")) {
      await removeMetodoPago(id!);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Bancos</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMetodosPago}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Refrescar"}
          </Button>
        </div>
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
                  <div className="flex gap-1 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(metodo)}>
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(metodo.id!)}>
                      Eliminar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCargar(metodo)}>
                      Depositar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleTransferir(metodo)}>
                      Transferir
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleHistorial(metodo)}>
                      Historial
                    </Button>
                  </div>
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
            onSuccess={(updatedMetodo: MetodoPago) => {
              updateMetodoSaldo(selectedMetodo.id!, updatedMetodo);
            }}
            metodo={selectedMetodo}
          />
        )}

        {selectedMetodo && (
          <TransferirDinero
            isOpen={isTransferirModalOpen}
            onClose={() => setTransferirModalOpen(false)}
            onSuccess={(updatedMetodo: MetodoPago) => {
              updateMetodoSaldo(selectedMetodo.id!, updatedMetodo);
            }}
            metodo={selectedMetodo}
          />
        )}

        {selectedMetodo && (
          <HistorialTransacciones
            isOpen={isHistorialModalOpen}
            onClose={() => setHistorialModalOpen(false)}
            metodo={selectedMetodo}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MetodosPago;