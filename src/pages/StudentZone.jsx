import React, { useState, useEffect } from 'react';
import { database, auth } from '../firebase';
import { ref, onValue, update } from 'firebase/database';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import StudentTable from '../components/StudentTable';
import BarChart3D from '../components/BarChart3D';

const StudentZone = () => {
    const [data, setData] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        const dataRef = ref(database, 'icep-ntu');
        const unsubscribeData = onValue(dataRef, (snapshot) => {
            const val = snapshot.val();
            if (val) {
                setData(val);
            } else {
                // Handle empty data if needed
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
            unsubscribeData();
        };
    }, []);

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const handleLogout = () => {
        signOut(auth);
    };

    const handleAttendanceChange = (name, date, value) => {
        if (!user) return;
        update(ref(database, `icep-ntu/attendance/${name}`), {
            [date]: value
        });
    };

    const handleParticipationChange = (name, date, value) => {
        if (!user) return;
        update(ref(database, `icep-ntu/participation/${name}`), {
            [date]: parseInt(value)
        });
    };

    return (
        <div style={{ paddingTop: '80px', minHeight: '100vh', padding: '100px 2rem 2rem 2rem' }}>
            <h1 style={{
                textAlign: 'center',
                marginBottom: '2rem',
                fontSize: '3rem',
                background: 'linear-gradient(90deg, #00f0ff, #7000ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Student Zone
            </h1>

            <StudentTable
                data={data}
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onAttendanceChange={handleAttendanceChange}
                onParticipationChange={handleParticipationChange}
            />

            <h2 style={{
                textAlign: 'center',
                marginTop: '4rem',
                marginBottom: '1rem',
                color: '#00f0ff'
            }}>
                Participation Analytics (3D)
            </h2>
            <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '2rem' }}>
                Drag to rotate the chart
            </p>

            <BarChart3D data={data?.participation} />
        </div>
    );
};

export default StudentZone;
