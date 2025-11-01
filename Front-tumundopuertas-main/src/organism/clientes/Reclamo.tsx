import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Reclamo: React.FC = () => {
  const [form, setForm] = useState({ titulo: "", descripcion: "" });
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar envío de reclamo
    setEnviado(true);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold text-white mb-6">Reclamo</h2>
      {enviado ? (
        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 text-green-400">
          Tu reclamo ha sido enviado exitosamente
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-200">Título</Label>
            <Input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-gray-200">Descripción</Label>
            <Textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              rows={6}
              required
            />
          </div>
          <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600">
            Enviar Reclamo
          </Button>
        </form>
      )}
    </div>
  );
};

export default Reclamo;

