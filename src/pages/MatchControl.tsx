import { type FC } from 'react';
import Header from '../components/Navigation/Header';
import Sidebar from '../components/Layout/Sidebar.tsx';
import MatchTimeline from '../components/Match/MatchTimeline';

const MatchControl: FC = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div style={{
                flex: 1,
                marginLeft: 'var(--sidebar-width)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Header />
                <main style={{
                    flex: 1,
                    marginTop: 'var(--header-height)',
                    overflow: 'auto'
                }}>
                    <MatchTimeline />
                </main>
            </div>
        </div>
    );
};

export default MatchControl;
