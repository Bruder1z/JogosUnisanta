import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
	import bcrypt from 'bcryptjs';

const inputStyle = {
	background: 'var(--bg-hover)',
	border: '1px solid var(--border-color)',
	padding: '12px',
	borderRadius: 'var(--border-radius)',
	color: 'var(--text-primary)',
	outline: 'none',
	width: '100%'
};

const ForgotPassword: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
	const [email, setEmail] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState('');
    
	const handleReset = async () => {
		setError('');
		setSuccess(false);
		if (!email || !newPassword || !confirmPassword) {
			setError('Preencha todos os campos.');
			return;
		}
		if (newPassword !== confirmPassword) {
			setError('As senhas não coincidem.');
			return;
		}
		const salt = bcrypt.genSaltSync(10);
		const hashedPassword = bcrypt.hashSync(newPassword, salt);
		const { error: updateError, data } = await supabase
			.from('users')
			.update({ password: hashedPassword })
			.eq('email', email)
			.select('*');
		if (updateError) {
			setError('Não foi possível redefinir a senha. Verifique o e-mail.');
		} else if (data && data.length > 0) {
			setSuccess(true);
			if (onSuccess) onSuccess();
		} else {
			setError('E-mail não encontrado.');
		}
	};

	return (
		<div style={{ marginTop: '10px', textAlign: 'center', background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: 16, maxWidth: 350, marginLeft: 'auto', marginRight: 'auto' }}>
			<input
				type="email"
				placeholder="Seu e-mail"
				value={email}
				onChange={e => setEmail(e.target.value)}
				style={{ ...inputStyle, marginBottom: 8 }}
			/>
			<input
				type="password"
				placeholder="Nova senha"
				value={newPassword}
				onChange={e => setNewPassword(e.target.value)}
				style={{ ...inputStyle, marginBottom: 8 }}
			/>
			<input
				type="password"
				placeholder="Confirmar nova senha"
				value={confirmPassword}
				onChange={e => setConfirmPassword(e.target.value)}
				style={{ ...inputStyle, marginBottom: 8 }}
			/>
			<button type="button" onClick={handleReset} style={{ background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: 'var(--border-radius)', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>
				Redefinir senha
			</button>
			{success && <div style={{ color: 'var(--success-color)', marginTop: 8, fontSize: 12 }}>Senha redefinida com sucesso!</div>}
			{error && <div style={{ color: 'var(--accent-color)', marginTop: 8, fontSize: 12 }}>{error}</div>}
		</div>
	);
};

export default ForgotPassword;
