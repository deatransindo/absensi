'use client';

import { useState, useRef } from 'react';
import styles from '@/styles/CameraCapture.module.css';

export default function CameraCapture({ onCapture, onClose }) {
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Tidak dapat mengakses kamera');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg');
        onCapture(photoData);
        stopCamera();
      }
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
        <h3 className={styles.title}>Ambil Foto Selfie</h3>

        <div className={styles.videoContainer}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={styles.video}
          />
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>

        <div className={styles.buttonGroup}>
          {!stream ? (
            <button onClick={startCamera} className={styles.primaryBtn}>
              Buka Kamera
            </button>
          ) : (
            <button onClick={capturePhoto} className={styles.successBtn}>
              Ambil Foto
            </button>
          )}
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className={styles.secondaryBtn}
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}