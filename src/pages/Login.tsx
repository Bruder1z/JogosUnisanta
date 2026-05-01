import React, { useState, type FC } from 'react';
import { useAuth } from '../context/AuthContext';
import { AVAILABLE_COURSES } from '../data/mockData';
import ForgotPassword from './components/ForgotPassword';

const Login: FC<{ onClose: () => void }> = ({ onClose }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmEmailAddr, setConfirmEmailAddr] = useState('');
    const [confirmCode, setConfirmCode] = useState('');
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        surname: '',
        preferredCourse: '',
        acceptTerms: false
    });
    const [error, setError] = useState('');
    const { login, register, confirmEmail, resendConfirmation } = useAuth();

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        setError('');

        if (isRegister) {
            if (formData.password !== formData.confirmPassword) {
                setError('As senhas não coincidem.');
                return;
            }
            if (!formData.preferredCourse) {
                setError('Por favor, selecione seu curso.');
                return;
            }
            if (!formData.acceptTerms) {
                setError('Você precisa aceitar os termos de tratamento de dados para continuar.');
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
            const result = await register(registerData);
            if (result.success && result.pendingEmail) {
                setConfirmEmailAddr(result.pendingEmail);
                setShowConfirmation(true);
            } else {
                setError('Erro ao criar conta. E-mail já cadastrado ou dados inválidos.');
            }
        } else {
            const result = await login(formData.email, formData.password);
            if (result === 'ok') {
                onClose();
            } else if (result === 'unconfirmed') {
                setConfirmEmailAddr(formData.email);
                setShowConfirmation(true);
            } else {
                setError('E-mail ou senha inválidos.');
            }
        }
    };

    const handleConfirm = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        setError('');
        if (!confirmCode || confirmCode.length !== 5) {
            setError('Digite o código de 5 dígitos enviado para seu e-mail.');
            return;
        }
        setConfirmLoading(true);
        const success = await confirmEmail(confirmEmailAddr, confirmCode);
        setConfirmLoading(false);
        if (success) {
            onClose();
        } else {
            setError('Código inválido ou expirado. Verifique seu e-mail e tente novamente.');
        }
    };

    const handleResend = async () => {
        setResendStatus('sending');
        const success = await resendConfirmation(confirmEmailAddr);
        setResendStatus(success ? 'sent' : 'error');
        setConfirmCode('');
        setError('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
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
            backdropFilter: 'blur(5px)',
            padding: '10px'
        }}>
            <div className="premium-card" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '16px',
                maxHeight: '95vh',
                overflowY: 'auto'
            }}>
                {showForgotPassword ? (
                    <>
                        <h2 style={{ marginBottom: '10px', textAlign: 'center' }}>Redefinir senha</h2>
                        <ForgotPassword onSuccess={() => setShowForgotPassword(false)} />
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                            <button type="button" onClick={() => setShowForgotPassword(false)} style={{ color: 'var(--accent-color)', fontSize: '14px', fontWeight: 600 }}>
                                Voltar para login
                            </button>
                        </div>
                    </>
                ) : showConfirmation ? (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                background: 'rgba(var(--accent-rgb, 227,6,19), 0.1)',
                                border: '2px solid var(--accent-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                fontSize: 24
                            }}>
                                ✉️
                            </div>
                            <h2 style={{ marginBottom: 8 }}>Confirme seu e-mail</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                                Enviamos um código de 5 dígitos para<br />
                                <strong style={{ color: 'var(--text-primary)' }}>{confirmEmailAddr}</strong>
                            </p>
                        </div>

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

                        {resendStatus === 'sent' && (
                            <div style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                color: '#22c55e',
                                padding: '12px',
                                borderRadius: 'var(--border-radius)',
                                fontSize: '13px',
                                marginBottom: '20px',
                                border: '1px solid #22c55e'
                            }}>
                                Novo código enviado! Verifique seu e-mail.
                            </div>
                        )}

                        <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>
                                    Código de confirmação
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={5}
                                    value={confirmCode}
                                    onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="00000"
                                    style={{
                                        ...inputStyle,
                                        textAlign: 'center',
                                        fontSize: '28px',
                                        letterSpacing: '12px',
                                        fontWeight: 700,
                                        padding: '16px',
                                    }}
                                    autoFocus
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={confirmLoading}
                                style={{
                                    background: 'var(--accent-color)',
                                    color: 'white',
                                    padding: '14px',
                                    borderRadius: 'var(--border-radius)',
                                    fontWeight: 'bold',
                                    fontSize: '15px',
                                    opacity: confirmLoading ? 0.7 : 1,
                                    cursor: confirmLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {confirmLoading ? 'Verificando...' : 'Confirmar conta'}
                            </button>

                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendStatus === 'sending'}
                                style={{
                                    color: 'var(--accent-color)',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    opacity: resendStatus === 'sending' ? 0.7 : 1,
                                    cursor: resendStatus === 'sending' ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {resendStatus === 'sending' ? 'Reenviando...' : 'Não recebeu o código? Reenviar'}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowConfirmation(false);
                                    setConfirmCode('');
                                    setError('');
                                    setResendStatus('idle');
                                }}
                                style={{ color: 'var(--text-secondary)', fontSize: '13px' }}
                            >
                                Voltar
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h2 style={{ marginBottom: '1px', textAlign: 'center', fontSize: '17px' }}>
                            {isRegister ? 'Criar sua conta' : 'Bem-vindo de volta'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'center', marginBottom: '8px' }}>
                            {isRegister ? 'Cadastre-se para participar dos Jogos Unisanta' : 'Acesse para interagir nos Jogos Unisanta'}
                        </p>

                        {error && (
                            <div style={{
                                background: 'rgba(227, 6, 19, 0.1)',
                                color: 'var(--accent-color)',
                                padding: '10px',
                                borderRadius: 'var(--border-radius)',
                                fontSize: '12px',
                                marginBottom: '12px',
                                border: '1px solid var(--accent-color)'
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {isRegister && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nome</label>
                                            <input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Nome"
                                                style={{ ...inputStyle, padding: '7px 10px' }}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Sobrenome</label>
                                            <input
                                                name="surname"
                                                value={formData.surname}
                                                onChange={handleChange}
                                                placeholder="Sobrenome"
                                                style={{ ...inputStyle, padding: '7px 10px' }}
                                                required
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>E-mail</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="seu@email.com"
                                    style={{ ...inputStyle, padding: '7px 10px' }}
                                    required
                                />
                            </div>

                            {isRegister && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Curso</label>
                                    <select
                                        name="preferredCourse"
                                        value={formData.preferredCourse}
                                        onChange={handleChange}
                                        style={{ ...inputStyle, padding: '7px 10px' }}
                                        required
                                    >
                                        <option value="" disabled>Selecione seu curso</option>
                                        {AVAILABLE_COURSES.map(course => (
                                            <option key={course} value={course}>{course}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Senha</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    style={{ ...inputStyle, padding: '7px 10px' }}
                                    required
                                />
                            </div>

                            {isRegister && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Confirmar Senha</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        style={{ ...inputStyle, padding: '7px 10px' }}
                                        required
                                    />
                                </div>
                            )}

                            {isRegister && (
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    gap: '7px', 
                                    marginTop: '2px'
                                }}>
                                    <input
                                        type="checkbox"
                                        name="acceptTerms"
                                        checked={formData.acceptTerms}
                                        onChange={handleChange}
                                        style={{
                                            width: '14px',
                                            height: '14px',
                                            cursor: 'pointer',
                                            accentColor: 'var(--accent-color)',
                                            flexShrink: 0
                                        }}
                                        required
                                    />
                                    <label style={{ 
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        lineHeight: '1.3',
                                        color: 'var(--text-primary)'
                                    }}>
                                        Li e aceito os{' '}
                                        <a 
                                            href="/politica-de-privacidade" 
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ 
                                                color: 'var(--accent-color)', 
                                                textDecoration: 'underline',
                                                fontWeight: 600
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Termos de Uso e Política de Privacidade
                                        </a>
                                    </label>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={isRegister && !formData.acceptTerms}
                                style={{
                                    background: (isRegister && !formData.acceptTerms) ? 'var(--bg-hover)' : 'var(--accent-color)',
                                    color: (isRegister && !formData.acceptTerms) ? 'var(--text-secondary)' : 'white',
                                    padding: '9px',
                                    borderRadius: 'var(--border-radius)',
                                    fontWeight: 'bold',
                                    marginTop: '4px',
                                    fontSize: '14px',
                                    cursor: (isRegister && !formData.acceptTerms) ? 'not-allowed' : 'pointer',
                                    opacity: (isRegister && !formData.acceptTerms) ? 0.6 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isRegister ? 'Finalizar Cadastro' : 'Entrar'}
                            </button>

                            {!isRegister && (
                                <button
                                    type="button"
                                    style={{ background: 'none', border: 'none', marginTop: 6 }}
                                    onClick={() => setShowForgotPassword(true)}
                                >
                                    Esqueceu sua senha? <span style={{ color: 'var(--accent-color)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>Clique aqui</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsRegister(!isRegister)}
                                style={{ color: 'var(--accent-color)', fontSize: '13px', fontWeight: 600, marginTop: '0px' }}
                            >
                                {isRegister ? 'Já tem uma conta? Faça Login' : 'Ainda não tem conta? Cadastre-se'}
                            </button>

                            <button type="button" onClick={onClose} style={{
                                color: 'var(--text-secondary)',
                                fontSize: '12px',
                                marginTop: '0px'
                            }}>
                                Voltar para o site
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

const inputStyle = {
    background: 'var(--bg-hover)',
    border: '1px solid var(--border-color)',
    padding: '8px 12px',
    borderRadius: 'var(--border-radius)',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
    fontSize: '13px'
};

export default Login;
