import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import api from "@/lib/api";

interface Empleado {
  _id: string;
  identificador: string;
  nombreCompleto: string;
  permisos: string[];
}


const permisosDisponibles = [
  "herreria",
  "masillar",
  "pintar",
  "facturacion",
  "envios",
  "produccion",
  "mantenimiento",
  "fabricacion",
  "ayudante",
  "manillar",
  "resumenVentaDiaria"
];

const empleadoSchema = z.object({
  _id: z.string().optional(),
  identificador: z.string().min(1, "ID requerido"),
  nombreCompleto: z.string().min(1, "Nombre requerido"),
  permisos: z.array(z.string()),
});

type EmpleadoForm = z.infer<typeof empleadoSchema>;

const ModificarEmpleado: React.FC = () => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  const [mensaje, setMensaje] = useState<string>("");
  
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmpleadoForm>({
    resolver: zodResolver(empleadoSchema),
    defaultValues: {
      _id: "",
      identificador: "",
      nombreCompleto: "",
      permisos: [],
    },
  });

  useEffect(() => {
    const fetchEmpleados = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api("/empleados/all");
        setEmpleados(data);
      } catch (err: any) {
        setError(`No se pudieron cargar los empleados: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchEmpleados();
  }, []);

  useEffect(() => {
    if (empleadoSeleccionado) {
      setValue("_id", empleadoSeleccionado._id);
      setValue("identificador", empleadoSeleccionado.identificador);
      setValue("nombreCompleto", empleadoSeleccionado.nombreCompleto);
      setValue("permisos", empleadoSeleccionado.permisos);
    }
  }, [empleadoSeleccionado, setValue]);

  const permisosForm = watch("permisos");

  const handleSelectEmpleado = (id: string) => {
    const empleado = empleados.find((u) => u._id === id) || null;
    setEmpleadoSeleccionado(empleado);
    setMensaje("");
  };

  const onSubmit = async (data: EmpleadoForm) => {
    setMensaje("");
    setError("");
    try {
      const updated = await api(`/empleados/${data._id}`, {
        method: "PUT",
        body: JSON.stringify({
          identificador: data.identificador,
          nombreCompleto: data.nombreCompleto,
          permisos: data.permisos,
        }),
      });
      setEmpleados((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      setMensaje("Empleado modificado correctamente ✅");
      setEmpleadoSeleccionado(updated);
      navigate(`/modificarempleado`);
    } catch (err: any) {
      setError("No se pudo modificar el empleado");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-200 mt-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Modificar Empleado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="selectUsuario">Selecciona un empleado</Label>
          {loading ? (
            <div className="mt-2 text-gray-500">Cargando empleados...</div>
          ) : error ? (
            <div className="mt-2 text-red-500">{error}</div>
          ) : (
            <select
              id="selectUsuario"
              className="mt-1 w-full border rounded px-2 py-2"
              value={empleadoSeleccionado?._id || ""}
              onChange={(e) => handleSelectEmpleado(e.target.value)}
            >
              <option value="">-- Selecciona --</option>
              {empleados.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.nombreCompleto} ({u.identificador})
                </option>
              ))}
            </select>
          )}
        </div>
        {empleadoSeleccionado && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="identificador">ID</Label>
              <Input
                id="identificador"
                {...register("identificador")}
                className="mt-1"
                required
              />
              {errors.identificador && <span className="text-red-600 text-xs">{errors.identificador.message}</span>}
            </div>
            <div>
              <Label htmlFor="nombreCompleto">Nombre Completo</Label>
              <Input
                id="nombreCompleto"
                {...register("nombreCompleto")}
                className="mt-1"
                required
              />
              {errors.nombreCompleto && <span className="text-red-600 text-xs">{errors.nombreCompleto.message}</span>}
            </div>
            <div>
              <Label>Permisos</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {permisosDisponibles.map((permiso) => (
                  <label key={permiso} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Array.isArray(permisosForm) && permisosForm.includes(permiso)}
                      onChange={() => {
                        const actual = Array.isArray(permisosForm)
                          ? (permisosForm.includes(permiso)
                              ? permisosForm.filter((p) => p !== permiso)
                              : [...permisosForm, permiso])
                          : [permiso];
                        setValue("permisos", actual);
                      }}
                    />
                    <span className="text-sm">{permiso}</span>
                  </label>
                ))}
              </div>
              {errors.permisos && <span className="text-red-600 text-xs">{errors.permisos.message}</span>}
            </div>
            <Button type="submit" className="w-full mt-4 font-bold py-2">
              Guardar Cambios
            </Button>
          </form>
        )}
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

export default ModificarEmpleado;