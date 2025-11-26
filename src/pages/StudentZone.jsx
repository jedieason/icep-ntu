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
        if (!database || !auth) return;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        const studentRef = ref(database, 'icep-ntu');
        const unsubscribeData = onValue(studentRef, (snapshot) => {
            const val = snapshot.val();
            if (val) {
                setData(val);
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeData();
        };
    }, []);

    const handleLogin = async () => {
        if (!auth) {
            alert("Authentication service is not available.");
            return;
        }
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const handleLogout = () => {
        if (auth) {
            signOut(auth);
        }
    };

    const handleAttendanceChange = (name, date, value) => {
        if (!user) return;
        update(ref(database, `icep-ntu/attendance/${name}`), {
            [date]: value
        });
    };



    return (
        <div style={{ paddingTop: '80px', minHeight: '100vh', padding: '100px 2rem 2rem 2rem' }}>
            <h1 style={{
                textAlign: 'center',
                marginBottom: '2rem',
                fontSize: '3rem',
                fontWeight: '600',
                color: '#1d1d1f',
                letterSpacing: '-0.01em'
            }}>
                Student Zone
            </h1>

            <StudentTable
                data={data}
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onAttendanceChange={handleAttendanceChange}
            />

            <h2 style={{
                textAlign: 'center',
                marginTop: '4rem',
                marginBottom: '1rem',
                color: '#1d1d1f',
                fontWeight: '600'
            }}>
                Participation Analytics
            </h2>
            <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '2rem' }}>
                Drag to rotate the chart
            </p>

            <BarChart3D data={data?.participation} />
        </div>
    );
};

export default StudentZone;
