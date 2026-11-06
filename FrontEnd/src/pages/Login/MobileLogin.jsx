import React, { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import productionService from "@services/ProductionServices";
import { preloadProductionOnLogin } from "@hooks/useProductionData";
import logoNidecWhite from "@assets/nidecacim_white.png";
import "./MobileLogin.css";

const MobileLogin = ({ onLoginSuccess }) => {
    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Pre-carga silenciosa de las líneas en caché mientras el usuario escribe sus credenciales
    useEffect(() => {
        preloadProductionOnLogin();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        const cleanUsuario = usuario.trim();
        if (!cleanUsuario || !password) {
            setErrorMessage("Por favor ingresa tu número de nómina y contraseña.");
            return;
        }

        try {
            setLoading(true);
            const data = await productionService.login(cleanUsuario, password);

            if (data && data.success && data.user) {
                if (onLoginSuccess) {
                    onLoginSuccess(data.user);
                }
            } else {
                setErrorMessage(data?.message || "Credenciales inválidas.");
            }
        } catch (err) {
            const backendMsg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "No se pudo iniciar sesión. Verifica tus credenciales o la conexión.";
            setErrorMessage(backendMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mobile-login-screen">
            <div className="mobile-login-top">
                <img
                    src={logoNidecWhite}
                    alt="Nidec ACIM Logo"
                    className="mobile-login-logo"
                />
                <span className="mobile-login-badge">Tablas de Productividad</span>
            </div>

            <div className="mobile-login-card">
                <div className="mobile-login-card-header">
                    <h1>¡Bienvenido!</h1>
                    <p>Ingresa con tu número de nómina para continuar</p>
                </div>

                <form className="mobile-login-form" onSubmit={handleSubmit}>
                    <div className="mobile-login-field">
                        <label htmlFor="nomina-input">Número de Nómina</label>
                        <div className="mobile-login-input-wrapper">
                            <span className="mobile-login-input-icon">
                                <User size={18} />
                            </span>
                            <input
                                id="nomina-input"
                                type="text"
                                inputMode="numeric"
                                autoComplete="username"
                                placeholder="Ej: 32003087"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="mobile-login-field">
                        <label htmlFor="password-input">Contraseña</label>
                        <div className="mobile-login-input-wrapper">
                            <span className="mobile-login-input-icon">
                                <Lock size={18} />
                            </span>
                            <input
                                id="password-input"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="mobile-login-eye-btn"
                                onClick={() => setShowPassword((prev) => !prev)}
                                tabIndex={-1}
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="mobile-login-error" role="alert">
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="mobile-login-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-mini" style={{ borderLeftColor: "#ffffff" }}></span>
                                Validando...
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                Ingresar
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="mobile-login-footer">
                Nidec Global Appliance • GA COLD MX
            </div>
        </div>
    );
};

export default MobileLogin;
