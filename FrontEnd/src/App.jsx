//react
import React, { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

//Production Context
import { ProductionProvider } from '@context/ProductionContext'

//Componentes principales
import GlobalDashboard from './pages/GlobalDashboard';
import { TablaGenericRouter } from './lines/TablaGeneric';
import MobileLogin from './pages/Login/MobileLogin';

function App() {
  const isNative = !Capacitor.isNativePlatform();
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // En versión móvil nativa (Capacitor), exigir login en memoria antes de mostrar cualquier información
  if (isNative && !currentUser) {
    return (
      <MobileLogin
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <>
      <ProductionProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <MobileLogin
                onLoginSuccess={(user) => {
                  setCurrentUser(user);
                  navigate("/tabla/electronics", { replace: true });
                }}
              />
            }
          />
          <Route path="/Dashboard" element={<GlobalDashboard />} />
          <Route path="/tabla/:lineId" element={<TablaGenericRouter />} />
          <Route path="*" element={<Navigate to="/tabla/electronics" replace />} />
        </Routes>
      </ProductionProvider>
    </>
  )
}

export default App;
