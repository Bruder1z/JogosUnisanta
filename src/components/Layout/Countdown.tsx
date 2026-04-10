import { useState, useEffect, type FC } from 'react';

const Countdown: FC = () => {
    // Target date: May 04, 2026, 19:00:00
    const targetDate = new Date('2026-05-04T19:00:00').getTime();

    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000)
                });
            } else {
                clearInterval(interval);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="premium-card hover-glow" style={{ padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '12px', marginBottom: '15px', color: 'var(--accent-color)', fontWeight: 800, textAlign: 'center', letterSpacing: '0.5px' }}>
                ⏳ CONTAGEM REGRESSIVA PARA A ABERTURA
            </h3>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }}>
                <TimeUnit value={formatNumber(timeLeft.days)} label="DIAS" />
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '20px', display: 'flex', alignItems: 'center' }}>:</span>
                <TimeUnit value={formatNumber(timeLeft.hours)} label="HORAS" />
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '20px', display: 'flex', alignItems: 'center' }}>:</span>
                <TimeUnit value={formatNumber(timeLeft.minutes)} label="MIN" />
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '20px', display: 'flex', alignItems: 'center' }}>:</span>
                <TimeUnit value={formatNumber(timeLeft.seconds)} label="SEG" />
            </div>
        </div>
    );
};

const TimeUnit: FC<{ value: string; label: string }> = ({ value, label }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid var(--accent-color)',
        borderRadius: '8px',
        padding: '8px',
        minWidth: '50px',
        flex: 1
    }}>
        <span style={{
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.5rem',
            fontFamily: 'monospace',
            lineHeight: 1
        }}>
            {value}
        </span>
        <span style={{
            color: 'var(--text-secondary)',
            fontSize: '10px',
            fontWeight: 700,
            marginTop: '4px'
        }}>
            {label}
        </span>
    </div>
);

export default Countdown;
