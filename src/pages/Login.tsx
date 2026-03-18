import { useState, type FC, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { AVAILABLE_COURSES, AVAILABLE_SPORTS } from '../data/mockData';

const Login: FC<{ onClose: () => void }> = ({ onClose }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        surname: '',
        preferredCourse: '',
        preferredSport: ''
    });
    const [error, setError] = useState('');
    const { login, register } = useAuth();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (isRegister) {
            if (formData.password !== formData.confirmPassword) {
                setError('As senhas não coincidem.');
                return;
            }
            if (!formData.preferredCourse || !formData.preferredSport) {
                setError('Por favor, selecione seu curso e esporte de preferência.');
                return;
            }
            const registerData = {
                email: formData.email,
                name: formData.name,
                surname: formData.surname,
                preferredCourse: formData.preferredCourse,
                favoriteTeam: '',
                password: formData.password
            };
            const success = await register(registerData);
            if (success) onClose();
        } else {
            const success = await login(formData.email, formData.password);
            if (success) {
                onClose();
            } else {
                setError('Credenciais inválidas.');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="premium-card" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '40px',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <h2 style={{ marginBottom: '10px', textAlign: 'center' }}>
                    {isRegister ? 'Criar sua conta' : 'Bem-vindo de volta'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', marginBottom: '30px' }}>
                    {isRegister ? 'Cadastre-se para participar dos Jogos Unisanta' : 'Acesse para interagir nos Jogos Unisanta'}
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(227, 6, 19, 0.1)',
                        color: 'var(--accent-color)',
                        padding: '12px',
                        borderRadius: 'var(--border-radius)',
                        fontSize: '13px',
                        marginBottom: '20px',
                        border: '1px solid var(--accent-color)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {isRegister && (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nome</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Nome"
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Sobrenome</label>
                                <input
                                    name="surname"
                                    value={formData.surname}
                                    onChange={handleChange}
                                    placeholder="Sobrenome"
                                    style={inputStyle}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>E-mail</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="seu@email.com"
                            style={inputStyle}
                            required
                        />
                    </div>

                    {isRegister && (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Curso</label>
                                <select
                                    name="preferredCourse"
                                    value={formData.preferredCourse}
                                    onChange={handleChange}
                                    style={inputStyle}
                                    required
                                >
                                    <option value="" disabled>Selecione seu curso</option>
                                    {AVAILABLE_COURSES.map(course => (
                                        <option key={course} value={course}>{course}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Esporte de interesse</label>
                                <select
                                    name="preferredSport"
                                    value={formData.preferredSport}
                                    onChange={handleChange}
                                    style={inputStyle}
                                    required
                                >
                                    <option value="" disabled>Selecione seu esporte</option>
                                    {AVAILABLE_SPORTS.map(sport => (
                                        <option key={sport} value={sport}>{sport}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Senha</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            style={inputStyle}
                            required
                        />
                    </div>

                    {isRegister && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Confirmar Senha</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                style={inputStyle}
                                required
                            />
                        </div>
                    )}

                    <button type="submit" style={{
                        background: 'var(--accent-color)',
                        color: 'white',
                        padding: '14px',
                        borderRadius: 'var(--border-radius)',
                        fontWeight: 'bold',
                        marginTop: '10px',
                        fontSize: '15px'
                    }}>
                        {isRegister ? 'Finalizar Cadastro' : 'Entrar'}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsRegister(!isRegister)}
                        style={{ color: 'var(--accent-color)', fontSize: '14px', fontWeight: 600 }}
                    >
                        {isRegister ? 'Já tem uma conta? Faça Login' : 'Ainda não tem conta? Cadastre-se'}
                    </button>

                    <button type="button" onClick={onClose} style={{
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                    }}>
                        Voltar para o site
                    </button>
                </form>

                {!isRegister && (
                    <div style={{ marginTop: '30px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        <p>Super Admin: superadmin@gmail.com</p>
                        <p>Cliente: cliente@gmail.com</p>
                        <p>Senha: @123123</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const inputStyle = {
    background: 'var(--bg-hover)',
    border: '1px solid var(--border-color)',
    padding: '12px',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%'
};

export default Login;
