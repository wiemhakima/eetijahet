import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { submitRating, clearError } from '../../store/slices/ratingSlice';
import BaseModal from '../ui/BaseModal/BaseModal';
import './RatingModal.scss';

const LABELS = ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent ✨'];

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

interface Props {
  deliveryId: string;
  driverName?: string;
  onClose: () => void;
}

const RatingModal: React.FC<Props> = ({ deliveryId, driverName, onClose }) => {
  const dispatch = useAppDispatch();
  const { isSubmitting, error } = useAppSelector(s => s.ratings);

  const [stars,     setStars]     = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [comment,   setComment]   = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!stars) return;
    dispatch(clearError());
    const result = await dispatch(submitRating({ deliveryId, stars, comment: comment.trim() || undefined }));
    if (submitRating.fulfilled.match(result)) {
      setSubmitted(true);
      setTimeout(onClose, 1600);
    }
  };

  return (
    <BaseModal
      show={true}
      onClose={onClose}
      icon={<StarIcon />}
      title={submitted ? 'Avis envoyé !' : 'Notez votre livreur'}
      subtitle={!submitted && driverName ? `Livraison par ${driverName}` : undefined}
      maxWidth="420px"
      footer={
        submitted ? undefined : (
          <>
            <button className="bm-btn bm-btn--cancel" onClick={onClose}>Annuler</button>
            <button
              className="bm-btn bm-btn--primary"
              onClick={handleSubmit}
              disabled={!stars || isSubmitting}
            >
              {isSubmitting ? 'Envoi…' : 'Envoyer ⭐'}
            </button>
          </>
        )
      }
    >
      {submitted ? (
        <div className="rm-success">
          <div className="rm-success__icon">✅</div>
          <h3>Merci pour votre avis !</h3>
          <p>Votre notation a été enregistrée.</p>
        </div>
      ) : (
        <>
          <div className="rm-stars">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                className={`rm-star ${n <= (hovered || stars) ? 'rm-star--on' : ''}`}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setStars(n)}
                aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>

          <p className="rm-label">{LABELS[hovered || stars]}</p>

          <textarea
            className="rm-textarea"
            placeholder="Commentaire optionnel (max 500 caractères)…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
            rows={3}
          />

          {error && <p className="rm-error">{error}</p>}
        </>
      )}
    </BaseModal>
  );
};

export default RatingModal;
