import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";

interface MetodoPago {
    nombre: string;
    banco: string;
    numero_cuenta: string;
    titular: string;
    moneda: string;
}

const CrearMetodoPago: React.FC = () => {
    const [metodoPago, setMetodoPago] = useState<MetodoPago>({
        nombre: "",
        banco: "",
        numero_cuenta: "",
        titular: "",
        moneda: "",
    });
    const [mensaje, setMensaje] = useState<string>("");
    const [errorMsg, setErrorMsg] = useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMetodoPago((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof MetodoPago, value: string) => {
        setMetodoPago((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMensaje("");
        setErrorMsg("");
        if (!metodoPago.nombre || !metodoPago.banco || !metodoPago.titular) {
            setErrorMsg("Completa todos los campos obligatorios.");
            return;
        }
        try {
            await api("/metodos-pago", {
                method: "POST",
                body: JSON.stringify(metodoPago),
            });
            setMensaje("Método de pago creado correctamente ✅");
            setMetodoPago({
                nombre: "",
                banco: "",
                numero_cuenta: "",
                titular: "",
                moneda: "",
            });
        } catch (err: any) {
            setErrorMsg(err?.message || "Error de red o servidor.");
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-200 mt-8">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Crear Método de Pago</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="nombre">Nombre del Método</Label>
                        <Input
                            id="nombre"
                            name="nombre"
                            value={metodoPago.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Zelle, Efectivo, Transferencia Banesco"
                            className="mt-1"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="banco">Banco</Label>
                        <Input
                            id="banco"
                            name="banco"
                            value={metodoPago.banco}
                            onChange={handleChange}
                            placeholder="Nombre del banco"
                            className="mt-1"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="titular">Nombre del Titular</Label>
                        <Input
                            id="titular"
                            name="titular"
                            value={metodoPago.titular}
                            onChange={handleChange}
                            placeholder="Nombre del titular de la cuenta"
                            className="mt-1"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="numero_cuenta">Número de Cuenta</Label>
                        <Input
                            id="numero_cuenta"
                            name="numero_cuenta"
                            value={metodoPago.numero_cuenta}
                            onChange={handleChange}
                            placeholder="Número de cuenta o correo para Zelle"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="moneda">Moneda</Label>
                        <Select onValueChange={(value) => handleSelectChange("moneda", value)} value={metodoPago.moneda}>
                            <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder="Selecciona la moneda" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">Dólar (USD)</SelectItem>
                                <SelectItem value="Bs">Bolívares (Bs)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full mt-4 font-bold py-2">
                        Crear Método de Pago
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

export default CrearMetodoPago;
