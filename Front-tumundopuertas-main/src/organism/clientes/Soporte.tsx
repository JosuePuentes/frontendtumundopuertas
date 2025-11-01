import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Soporte: React.FC = () => {
  const [form, setForm] = useState({ asunto: "", mensaje: "" });
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar envío de soporte
    setEnviado(true);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold text-white mb-6">Soporte</h2>
      {enviado ? (
        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 text-green-400">
          Tu mensaje ha sido enviado exitosamente
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-200">Asunto</Label>
            <Input
              value={form.asunto}
              onChange={(e) => setForm({ ...form, asunto: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-gray-200">Mensaje</Label>
            <Textarea
              value={form.mensaje}
              onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white mt-1"
              rows={6}
              required
            />
          </div>
          <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600">
            Enviar Mensaje
          </Button>
        </form>
      )}
    </div>
  );
};

export default Soporte;

