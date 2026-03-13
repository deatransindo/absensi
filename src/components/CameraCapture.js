'use client';

import { useState, useRef } from 'react';
import { Camera, X, RefreshCw, Loader } from 'lucide-react';
import styles from '@/styles/CameraCapture.module.css';

export default function CameraCapture({ onCapture, onClose }) {
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Tidak dapat mengakses kamera');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;

    const doCapture = () => {
      setCapturing(true);
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.9);
        setTimeout(() => {
          onCapture(photoData);
          stopCamera();
          setCapturing(false);
        }, 150);
      }
    };

    if (video.readyState >= 2 && video.videoWidth > 0) {
      doCapture();
    } else {
      video.addEventListener('canplay', doCapture, { once: true });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <Camera size={18} strokeWidth={2} />
            <h3 className={styles.title}>Ambil Foto Selfie</h3>
          </div>
          <button className={styles.closeBtn} onClick={() => { stopCamera(); onClose(); }}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`${styles.video} ${capturing ? styles.capturing : ''}`}
          />
          <canvas ref={canvasRef} className={styles.canvas} />

          {!stream && (
            <div className={styles.videoPlaceholder}>
              <Camera size={40} strokeWidth={1} className={styles.placeholderIcon} />
              <p>Kamera belum aktif</p>
            </div>
          )}

          {stream && (
            <div className={styles.cameraFrame}>
              <span className={styles.corner} />
              <span className={styles.corner} />
              <span className={styles.corner} />
              <span className={styles.corner} />
            </div>
          )}

          {capturing && <div className={styles.flashOverlay} />}
        </div>

        <div className={styles.buttonGroup}>
          {!stream ? (
            <button onClick={startCamera} className={styles.primaryBtn}>
              <Camera size={17} strokeWidth={2} />
              Buka Kamera
            </button>
          ) : (
            <>
              <button onClick={capturePhoto} disabled={capturing} className={styles.captureBtn}>
                <div className={styles.captureRing}>
                  <div className={styles.captureDot} />
                </div>
                {capturing ? 'Mengambil...' : 'Ambil Foto'}
              </button>
              <button onClick={stopCamera} className={styles.retryBtn} title="Restart">
                <RefreshCw size={16} strokeWidth={2} />
              </button>
            </>
          )}
          <button onClick={() => { stopCamera(); onClose(); }} className={styles.cancelBtn}>
            <X size={16} strokeWidth={2.5} />
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
