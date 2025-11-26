import React from 'react';

const StudentTable = ({ data, user, onLogin, onLogout, onAttendanceChange, onParticipationChange }) => {
    if (!data) return <div style={{ color: '#fff' }}>Loading data...</div>;

    // Extract dates and names
    // Assuming structure: attendance: { Name: { Date: bool } }
    const attendanceData = data?.attendance || {};
    const participationData = data?.participation || {};

    const names = Object.keys(attendanceData);
    const dates = names.length > 0 ? Object.keys(attendanceData[names[0]]).sort() : [];

    return (
        <div style={{ padding: '2rem', color: '#e0e0e0', background: 'rgba(5, 5, 16, 0.9)', borderRadius: '16px', border: '1px solid #00f0ff', boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, color: '#00f0ff' }}>Student Records</h2>
                <div>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span>Logged in as {user.displayName} (Edit Mode)</span>
                            <button onClick={handleLogout} style={buttonStyle}>Logout</button>
                        </div>
                    ) : (
                        <button onClick={handleLogin} style={buttonStyle}>Login with Google</button>
                    )}
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Name</th>
                            {dates.map(date => <th key={date} style={thStyle}>{date}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {names.map(name => (
                            <React.Fragment key={name}>
                                {/* Attendance Row */}
                                <tr style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                    <td style={tdStyle}>
                                        <strong>{name}</strong>
                                        <div style={{ fontSize: '0.8em', color: '#aaa' }}>Attendance</div>
                                    </td>
                                    {dates.map(date => (
                                        <td key={date} style={tdStyle}>
                                            {user ? (
                                                <input
                                                    type="checkbox"
                                                    checked={attendanceData[name]?.[date] || false}
                                                    onChange={(e) => onAttendanceChange(name, date, e.target.checked)}
                                                    style={{ accentColor: '#00f0ff', transform: 'scale(1.5)' }}
                                                />
                                            ) : (
                                                <span style={{
                                                    color: attendanceData[name]?.[date] ? '#00ff00' : '#ff0000',
                                                    fontSize: '1.2em'
                                                }}>
                                                    {attendanceData[name]?.[date] ? '✓' : '✗'}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                                {/* Participation Row */}
                                <tr>
                                    <td style={tdStyle}>
                                        <div style={{ fontSize: '0.8em', color: '#aaa', textAlign: 'right' }}>Participation</div>
                                    </td>
                                    {dates.map(date => (
                                        <td key={date} style={tdStyle}>
                                            {user ? (
                                                <input
                                                    type="number"
                                                    value={participationData[name]?.[date] || 0}
                                                    onChange={(e) => onParticipationChange(name, date, e.target.value)}
                                                    style={inputStyle}
                                                />
                                            ) : (
                                                <span style={{ color: '#00f0ff' }}>{participationData[name]?.[date] || 0}</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const thStyle = {
    padding: '1rem',
    textAlign: 'center',
    borderBottom: '1px solid #333',
    color: '#00f0ff'
};

const tdStyle = {
    padding: '1rem',
    textAlign: 'center',
    borderBottom: '1px solid #333'
};

const buttonStyle = {
    background: 'transparent',
    border: '1px solid #00f0ff',
    color: '#00f0ff',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease'
};

const inputStyle = {
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid #555',
    color: '#fff',
    padding: '0.2rem',
    width: '50px',
    textAlign: 'center',
    borderRadius: '4px'
};

export default StudentTable;
