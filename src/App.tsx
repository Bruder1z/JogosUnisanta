import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import News from './pages/News';
import Participants from './pages/Participants';
import History from './pages/History';
import Transmissao from './pages/Transmissao';
import MelhoresAtletas from './pages/MelhoresAtletas';
import Simulator from './pages/Simulator';
import MatchControl from './pages/MatchControl';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './components/context/DataContext';
import Login from './pages/Login';

const AppContent = () => {
  const { isLoginModalOpen, closeLoginModal } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/noticias" element={<News />} />
        <Route path="/participantes" element={<Participants />} />
        <Route path="/melhores-atletas" element={<MelhoresAtletas />} />
        <Route path="/historia" element={<History />} />
        <Route path="/transmissao" element={<Transmissao />} />
        <Route path="/simulador" element={<Simulator />} />
        <Route path="/controle-partida" element={<MatchControl />} />
      </Routes>
      {isLoginModalOpen && <Login onClose={closeLoginModal} />}
    </>
  );
};

function App() {
  return (
    <Router>
      <DataProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </DataProvider>
    </Router>
  );
}


export default App;
