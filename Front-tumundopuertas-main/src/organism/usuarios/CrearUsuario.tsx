import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router";

const permisosDisponibles = [
    "asignar",
    "inventario",
    "ventas",
    "reportes",
    "empleados",
    "clientes",
    "admin",
    "crearusuarios",
    "crearclientes",
    "crearinventario",
    "crearempleados",
    "modificarusuarios",
    "modificarempleados",
    "modificarinventario",
    "modificarclientes",
    "monitorpedidos",
    "terminarasignacion",
    "dashboard",
    "dashboard-asignaciones",
    "panel-control-logistico",
    "pagos",
    "resumenVentaDiaria",
    "metodos_pago",
    "cuentas_por_pagar",
    "pedidos_web"
];

const CrearUsuario: React.FC = () => {
  const [error, setError] = useState<string>("");
  const [mensaje, setMensaje] = useState<string>("");
  const [form, setForm] = useState({
    usuario: "",
    nombreCompleto: "",
    identificador: "",
    permisos: [] as string[],
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermisoChip = (permiso: string) => {
    setForm((prev) => {
      const yaTiene = prev.permisos?.includes(permiso);
      return {
        ...prev,
        permisos: yaTiene
          ? prev.permisos?.filter((p) => p !== permiso)
          : [...(prev.permisos || []), permiso],
      };
    });
  };

  const validate = (): string | null => {
    if (!form.usuario.trim()) return "El usuario es obligatorio.";
    if (form.password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    if (!form.nombreCompleto.trim()) return "El nombre completo es obligatorio.";
    if (!form.identificador.trim()) return "El identificador es obligatorio.";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error al crear usuario");
      setMensaje("Usuario creado correctamente ✅");
      setForm({
        usuario: "",
        nombreCompleto: "",
        identificador: "",
        permisos: [],
        password: "",
      });
      navigate(`/crearusuario`);
    } catch (err: any) {
      setError("No se pudo crear el usuario");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-200 mt-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Crear Usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label htmlFor="usuario">Usuario</Label>
            <Input
              id="usuario"
              name="usuario"
              value={form.usuario}
              onChange={handleChange}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="nombreCompleto">Nombre Completo</Label>
            <Input
              id="nombreCompleto"
              name="nombreCompleto"
              value={form.nombreCompleto}
              onChange={handleChange}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="identificador">Identificador</Label>
            <Input
              id="identificador"
              name="identificador"
              value={form.identificador}
              onChange={handleChange}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="permisos">Permisos</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {permisosDisponibles.map((permiso) => (
                <Button
                  key={permiso}
                  type="button"
                  variant={form.permisos.includes(permiso) ? "default" : "outline"}
                  className={form.permisos.includes(permiso) ? "bg-green-500 text-white" : "bg-white border"}
                  onClick={() => handlePermisoChip(permiso)}
                >
                  {permiso}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1"
              placeholder="Contraseña"
              required
            />
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
        {error && (
          <div className="mt-4 text-center text-red-600 font-semibold">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CrearUsuario;