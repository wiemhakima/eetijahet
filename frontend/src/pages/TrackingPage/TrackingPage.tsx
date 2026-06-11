import React, { useEffect, useRef, useState } from 'react';
import { Marker } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDeliveries } from '../../store/slices/deliverySlice';
import type { ClientDelivery, DriverInfo } from '../../store/slices/deliverySlice';
import ArmadaMap, { makePickupPin, makeDeliveryPin, makeDriverIcon } from '../../components/ArmadaMap';
import './TrackingPage.scss';

const pickupIcon  = makePickupPin();
const dropoffIcon = makeDeliveryPin();

const STEP_INDEX: Record<string, number> = {
  pending: 0, accepted: 1, picked_up: 2, in_transit: 3, delivered: 4,
};

const TrackingPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch  = useAppDispatch();
  const { deliveries, isLoading } = useAppSelector(s => s.delivery);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const STATUS_STEPS = [
    { key: 'pending',    label: t('tracking.statusPending'),    icon: '📋' },
    { key: 'accepted',   label: t('tracking.statusAccepted'),   icon: '🤝' },
    { key: 'picked_up',  label: t('tracking.statusPickedUp'),   icon: '📦' },
    { key: 'in_transit', label: t('tracking.statusInTransit'),  icon: '🚚' },
    { key: 'delivered',  label: t('tracking.statusDelivered'),  icon: '✅' },
  ];

  const active  = deliveries.filter(d => ['accepted', 'picked_up', 'in_transit'].includes(d.clientStatus));
  const pending = deliveries.filter(d => d.clientStatus === 'pending');
  const done    = deliveries.filter(d => d.clientStatus === 'delivered' || d.clientStatus === 'cancelled');

  const displayList = [...active, ...pending];

  useEffect(() => {
    dispatch(fetchDeliveries({ limit: 50 }));
    intervalRef.current = setInterval(() => {
      dispatch(fetchDeliveries({ limit: 50 }));
    }, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [dispatch]);

  useEffect(() => {
    if (!selectedId && displayList.length > 0) {
      setSelectedId(displayList[0]._id);
    }
  }, [deliveries]);

  const selected: ClientDelivery | null =
    deliveries.find(d => d._id === selectedId) ?? displayList[0] ?? null;

  const bounds: [[number, number],[number,number]] | undefined =
    selected?.pickupLat && selected?.dropoffLat
      ? [[Math.min(selected.pickupLat, selected.dropoffLat) - 0.02, Math.min(selected.pickupLng!, selected.dropoffLng!) - 0.02],
         [Math.max(selected.pickupLat, selected.dropoffLat) + 0.02, Math.max(selected.pickupLng!, selected.dropoffLng!) + 0.02]]
      : undefined;

  return (
    <div className="tracking-page">
      {/* Left panel */}
      <div className="tp-panel">
        <div className="tp-panel__header">
          <div>
            <h2 className="tp-panel__title">{t('tracking.title')}</h2>
            <p className="tp-panel__desc">{t('tracking.subtitle')}</p>
          </div>
          {!isLoading && <span className="tp-live-dot" title={t('tracking.liveTitle')}>● Live</span>}
        </div>

        {isLoading && !deliveries.length ? (
          <div className="tp-loading">{t('tracking.loading')}</div>
        ) : displayList.length === 0 ? (
          <div className="tp-empty">
            <div className="tp-empty__icon">🚚</div>
            <p>{t('tracking.noActive')}</p>
            {done.length > 0 && (
              <p className="tp-done-hint">
                {t('tracking.completed', { count: done.length })}
              </p>
            )}
          </div>
        ) : (
          <div className="tp-list">
            {displayList.map(d => {
              const stepIdx = STEP_INDEX[d.clientStatus] ?? 0;
              const isSelected = selected?._id === d._id;
              const driverObj = typeof d.driver === 'object' && d.driver ? d.driver as DriverInfo : null;

              return (
                <div
                  key={d._id}
                  className={`tp-card ${isSelected ? 'tp-card--active' : ''}`}
                  onClick={() => setSelectedId(d._id)}
                >
                  <div className="tp-card__header">
                    <span className="tp-card__id">{d.orderId || d._id.slice(-8)}</span>
                    <span className={`tp-badge tp-badge--${d.clientStatus}`}>
                      {STATUS_STEPS[stepIdx]?.label}
                    </span>
                  </div>

                  <div className="tp-card__route">
                    <div className="tp-card__point">
                      <span className="tp-dot tp-dot--green" />
                      <span>{d.pickupLabel || `${d.pickupLat?.toFixed(3)}, ${d.pickupLng?.toFixed(3)}`}</span>
                    </div>
                    <div className="tp-card__line" />
                    <div className="tp-card__point">
                      <span className="tp-dot tp-dot--red" />
                      <span>{d.dropoffLabel || `${d.dropoffLat?.toFixed(3)}, ${d.dropoffLng?.toFixed(3)}`}</span>
                    </div>
                  </div>

                  <div className="tp-steps">
                    {STATUS_STEPS.map((step, i) => (
                      <div key={step.key} className={`tp-step ${i <= stepIdx ? 'tp-step--done' : ''} ${i === stepIdx ? 'tp-step--current' : ''}`}>
                        <div className="tp-step__dot">{i < stepIdx ? '✓' : step.icon}</div>
                        <div className="tp-step__label">{step.label}</div>
                        {i < STATUS_STEPS.length - 1 && <div className="tp-step__line" />}
                      </div>
                    ))}
                  </div>

                  {driverObj && stepIdx >= 1 && (
                    <div className="tp-driver-info">
                      <span className="tp-driver-info__icon">🧑‍✈️</span>
                      <div>
                        <div className="tp-driver-info__name">
                          {driverObj.firstName} {driverObj.lastName}
                        </div>
                        {driverObj.phone && (
                          <div className="tp-driver-info__phone">{driverObj.phone}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {d.eta_minutes && d.clientStatus !== 'delivered' && (
                    <div className="tp-card__eta">
                      🕐 {t('tracking.eta')} <strong>{Math.round(d.eta_minutes)} min</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="tp-map-panel">
        {!selected && (
          <div className="tp-map-empty">{t('tracking.selectDelivery')}</div>
        )}
        <ArmadaMap height="100%" bounds={bounds} boundsPadding={60}>
          {selected?.pickupLat  && <Marker position={[selected.pickupLat,  selected.pickupLng!]}  icon={pickupIcon} />}
          {selected?.dropoffLat && <Marker position={[selected.dropoffLat, selected.dropoffLng!]} icon={dropoffIcon} />}
          {selected?.lastLat    && <Marker position={[selected.lastLat,    selected.lastLng!]}    icon={makeDriverIcon()} />}
        </ArmadaMap>
      </div>
    </div>
  );
};

export default TrackingPage;
