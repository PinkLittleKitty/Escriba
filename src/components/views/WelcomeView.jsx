import React from 'react';
import { GraduationCap, Folder, Zap, Sparkles, Plus } from 'lucide-react';
import { GitHubIcon } from '../common/Icons.jsx';
import { useUIStore } from '../../store/useUIStore.js';
import styles from './Welcome.module.css';

export const WelcomeView = () => {
  const openModal = useUIStore((state) => state.openModal);

  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.welcomeBgBlob} />
      <div className={styles.welcomeContent}>
        <div className={styles.welcomeHero}>
          <div className={styles.heroIconWrapper}>
            <GraduationCap size={32} />
          </div>
          <h1 className={styles.heroTitle}>¡Bienvenido a Escriba!</h1>
          <p className={styles.heroSubtitle}>
            Tu carpeta digital diseñada para organizar tus estudios con simplicidad, elegancia y
            potencia.
          </p>
        </div>

        <div className={styles.welcomeGrid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <Folder size={20} />
            </div>
            <h3 className={styles.cardTitle}>Organización Real</h3>
            <p className={styles.cardDesc}>
              Estructurá tus apuntes por materias y horarios, tal como en una carpeta física.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <Zap size={20} />
            </div>
            <h3 className={styles.cardTitle}>Búsqueda Veloz</h3>
            <p className={styles.cardDesc}>
              Encontrá conceptos, definiciones y palabras clave al instante en todos tus apuntes.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <GitHubIcon size={20} />
            </div>
            <h3 className={styles.cardTitle}>Nube & Sync</h3>
            <p className={styles.cardDesc}>
              Sincronizá con GitHub para tener tus apuntes seguros en tus computadoras y celulares.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <Sparkles size={20} />
            </div>
            <h3 className={styles.cardTitle}>Editor Inteligente</h3>
            <p className={styles.cardDesc}>
              LaTeX para matemática, diagramas UML con Mermaid y bloques de código interactivos.
            </p>
          </div>
        </div>

        <div className={styles.welcomeCta}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}
            onClick={() => openModal('subject')}
          >
            <Plus size={18} />
            <span>Crear nueva materia</span>
          </button>
        </div>
      </div>
    </div>
  );
};
