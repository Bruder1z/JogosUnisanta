import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import bcrypt from "bcryptjs";
import { supabase } from "../../services/supabaseClient";

const inputStyle = {
  background: "var(--bg-hover)",
  border: "1px solid var(--border-color)",
  padding: "12px",
  borderRadius: "var(--border-radius)",
  color: "var(--text-primary)",
  outline: "none",
  width: "100%",
};

const btnStyle: React.CSSProperties = {
  background: "var(--accent-color)",
  color: "white",
  border: "none",
  borderRadius: "var(--border-radius)",
  padding: "8px 16px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: 8,
  width: "100%",
};

const ForgotPassword: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    setError("");
    if (!email) {
      setError("Informe seu e-mail.");
      return;
    }
    setLoading(true);

    const { data: user, error: fetchError } = await supabase.from("users").select("id").eq("email", email).single();

    if (fetchError || !user) {
      setError("E-mail não encontrado.");
      setLoading(false);
      return;
    }

    const resetToken = String(Math.floor(10000 + Math.random() * 90000));

    const { error: updateError } = await supabase.from("users").update({ resettoken: resetToken }).eq("email", email);

    if (updateError) {
      setError("Erro ao gerar código. Tente novamente.");
      setLoading(false);
      return;
    }

    try {
      await emailjs.send("service_ii1iyfx", "template_lg0yza4", { email, code: resetToken }, "XvjwBC5uhPLAPa70n");
      setStep(2);
    } catch {
      setError("Código gerado, mas não foi possível enviar o e-mail. Tente novamente.");
    }

    setLoading(false);
  };

  const handleVerifyCode = async () => {
    setError("");
    if (!code) {
      setError("Digite o código recebido.");
      return;
    }
    setLoading(true);

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("resettoken")
      .eq("email", email)
      .single();

    setLoading(false);

    if (fetchError || !user) {
      setError("Erro ao verificar código.");
      return;
    }

    if (user.resettoken !== code) {
      setError("Código inválido. Verifique seu e-mail.");
      return;
    }

    setStep(3);
  };

  const handleChangePassword = async () => {
    setError("");
    if (!newPassword || !confirmPassword) {
      setError("Preencha todos os campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);

    const hashedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10));

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword, resettoken: null })
      .eq("email", email);

    setLoading(false);

    if (updateError) {
      setError("Erro ao redefinir senha. Tente novamente.");
      return;
    }

    if (onSuccess) onSuccess();
  };

  return (
    <div
      style={{
        marginTop: "10px",
        textAlign: "center",
        background: "rgba(0,0,0,0.04)",
        borderRadius: 8,
        padding: 16,
        maxWidth: 350,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
        {([1, 2, 3] as const).map((s) => (
          <div
            key={s}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: step >= s ? "var(--accent-color)" : "var(--border-color)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              transition: "background 0.2s",
            }}
          >
            {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            Informe seu e-mail para receber o código de verificação.
          </p>
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <button
            onClick={handleSendCode}
            disabled={loading}
            style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Enviando..." : "Enviar código"}
          </button>
        </>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
            Digite o código de 5 dígitos enviado para <strong>{email}</strong>.
          </p>
          <input
            type="text"
            placeholder="Código"
            maxLength={5}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            style={{ ...inputStyle, marginBottom: 8, letterSpacing: 8, textAlign: "center", fontSize: 20 }}
          />
          <button
            onClick={handleVerifyCode}
            disabled={loading}
            style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Verificando..." : "Confirmar código"}
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Crie sua nova senha.</p>
          <input
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <button
            onClick={handleChangePassword}
            disabled={loading}
            style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </>
      )}

      {error && <div style={{ color: "var(--accent-color)", marginTop: 8, fontSize: 12 }}>{error}</div>}
    </div>
  );
};

export default ForgotPassword;
