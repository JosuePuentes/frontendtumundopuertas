import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { useEmpleado } from "@/hooks/useEmpleado";
interface empleado {
    id: string;
  nombreCompleto: string;
  permisos: string[];
  pin: string;
}

const permisosDisponibles = [
    "herreria",
    "masillar",
    "pintar",
    "facturacion",
    "envios",
    "produccion",
    "mantenimiento",
    "ayudante"
];

const CrearEmpleado: React.FC = () => {
    const [empleado, setEmpleado] = useState<empleado>({
        id: "",
        nombreCompleto: "",
        permisos: [],
        pin: "",
    });
    const [mensaje, setMensaje] = useState<string>("");
    const [errorMsg, setErrorMsg] = useState<string>("");
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        // Validación especial para el PIN
        if (name === "pin") {
            // Solo permitir números y máximo 4 dígitos
            const numericValue = value.replace(/\D/g, '').slice(0, 4);
            setEmpleado((prev) => ({ ...prev, [name]: numericValue }));
        } else {
            setEmpleado((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handlePermisoChange = (permiso: string) => {
        setEmpleado((prev) => {
            const permisos = prev.permisos.includes(permiso)
                ? prev.permisos.filter((p) => p !== permiso)
                : [...prev.permisos, permiso];
            return { ...prev, permisos };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMensaje("");
        setErrorMsg("");
        if (!empleado.id || !empleado.nombreCompleto || !empleado.pin) {
            setErrorMsg("Completa todos los campos obligatorios.");
            return;
        }
        
        if (empleado.pin.length !== 4) {
            setErrorMsg("El PIN debe tener exactamente 4 dígitos.");
            return;
        }
        const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
        try {
            const response = await fetch(`${apiUrl}/empleados`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    identificador: empleado.id,
                    nombreCompleto: empleado.nombreCompleto,
                    permisos: empleado.permisos,
                    pin: empleado.pin,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error de red o servidor.");
            }
            setMensaje("Empleado creado correctamente ✅");
            setEmpleado({ id: "", nombreCompleto: "", permisos: [], pin: "" });
        } catch (err: any) {
            setErrorMsg(err?.message || "Error de red o servidor.");
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-200 mt-8">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Crear Empleado</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="identificador">ID</Label>
                         <Input
                             id="id"
                             name="id"
                             value={empleado.id}
                             onChange={handleChange}
                             placeholder="ID de empleado"
                             className="mt-1"
                             required
                         />
                    </div>
                    <div>
                        <Label htmlFor="nombreCompleto">Nombre Completo</Label>
                        <Input
                            id="nombreCompleto"
                            name="nombreCompleto"
                            value={empleado.nombreCompleto}
                            onChange={handleChange}
                            placeholder="Nombre completo"
                            className="mt-1"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="pin">PIN de 4 dígitos</Label>
                        <Input
                            id="pin"
                            name="pin"
                            type="text"
                            value={empleado.pin}
                            onChange={handleChange}
                            placeholder="1234"
                            className="mt-1"
                            maxLength={4}
                            pattern="[0-9]{4}"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Solo números, máximo 4 dígitos
                        </p>
                    </div>
                    <div>
                        <Label>Permisos</Label>
                        <div className="flex flex-wrap gap-3 mt-2">
                            {permisosDisponibles.map((permiso) => (
                                <label key={permiso} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={empleado.permisos.includes(permiso)}
                                        onChange={() => handlePermisoChange(permiso)}
                                    />
                                    <span className="text-sm">{permiso}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <Button type="submit" className="w-full mt-4 font-bold py-2">
                        Crear Usuario
                    </Button>
                </form>
                {mensaje && (
                    <div className="mt-4 text-center text-green-600 font-semibold">
                        {mensaje}
                    </div>
                )}
                {errorMsg && (
                    <div className="mt-4 text-center text-red-600 font-semibold">
                        {errorMsg}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CrearEmpleado;
