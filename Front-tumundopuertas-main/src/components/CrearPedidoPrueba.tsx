import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { getApiUrl } from '../lib/api';

interface CrearPedidoPruebaProps {
  onPedidoCreado?: () => void;
}

const CrearPedidoPrueba: React.FC<CrearPedidoPruebaProps> = ({ onPedidoCreado }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cliente_nombre: 'Cliente Prueba',
    cliente_telefono: '1234567890',
    cliente_direccion: 'Dirección Prueba',
    descripcion: 'Pedido de prueba para verificar flujo de estados',
    items: [
      {
        nombre: 'Puerta Principal',
        descripcion: 'Puerta de prueba',
        categoria: 'Puerta',
        precio: 500000,
        costo: 300000,
        cantidad: 1,
        estado_item: 1
      }
    ]
  });

  const handleCrearPedido = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/pedidos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Pedido de prueba creado:', result);
      
      // Notificar que se creó un pedido
      if (onPedidoCreado) {
        onPedidoCreado();
      }
      
      // Cerrar modal
      setIsOpen(false);
      
      // Resetear formulario
      setFormData({
        cliente_nombre: 'Cliente Prueba',
        cliente_telefono: '1234567890',
        cliente_direccion: 'Dirección Prueba',
        descripcion: 'Pedido de prueba para verificar flujo de estados',
        items: [
          {
            nombre: 'Puerta Principal',
            descripcion: 'Puerta de prueba',
            categoria: 'Puerta',
            precio: 500000,
            costo: 300000,
            cantidad: 1,
            estado_item: 1
          }
        ]
      });
      
    } catch (error) {
      console.error('❌ Error creando pedido de prueba:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Crear Pedido Prueba
      </Button>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Crear Pedido de Prueba</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cliente_nombre">Nombre del Cliente</Label>
            <Input
              id="cliente_nombre"
              value={formData.cliente_nombre}
              onChange={(e) => setFormData({...formData, cliente_nombre: e.target.value})}
              placeholder="Nombre del cliente"
            />
          </div>
          <div>
            <Label htmlFor="cliente_telefono">Teléfono</Label>
            <Input
              id="cliente_telefono"
              value={formData.cliente_telefono}
              onChange={(e) => setFormData({...formData, cliente_telefono: e.target.value})}
              placeholder="Teléfono"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="cliente_direccion">Dirección</Label>
          <Input
            id="cliente_direccion"
            value={formData.cliente_direccion}
            onChange={(e) => setFormData({...formData, cliente_direccion: e.target.value})}
            placeholder="Dirección"
          />
        </div>
        
        <div>
          <Label htmlFor="descripcion">Descripción del Pedido</Label>
          <Textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
            placeholder="Descripción del pedido"
            rows={3}
          />
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Item de Prueba:</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item_nombre">Nombre del Item</Label>
              <Input
                id="item_nombre"
                value={formData.items[0].nombre}
                onChange={(e) => setFormData({
                  ...formData, 
                  items: [{
                    ...formData.items[0],
                    nombre: e.target.value
                  }]
                })}
                placeholder="Nombre del item"
              />
            </div>
            <div>
              <Label htmlFor="item_precio">Precio</Label>
              <Input
                id="item_precio"
                type="number"
                value={formData.items[0].precio}
                onChange={(e) => setFormData({
                  ...formData, 
                  items: [{
                    ...formData.items[0],
                    precio: Number(e.target.value)
                  }]
                })}
                placeholder="Precio"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCrearPedido}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Crear Pedido
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CrearPedidoPrueba;
