import React from 'react';
import Earth3D from '../components/Earth3D';

const Section = ({ title, children, style }) => (
    <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '10% 15%',
        color: '#2c3e50',
        ...style
    }}>
        {title && (
            <h2 style={{
                fontSize: '3rem',
                marginBottom: '2rem',
                color: '#0056b3',
                textShadow: 'none'
            }}>
                {title}
            </h2>
        )}
        <div style={{
            fontSize: '1.2rem',
            lineHeight: '1.8',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '2rem',
            borderRadius: '16px',
            border: '1px solid rgba(0, 86, 179, 0.1)',
            backdropFilter: 'blur(5px)',
            maxWidth: '800px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
            {children}
        </div>
    </section>
);

const About = () => {
    return (
        <Earth3D>
            {/* Initial scroll space for zoom animation */}
            <div style={{ height: '150vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <h1 style={{
                    fontSize: '5rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: '#0056b3',
                    textShadow: '0 0 30px rgba(0, 86, 179, 0.2)',
                    marginTop: '20vh'
                }}>
                    ICEP<br />
                    <span style={{ fontSize: '2rem', letterSpacing: '0.5em', color: '#2c3e50' }}>CHAPTER IN NTU</span>
                </h1>
                <p style={{ marginTop: '2rem', color: '#555' }}>Scroll to explore</p>
            </div>

            <Section title="National Taiwan University College of Medicine">
                <p><strong>A Legacy of Excellence in Asian Healthcare</strong></p>
                <p>
                    The National Taiwan University College of Medicine (NTUCM) stands as the premier institution for medical education and research in Taiwan. Located in the heart of Taipei, it is the cornerstone of the National Taiwan University (NTU) system—the most prestigious comprehensive university in the nation. For over a century, NTUCM has served as the cradle of Taiwan’s medical leadership, dedicated to cultivating elite physicians and scientists who drive the advancement of global health.
                </p>
            </Section>

            <Section title="A Century of Heritage">
                <p>
                    The history of NTUCM mirrors the evolution of modern medicine in Taiwan. Its origins date back to 1897 with the founding of the Medical Training Institute. It was later established as the Faculty of Medicine under Taihoku Imperial University in 1936 during the Japanese era, and subsequently renamed National Taiwan University College of Medicine in 1945. The campus itself is a testament to this rich history. The original medical building, a designated historic monument built in the Renaissance style, stands in dialogue with modern research facilities, symbolizing the college's philosophy: a commitment to scientific innovation grounded in deep humanistic traditions.
                </p>
            </Section>

            <Section title="Pioneering Contributions">
                <p>NTUCM and its teaching hospital, National Taiwan University Hospital (NTUH), have long been recognized as a hub for groundbreaking medical achievements that have influenced healthcare protocols worldwide:</p>

                <h3 style={{ color: '#00f0ff', marginTop: '1rem' }}>Hepatitis Control & Liver Disease</h3>
                <p>NTUCM is world-renowned for its pivotal role in the fight against Hepatitis. The research team led by Professors Beasley and Chen Ding-shing proved the vertical transmission pathway of the Hepatitis B virus. This discovery laid the scientific foundation for Taiwan to launch the world’s first universal Hepatitis B vaccination program in 1984—a public health triumph that has since been adopted globally to prevent liver cancer.</p>

                <h3 style={{ color: '#00f0ff', marginTop: '1rem' }}>Snake Venom Research</h3>
                <p>Since the mid-20th century, the Pharmacological Institute at NTUCM has been a global leader in snake venom research. These studies have not only saved lives through antivenom development but have also isolated key proteins used in studying blood coagulation and nerve transmission mechanisms.</p>

                <h3 style={{ color: '#00f0ff', marginTop: '1rem' }}>Clinical Innovation</h3>
                <p>The institution remains at the forefront of critical care and surgery, boasting world-class achievements in organ transplantation, microsurgery, and ECMO (Extracorporeal Membrane Oxygenation) applications.</p>
            </Section>

            <Section title="Taiwan’s Role in the International Medical Community">
                <p>
                    Situated at a critical geographic and technological nexus in Asia, Taiwan offers a unique environment for medical study. The nation is celebrated for its National Health Insurance (NHI) system, which provides universal coverage with high efficiency and accessibility, frequently ranked among the best in the world. Furthermore, Taiwan’s robust IT industry allows for the seamless integration of smart medicine and big data analytics into clinical practice.
                </p>
                <p style={{ marginTop: '1rem' }}>
                    As the leading medical institution in this dynamic environment, NTUCM continues to bridge East and West, combining advanced biomedical technology with comprehensive public health strategies. It remains a vital partner in the international medical community, committed to solving the health challenges of the 21st century.
                </p>
            </Section>
        </Earth3D>
    );
};

export default About;
