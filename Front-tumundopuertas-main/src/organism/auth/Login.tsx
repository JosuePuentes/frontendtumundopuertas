import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, X } from "lucide-react";

interface LoginResponse {
	access_token: string;
	token_type: string;
	permisos: string[];
	usuario: string;
	identificador?: string;
}

const Login: React.FC = () => {
	const [usuario, setUsuario] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const apiUrl = (import.meta.env.VITE_API_URL || "https://localhost:3000").replace('http://', 'https://');
			const res = await fetch(`${apiUrl}/auth/login/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ usuario, password })
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.detail || "Error de autenticación");
			}
			const data: LoginResponse = await res.json();
			localStorage.setItem("access_token", data.access_token);
			localStorage.setItem("usuario", data.usuario);
			localStorage.setItem("permisos", JSON.stringify(data.permisos));
			if (data.identificador) {
				localStorage.setItem("identificador", data.identificador);
			}
			// Redirigir o mostrar éxito
			window.location.href = "/";
		} catch (err: any) {
			setError(err.message || "Error desconocido");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 text-white overflow-hidden relative">
			{/* Futuristic Glitch Background - Crack Lines */}
			<div className="absolute inset-0">
				{/* Horizontal Crack Lines - Futuristic */}
				<div className="absolute top-20 left-0 w-full h-px bg-cyan-400 opacity-70" style={{
					clipPath: 'polygon(0% 0%, 20% 0%, 25% 100%, 30% 0%, 45% 0%, 50% 100%, 55% 0%, 70% 0%, 75% 100%, 80% 0%, 100% 0%)'
				}}></div>
				<div className="absolute top-40 left-0 w-full h-px bg-cyan-400 opacity-50" style={{
					clipPath: 'polygon(0% 0%, 15% 0%, 20% 100%, 35% 0%, 40% 100%, 45% 0%, 60% 0%, 65% 100%, 70% 0%, 85% 0%, 100% 0%)'
				}}></div>
				<div className="absolute bottom-40 left-0 w-full h-px bg-cyan-400 opacity-60" style={{
					clipPath: 'polygon(0% 0%, 10% 0%, 15% 100%, 30% 0%, 35% 100%, 40% 0%, 55% 0%, 60% 100%, 65% 0%, 80% 0%, 85% 100%, 100% 0%)'
				}}></div>
				<div className="absolute bottom-20 left-0 w-full h-px bg-cyan-400 opacity-40" style={{
					clipPath: 'polygon(0% 0%, 25% 0%, 30% 100%, 35% 0%, 50% 0%, 55% 100%, 60% 0%, 75% 0%, 80% 100%, 100% 0%)'
				}}></div>
				
				{/* Vertical Crack Lines - Futuristic */}
				<div className="absolute left-20 top-0 w-px h-full bg-cyan-400 opacity-50" style={{
					clipPath: 'polygon(0% 0%, 100% 20%, 0% 25%, 100% 40%, 0% 45%, 100% 60%, 0% 65%, 100% 80%, 0% 100%)'
				}}></div>
				<div className="absolute right-20 top-0 w-px h-full bg-cyan-400 opacity-40" style={{
					clipPath: 'polygon(0% 0%, 100% 15%, 0% 20%, 100% 35%, 0% 40%, 100% 55%, 0% 60%, 100% 75%, 0% 80%, 100% 100%)'
				}}></div>
				
				{/* Futuristic Grid Pattern - Minimal */}
				<div className="absolute inset-0 opacity-8" style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2306b6d4' fill-opacity='0.1'%3E%3Cpath d='M0 0h1v1H0z'/%3E%3Cpath d='M20 20h1v1h-1z'/%3E%3Cpath d='M40 40h1v1h-1z'/%3E%3Cpath d='M60 60h1v1h-1z'/%3E%3Cpath d='M79 79h1v1h-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
					backgroundSize: '80px 80px'
				}}></div>
				
				{/* Subtle Glitch Noise */}
				<div className="absolute inset-0 opacity-3" style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2306b6d4' fill-opacity='0.05'%3E%3Cpath d='M0 0h1v1H0z'/%3E%3Cpath d='M50 25h1v1h-1z'/%3E%3Cpath d='M100 75h1v1h-1z'/%3E%3Cpath d='M150 125h1v1h-1z'/%3E%3Cpath d='M199 199h1v1h-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
					backgroundSize: '200px 200px'
				}}></div>
			</div>
			
			{/* Header */}
			<header className="relative z-10 p-6">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center space-x-6">
						{/* New Logo */}
						<div className="relative">
							<div className="w-16 h-16 rounded-full border-2 border-cyan-400 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-lg shadow-cyan-400/30">
								<div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
									<div className="text-cyan-400 font-bold text-lg">
										<div className="text-xs leading-none">T</div>
										<div className="text-xs leading-none">M</div>
									</div>
								</div>
							</div>
							<div className="absolute inset-0 rounded-full border border-cyan-400 animate-pulse opacity-50"></div>
						</div>
						
						<div className="flex flex-col">
							<span className="text-2xl font-bold text-white tracking-wide">
								TU MUNDO PUERTAS
							</span>
							<div className="w-full h-px bg-gradient-to-r from-cyan-400 to-transparent mt-1"></div>
							<span className="text-sm text-gray-300 mt-1">
								DISEÑO, CALIDAD Y PROTECCIÓN
							</span>
						</div>
					</div>
					
					{/* Mobile Menu Button */}
					<button
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className="md:hidden text-white hover:text-cyan-400 transition-colors duration-300"
					>
						{isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
					</button>
					
					{/* Desktop Navigation */}
					<nav className="hidden md:flex space-x-8">
						<a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 relative group">
							Inicio
							<div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
						</a>
						<a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 relative group">
							Productos
							<div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
						</a>
						<a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 relative group">
							Proyectos
							<div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
						</a>
						<a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 relative group">
							Servicios
							<div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
						</a>
						<a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 relative group">
							Contacto
							<div className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></div>
						</a>
					</nav>
				</div>
				
				{/* Mobile Navigation */}
				{isMenuOpen && (
					<div className="md:hidden mt-4 bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
						<nav className="flex flex-col space-y-4">
							<a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Inicio</a>
							<a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Productos</a>
							<a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Proyectos</a>
							<a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Servicios</a>
							<a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors duration-300">Contacto</a>
						</nav>
					</div>
				)}
			</header>

			{/* Login Form */}
			<main className="relative z-10 flex items-center justify-center min-h-[80vh] px-6">
				<Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur-sm">
					<CardHeader className="text-center">
						<CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
							Iniciar Sesión
						</CardTitle>
						<p className="text-gray-300 mt-2">Accede a tu cuenta</p>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="usuario" className="text-gray-300">Usuario</Label>
								<Input
									id="usuario"
									type="text"
									value={usuario}
									onChange={e => setUsuario(e.target.value)}
									className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
									placeholder="Ingresa tu usuario"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password" className="text-gray-300">Contraseña</Label>
								<Input
									id="password"
									type="password"
									value={password}
									onChange={e => setPassword(e.target.value)}
									className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
									placeholder="Ingresa tu contraseña"
									required
								/>
							</div>
							{error && (
								<div className="text-red-400 text-center bg-red-900/20 border border-red-500/30 rounded-lg p-3">
									{error}
								</div>
							)}
							<Button
								type="submit"
								className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
								disabled={loading}
							>
								{loading ? "Ingresando..." : "Ingresar"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</main>
		</div>
	);
};

export default Login;
