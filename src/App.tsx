import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import Home from './pages/Home';
import News from './pages/News';
import Participants from './pages/Participants';
import History from './pages/History';
import Transmissao from './pages/Transmissao';
import MelhoresAtletas from './pages/MelhoresAtletas';
import Estatisticas from './pages/Estatisticas';
import Simulator from './pages/Simulator';
import MatchControl from './pages/MatchControl';
import Calendario from './pages/Calendario';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './components/context/DataContext';
import { SidebarProvider } from './context/SidebarContext';
import { NotificationProvider } from './components/NotificationContext';
import Login from './pages/Login';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole: string;
};

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user } = useAuth();
  console.log(user);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  const { isLoginModalOpen, closeLoginModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const joinId = params.get('join');
    if (joinId && location.pathname !== '/palpitometro') {
      navigate(`/palpitometro?join=${joinId}`, { replace: true });
    }
  }, [location, navigate]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/noticias" element={<News />} />
        <Route path="/participantes" element={<Participants />} />
        <Route path="/melhores-atletas" element={<MelhoresAtletas />} />
        <Route path="/estatisticas" element={<Estatisticas />} />
        <Route path="/historia" element={<History />} />
        <Route path="/transmissao" element={<Transmissao />} />
        <Route path="/palpitometro" element={<Simulator />} />
        <Route path='/controle-partida' element={
          <ProtectedRoute requiredRole="superadmin">
            <MatchControl />
          </ProtectedRoute>
        } />
        <Route path="/calendario" element={<Calendario />} />
      </Routes>
      {isLoginModalOpen && <Login onClose={closeLoginModal} />}
    </>
  );
};


function App() {
  return (
    <Router>
      <NotificationProvider>
        <DataProvider>
          <SidebarProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </SidebarProvider>
        </DataProvider>
      </NotificationProvider>
    </Router>
  );
}


export default App;

//refatore esse código de forma mais simples, sem perder a funcionalidade, e usando o react-router-dom v6.4 ou superior, utilizando os loaders e actions para lidar com autenticação e redirecionamento.