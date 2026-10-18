import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
import { DeviceFrame } from "./DeviceFrame";
import { StoreProvider } from "./store";
import {
  ActivityPage,
  ClaimPage,
  ClaimsPage,
  DishPage,
  GoNowPage,
  GoNowPinPage,
  MapPage,
  ProfilePage,
  TrailPage,
  TrailsPage,
} from "./pages";
import { PlantCapture, PlantDone, PlantLayout, PlantStart, PlantVouch } from "./PlantFlow";
import "leaflet/dist/leaflet.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <DeviceFrame>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<MapPage />} />
              <Route path="d/:id" element={<DishPage />} />
              <Route path="claim/:id" element={<ClaimPage />} />
              <Route path="go" element={<GoNowPage />} />
              <Route path="go/:id" element={<GoNowPinPage />} />
              <Route path="trails" element={<TrailsPage />} />
              <Route path="t/:id" element={<TrailPage />} />
              <Route path="claims" element={<ClaimsPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="plant" element={<PlantLayout />}>
                <Route index element={<PlantStart />} />
                <Route path="capture" element={<PlantCapture />} />
                <Route path="vouch" element={<PlantVouch />} />
                <Route path="done" element={<PlantDone />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </DeviceFrame>
    </StoreProvider>
  </StrictMode>,
);
