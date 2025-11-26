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
        <div style={{ padding: '2rem', color: '#2c3e50', background: 'rgba(255, 255, 255, 0.9)', borderRadius: '16px', border: '1px solid #e0e0e0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, color: '#0056b3' }}>Student Records</h2>
                <div>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span>Logged in as {user.displayName} (Edit Mode)</span>
                            <button onClick={onLogout} style={buttonStyle}>Logout</button>
                        </div>
                    ) : (
                        <button onClick={onLogin} style={buttonStyle}>Login with Google</button>
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
                                <tr style={{ background: 'rgba(0, 0, 0, 0.02)' }}>
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
    borderBottom: '1px solid #eee',
    color: '#0056b3'
};

const tdStyle = {
    padding: '1rem',
    textAlign: 'center',
    borderBottom: '1px solid #eee'
};

const buttonStyle = {
    background: 'transparent',
    border: '1px solid #0056b3',
    color: '#0056b3',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease'
};

const inputStyle = {
    background: '#fff',
    border: '1px solid #ccc',
    color: '#333',
    padding: '0.2rem',
    width: '50px',
    textAlign: 'center',
    borderRadius: '4px'
};

export default StudentTable;
