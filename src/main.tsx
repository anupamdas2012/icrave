import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";
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
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
      </BrowserRouter>
    </StoreProvider>
  </StrictMode>,
);
