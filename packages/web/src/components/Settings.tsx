import { useState } from 'react';
import { useConfigStore } from '../store/configStore';
import { reinitializeClients } from '../services/client';
import { queryClient } from '../queryClient';
import styles from './Settings.module.css';

export function Settings() {
  const { hosts, activeHostIndex, addHost, removeHost, setActiveHost } = useConfigStore();
  const [newUrl, setNewUrl] = useState('');

  function handleSetActive(index: number) {
    if (index === activeHostIndex) return;
    setActiveHost(index);
    reinitializeClients();
    queryClient.clear();
  }

  function handleAdd() {
    const url = newUrl.trim();
    if (!url) return;
    addHost(url);
    setNewUrl('');
  }

  function handleRemove(index: number) {
    if (hosts.length === 1) return;
    removeHost(index);
    reinitializeClients();
    queryClient.clear();
  }

  return (
    <div className={styles.container}>
      <div className={styles.sectionTitle}>Hosts</div>
      <div className={styles.hostList}>
        {hosts.map((host, index) => (
          <div
            key={index}
            className={`${styles.hostRow} ${index === activeHostIndex ? styles.active : ''}`}
            onClick={() => handleSetActive(index)}
          >
            <span className={styles.hostUrl}>{host}</span>
            {index === activeHostIndex && <span className={styles.check}>✓</span>}
            {hosts.length > 1 && (
              <button
                className={styles.removeBtn}
                onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <div className={styles.addRow}>
        <input
          className={styles.input}
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="http://192.168.1.x:3000"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button className={styles.addBtn} onClick={handleAdd}>+</button>
      </div>
    </div>
  );
}
