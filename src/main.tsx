import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./components/layout/theme-provider";
import { ProtectedRoute } from "./components/auth/route-components";
import "./index.css";

// Pages
import Index from "./pages";
import LoginForm from "./pages/login";
import SignupForm from "./pages/signup";
import Logout from "./pages/logout";
import Operations from "./pages/operations";
import Calculator from "./pages/calculator";
import Favorites from "./pages/favorites";
import History from "./pages/history";
import Settings from "./pages/settings";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<ProtectedRoute Component={Index} />} />
            <Route path='/login' element={<LoginForm />} />
            <Route path='/signup' element={<SignupForm />} />
            <Route path='/logout' element={<Logout />} />
            <Route path='/operations' element={<ProtectedRoute Component={Operations} />} />
            <Route path='/calculator' element={<ProtectedRoute Component={Calculator} />} />
            <Route path='/favorites' element={<ProtectedRoute Component={Favorites} />} />
            <Route path='/history' element={<ProtectedRoute Component={History} />} />
            <Route path='/settings' element={<ProtectedRoute Component={Settings} />} />
          </Routes>
        </BrowserRouter>
        <Sonner />
        <Toaster />
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);