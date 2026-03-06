import { type FC } from 'react';
import { Search, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header: FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="glass" style={{
            height: 'var(--header-height)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid var(--border-color)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                <Link to="/" style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '-1px', textDecoration: 'none', color: 'inherit' }}>
                    <span style={{ color: 'var(--accent-color)' }}>JOGOS</span> UNISANTA
                </Link>

                <nav style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: 500 }}>
                    <Link to="/" style={{
                        color: isActive('/') ? 'var(--text-primary)' : 'var(--text-secondary)',
                        textDecoration: 'none',
                        transition: 'color 0.2s'
                    }}>Resultados</Link>
                    <Link to="/participantes" style={{
                        color: isActive('/participantes') ? 'var(--text-primary)' : 'var(--text-secondary)',
                        textDecoration: 'none',
                        transition: 'color 0.2s'
                    }}>Participantes</Link>
                    <Link to="/noticias" style={{
                        color: isActive('/noticias') ? 'var(--text-primary)' : 'var(--text-secondary)',
                        textDecoration: 'none',
                        transition: 'color 0.2s'
                    }}>Notícias</Link>
                    <Link to="/simulador" style={{
                        color: isActive('/simulador') ? 'var(--text-primary)' : 'var(--text-secondary)',
                        textDecoration: 'none',
                        transition: 'color 0.2s'
                    }}>Simulador</Link>
                </nav>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-hover)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    gap: '8px',
                    border: '1px solid var(--border-color)'
                }}>
                    <Search size={16} color="var(--text-secondary)" />
                    <input
                        type="text"
                        placeholder="Buscar jogos, atletas..."
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            outline: 'none',
                            width: '200px'
                        }}
                    />
                </div>

                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--accent-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}>
                            {user.name[0]}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600 }}>{user.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{user.role}</div>
                        </div>
                        {user.role === 'superadmin' && (
                            <button title="Dashboard Admin" style={{ color: 'var(--text-secondary)' }}>
                                <LayoutDashboard size={20} />
                            </button>
                        )}
                        <button onClick={logout} title="Sair" style={{ color: 'var(--text-secondary)' }}>
                            <LogOut size={20} />
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UserIcon size={20} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
                        <button style={{
                            padding: '8px 16px',
                            borderRadius: 'var(--border-radius)',
                            background: 'var(--accent-color)',
                            fontWeight: 700,
                            fontSize: '13px',
                            color: 'white'
                        }}>
                            Login / Cadastro
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
