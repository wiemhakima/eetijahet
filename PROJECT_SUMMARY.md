# PROJECT SUMMARY — Etijahat (إتجاهات)

> Plateforme SaaS multi-tenant de gestion de livraison pour le marché koweïtien.  
> Dernière mise à jour : 2026-04-25

---

## 1. Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                              │
│              React 19 + TypeScript + Vite (port 80/5173)            │
│         Redux Toolkit · React Router v7 · Socket.io-client          │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP/REST  +  WebSocket (Socket.io)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND / API                                 │
│            Node.js + Express 5 (port 3000)                          │
│  JWT Auth · API Keys · Rate-limiting · Multi-tenant middleware       │
│  Socket.io server · Nodemailer · localtunnel/ngrok (webhooks)       │
└───────────┬──────────────────────────────┬──────────────────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────┐      ┌───────────────────────────────────────┐
│      MongoDB          │      │       Services externes               │
│  Mongoose 8 (ODM)     │      │  • Armada Delivery API (3PL)          │
│  13 modèles           │      │  • Stripe (paiements, optionnel)      │
│  Atlas / local        │      │  • Python AI (routing & ETA)          │
└───────────────────────┘      └───────────────────────────────────────┘
```

**Résumé des couches :**

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Frontend | React 19 + TypeScript + Vite | SPA multi-rôle |
| Backend | Node.js + Express 5 | API REST + WebSocket |
| Base de données | MongoDB + Mongoose 8 | Données applicatives |
| IA/Routing | Python (Core/) | Calcul ETA + optimisation d'itinéraires |
| Temps réel | Socket.io 4 | Suivi de livraison en direct |
| Paiement | Stripe (optionnel) | Abonnements & factures |
| Livraison 3PL | Armada Delivery | Intégration transporteur externe |

---

## 2. Structure Complète des Dossiers

```
Etijahat-secondcopy/
│
├── frontend/                          # SPA React + TypeScript
│   ├── src/
│   │   ├── api/                       # Clients HTTP (axios) par domaine
│   │   ├── assets/                    # Images, icônes statiques
│   │   ├── components/                # Composants réutilisables
│   │   │   ├── AddClientWithDeliveryModal.tsx
│   │   │   ├── ArmadaMap.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── DeliveryRequestPopup.tsx
│   │   │   ├── LocalMap.tsx
│   │   │   ├── PrivateRoute.tsx
│   │   │   ├── RatingModal.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── StatusToggle.tsx
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── i18n/                      # Internationalisation (AR/EN)
│   │   ├── pages/                     # Pages par rôle (détail §5)
│   │   ├── services/                  # Logique métier front
│   │   ├── store/                     # Redux store + slices
│   │   │   └── slices/
│   │   │       └── authSlice.ts
│   │   ├── styles/                    # SCSS global
│   │   ├── types/                     # Interfaces TypeScript
│   │   ├── App.tsx                    # Routeur principal
│   │   └── main.tsx                   # Point d'entrée React
│   ├── vite.config.ts
│   ├── eslint.config.js
│   ├── .env.local
│   └── package.json
│
├── server/                            # API Express
│   ├── src/
│   │   ├── api/
│   │   │   ├── controllers/           # 30+ contrôleurs
│   │   │   │   ├── addressController.js
│   │   │   │   ├── adminController.js
│   │   │   │   ├── agencyController.js
│   │   │   │   ├── agencySettingsController.js
│   │   │   │   ├── apiKeyController.js
│   │   │   │   ├── armadaController.js
│   │   │   │   ├── authController.js
│   │   │   │   ├── clientController.js
│   │   │   │   ├── clientDeliveryController.js
│   │   │   │   ├── creditController.js
│   │   │   │   ├── driverController.js
│   │   │   │   ├── driverDeliveryController.js
│   │   │   │   ├── earningsController.js
│   │   │   │   ├── etaController.js
│   │   │   │   ├── merchantController.js
│   │   │   │   ├── notificationController.js
│   │   │   │   ├── parcelController.js
│   │   │   │   ├── publicApiController.js
│   │   │   │   ├── ratingController.js
│   │   │   │   ├── requestLogController.js
│   │   │   │   ├── routingController.js
│   │   │   │   ├── subscriptionController.js
│   │   │   │   ├── superAdminController.js
│   │   │   │   ├── trackingController.js
│   │   │   │   ├── usageController.js
│   │   │   │   └── webhookController.js
│   │   │   ├── middlewares/
│   │   │   │   ├── apiKeyMiddleware.js     # Auth par clé API + permissions
│   │   │   │   ├── authMiddleware.js       # JWT protect + authorize(roles)
│   │   │   │   ├── checkSubscription.js    # Gating par plan
│   │   │   │   ├── deductionMiddleware.js  # Déduction crédits API
│   │   │   │   ├── errorMiddleware.js      # Handler global d'erreurs
│   │   │   │   ├── loggingMiddleware.js    # Log requêtes/réponses
│   │   │   │   └── tenantMiddleware.js     # Résolution multi-tenant
│   │   │   └── routes/                    # 25+ fichiers de routes
│   │   │       ├── index.js               # Agrégateur principal
│   │   │       ├── addressRoutes.js
│   │   │       ├── adminRoutes.js
│   │   │       ├── agencyRoutes.js
│   │   │       ├── agencySettingsRoutes.js
│   │   │       ├── apiKeyRoutes.js
│   │   │       ├── armadaRoutes.js
│   │   │       ├── authRoutes.js
│   │   │       ├── clientDeliveryRoutes.js
│   │   │       ├── clientRoutes.js
│   │   │       ├── creditRoutes.js
│   │   │       ├── deliveryRoutes.js
│   │   │       ├── driverDeliveryRoutes.js
│   │   │       ├── earningsRoutes.js
│   │   │       ├── etaRoutes.js
│   │   │       ├── graphRoutes.js
│   │   │       ├── merchantRoutes.js
│   │   │       ├── notificationRoutes.js
│   │   │       ├── parcelRoutes.js
│   │   │       ├── publicRoutes.js
│   │   │       ├── ratingRoutes.js
│   │   │       ├── requestLogRoutes.js
│   │   │       ├── routingRoutes.js
│   │   │       ├── subscriptionRoutes.js
│   │   │       ├── superAdminRoutes.js
│   │   │       ├── trackingRoutes.js
│   │   │       ├── usageRoutes.js
│   │   │       └── webhookRoutes.js
│   │   ├── config/
│   │   │   ├── index.js               # Config globale (port, JWT, CORS…)
│   │   │   ├── plans.js               # Définition plans basic/medium/pro
│   │   │   └── kuwaitZones.js         # Zones de livraison Koweït
│   │   ├── models/                    # 13 schémas Mongoose (détail §4)
│   │   ├── services/
│   │   │   └── armadaService.js       # Sync commandes Armada
│   │   ├── scripts/
│   │   │   └── seedTestUsers.js       # Données de test
│   │   ├── utils/
│   │   │   └── logger.js
│   │   ├── app.js                     # Setup Express
│   │   ├── server.js                  # Démarrage HTTP + WebSocket
│   │   └── socket.js                  # Initialisation Socket.io
│   ├── .env
│   └── package.json
│
├── Core/                              # Moteur Python IA
│   └── cache/                         # Cache modèles ML
│
├── ai-routing/                        # Virtualenv Python
│
├── .claude/                           # Config Claude Code
├── .github/workflows/                 # CI/CD GitHub Actions
├── .env.example                       # Template variables d'environnement
└── PROJECT_SUMMARY.md                 # Ce fichier
```

---

## 3. Routes API Complètes

> Préfixe de base : `/api/v1`  
> Auth : 🔓 Public · 🔑 Clé API · 🔒 JWT · 👑 Admin · 🏢 Agency Admin · 🚗 Driver · 🛍 Merchant

### Authentification (`/auth`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth/signup` | 🔓 | Inscription nouvel utilisateur |
| POST | `/auth/login` | 🔓 | Connexion email/password |
| POST | `/auth/login-code` | 🔓 | Connexion par code magique |
| POST | `/auth/resend-code` | 🔓 | Renvoyer le code magique |
| GET | `/auth/me` | 🔒 | Profil de l'utilisateur connecté |
| PUT | `/auth/profile` | 🔒 | Mettre à jour le profil |
| PUT | `/auth/password` | 🔒 | Changer le mot de passe |
| POST | `/auth/logout` | 🔒 | Déconnexion |

### Livraisons Client (`/deliveries`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/deliveries/estimate` | 🔒 | Estimer le prix d'une livraison |
| POST | `/deliveries` | 🔒 | Créer une nouvelle livraison |
| GET | `/deliveries` | 🔒 | Lister ses livraisons |
| GET | `/deliveries/:id` | 🔒 | Détail d'une livraison |
| PUT | `/deliveries/:id/cancel` | 🔒 | Annuler une livraison |
| GET | `/deliveries/driver/:driverId` | 🔒 | Livraisons par chauffeur |
| GET | `/deliveries/history/:driverId` | 🔒 | Historique chauffeur |

### Opérations Driver (`/driver/deliveries`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/driver/deliveries/available` | 🚗 | Livraisons disponibles à accepter |
| GET | `/driver/deliveries/my-deliveries` | 🚗 | Mes livraisons en cours |
| GET | `/driver/deliveries/current` | 🚗 | Livraison active courante |
| PUT | `/driver/deliveries/status` | 🚗 | Changer son statut (dispo/occupé/hors-ligne) |
| PUT | `/driver/deliveries/:id/accept` | 🚗 | Accepter une livraison |
| POST | `/driver/deliveries/:id/reject` | 🚗 | Rejeter une livraison |
| PUT | `/driver/deliveries/:id/status` | 🚗 | Mettre à jour le statut de livraison |
| PUT | `/driver/deliveries/:id/location` | 🚗 | Envoyer sa position GPS |

### Agences (`/agencies`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/agencies/register` | 🔓 | Inscription d'une agence |
| GET | `/agencies/public` | 🔓 | Liste des agences publiques |
| GET | `/agencies/me` | 🏢 | Profil de mon agence |
| PUT | `/agencies/me` | 🏢 | Mettre à jour mon agence |
| GET | `/agencies/me/drivers` | 🏢 | Lister mes chauffeurs |
| POST | `/agencies/me/drivers` | 🏢 | Inviter un chauffeur |
| PUT | `/agencies/me/drivers/:driverId` | 🏢 | Modifier un chauffeur |
| DELETE | `/agencies/me/drivers/:driverId` | 🏢 | Retirer un chauffeur |
| GET | `/agencies/me/drivers/available` | 🏢 | Chauffeurs disponibles |
| GET | `/agencies/me/clients` | 🏢 | Lister mes clients |
| POST | `/agencies/me/clients` | 🏢 | Inviter un client |
| POST | `/agencies/me/clients-with-delivery` | 🏢 | Créer client + livraison |
| GET | `/agencies/me/deliveries` | 🏢 | Livraisons de l'agence |
| POST | `/agencies/me/deliveries` | 🏢 | Créer une livraison (pour client) |
| PUT | `/agencies/me/deliveries/:deliveryId/assign` | 🏢 | Assigner un chauffeur |
| GET | `/agencies/me/statistics` | 🏢 | Statistiques (plan requis) |
| GET | `/agencies/me/finances` | 🏢 | Données financières (plan requis) |
| GET | `/agencies/me/stats` | 🏢 | Stats résumées |

### Paramètres Agence (`/agencies/me/settings`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/settings` | 🏢 | Lire tous les paramètres |
| PUT | `/settings/profile` | 🏢 | Mettre à jour le profil agence |
| GET | `/settings/zones` | 🏢 | Zones de livraison |
| PUT | `/settings/zones` | 🏢 | Modifier les zones |
| PUT | `/settings/hours` | 🏢 | Horaires d'ouverture |
| PUT | `/settings/notifications` | 🏢 | Préférences notifications |
| GET | `/settings/team` | 🏢 | Membres de l'équipe |
| POST | `/settings/team` | 🏢 | Inviter un membre |
| PUT | `/settings/team/:memberId` | 🏢 | Modifier un membre |
| DELETE | `/settings/team/:memberId` | 🏢 | Retirer un membre |

### Marchands (`/agencies/me/merchants` et `/merchant`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/agencies/me/merchants` | 🏢 | Lister les marchands |
| GET | `/agencies/me/merchants/stats` | 🏢 | Stats globales marchands |
| GET | `/agencies/me/merchants/with-stats` | 🏢 | Marchands avec stats |
| GET | `/agencies/me/merchants/:id` | 🏢 | Détail d'un marchand |
| POST | `/agencies/me/merchants` | 🏢 | Créer un marchand |
| PUT | `/agencies/me/merchants/:id` | 🏢 | Modifier un marchand |
| DELETE | `/agencies/me/merchants/:id` | 🏢 | Supprimer un marchand |
| GET | `/agencies/me/merchants/:merchantId/orders` | 🏢 | Commandes d'un marchand |
| GET | `/merchant/profile` | 🛍 | Mon profil marchand |
| GET | `/merchant/stats` | 🛍 | Mes statistiques |
| GET | `/merchant/orders` | 🛍 | Mes commandes |
| POST | `/merchant/orders` | 🛍 | Créer une commande |
| GET | `/merchant/orders/:armadaOrderId/track` | 🛍 | Suivre une commande |

### Administration (`/admin`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/admin/stats` | 👑 | Statistiques globales plateforme |
| GET | `/admin/users` | 👑 | Tous les utilisateurs |
| GET | `/admin/users/:id` | 👑 | Détail utilisateur |
| PUT | `/admin/users/:id` | 👑 | Modifier utilisateur |
| PATCH | `/admin/users/:id/role` | 👑 | Changer le rôle |
| PATCH | `/admin/users/:id/api-settings` | 👑 | Config API utilisateur |
| POST | `/admin/users/:id/impersonate` | 👑 | Incarner un utilisateur |
| DELETE | `/admin/users/:id` | 👑 | Supprimer utilisateur |
| GET | `/admin/notifications` | 👑 | Toutes les notifications |
| POST | `/admin/notifications/send` | 👑 | Envoyer une notification |
| POST | `/admin/notifications/broadcast` | 👑 | Broadcast global |
| DELETE | `/admin/notifications/:id` | 👑 | Supprimer notification |
| GET | `/admin/deliveries/stats` | 👑 | Stats livraisons |
| GET | `/admin/deliveries` | 👑 | Toutes les livraisons |
| PATCH | `/admin/deliveries/:id` | 👑 | Modifier une livraison |
| GET | `/admin/drivers` | 👑 | Tous les chauffeurs |

### Abonnements (`/subscriptions`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/subscriptions/plans` | 🔓 | Lister les plans disponibles |
| POST | `/subscriptions` | 🏢 | S'abonner à un plan |
| GET | `/subscriptions/current` | 🏢 | Abonnement actuel |
| PUT | `/subscriptions/current` | 🏢 | Changer de plan |
| DELETE | `/subscriptions/current` | 🏢 | Annuler l'abonnement |
| GET | `/subscriptions/invoices` | 🏢 | Historique factures |

### Clés API & Crédits (`/api-keys`, `/credits`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api-keys` | 🔒 | Créer une clé API |
| GET | `/api-keys` | 🔒 | Lister mes clés |
| GET | `/api-keys/:id` | 🔒 | Détail d'une clé |
| PUT | `/api-keys/:id` | 🔒 | Modifier une clé |
| DELETE | `/api-keys/:id` | 🔒 | Supprimer une clé |
| PUT | `/api-keys/:id/revoke` | 🔒 | Révoquer une clé |
| GET | `/credits` | 🔒 | Vue d'ensemble crédits |
| GET | `/credits/packages` | 🔒 | Packages disponibles |
| POST | `/credits/purchase` | 🔒 | Acheter des crédits |
| GET | `/credits/transactions` | 🔒 | Historique transactions |

### API Publique & Routing IA (`/public`, `/routing`, `/eta`)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/public/eta` | 🔑 | Prédiction ETA (temps estimé) |
| POST | `/public/combined` | 🔑 | Modèle combiné ETA + distance |
| POST | `/routing/optimize` | 🔒 | Optimisation de tournée |
| POST | `/routing/predict_route` | 🔑 | Prédiction d'itinéraire IA |
| GET | `/routing/roads` | 🔑 | Données réseau routier |
| GET | `/routing/graph_status` | 🔑 | Statut graphe routier |
| GET | `/routing/graph/nodes` | 🔑 | Nœuds du graphe |
| GET | `/routing/graph/edges` | 🔑 | Arêtes du graphe |
| POST | `/eta` | 🔓 | ETA (endpoint legacy) |

### Suivi Public (`/track`), Notifications, Adresses, Notes

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/track/:code` | 🔓 | Suivre une livraison par code |
| POST | `/track/verify` | 🔓 | Vérifier le code d'accès client |
| POST | `/track/resend-code` | 🔓 | Renvoyer le code de suivi |
| GET | `/notifications` | 🔒 | Mes notifications |
| POST | `/notifications` | 🔒 | Créer une notification |
| PUT | `/notifications/read-all` | 🔒 | Tout marquer comme lu |
| PUT | `/notifications/:id/read` | 🔒 | Marquer comme lu |
| GET | `/addresses` | 🔒 | Mes adresses favorites |
| POST | `/addresses` | 🔒 | Ajouter une adresse |
| PUT | `/addresses/:id` | 🔒 | Modifier une adresse |
| DELETE | `/addresses/:id` | 🔒 | Supprimer une adresse |
| POST | `/ratings` | 🔒 | Noter une livraison |
| GET | `/ratings/my-ratings` | 🔒 | Mes évaluations |
| GET | `/ratings/driver/:driverId` | 🔒 | Notes d'un chauffeur |
| GET | `/earnings/driver/:driverId` | 🚗 | Résumé gains chauffeur |
| GET | `/earnings/driver/:driverId/history` | 🚗 | Historique gains |
| GET | `/logs` | 🔒 | Logs requêtes API |
| GET | `/usage` | 🔒 | Statistiques utilisation |
| GET | `/status` | 🔓 | Santé du serveur |
| POST | `/webhook/armada` | 🔓 | Webhook Armada Delivery |

---

## 4. Modèles de Données

### User

```
_id          ObjectId
firstName    String (requis)
lastName     String
email        String (unique, sparse)
password     String (hash bcrypt, masqué)
company      String
avatar       String
phone        String
role         Enum: user | admin | driver | developer | agency_admin | super_admin | merchant
agency       → Agency
activeApiSettings → UserApiSettings
tier         Enum: free | basic | premium | enterprise
driverStatus Enum: available | busy | offline
loginCode    String (code magique, TTL)
loginCodeExpires Date
agreeMarketing Boolean
createdAt / updatedAt
```

### Delivery

```
_id              ObjectId
trackingCode     String (unique)
orderId          String
status           Enum: going_to_pickup | picked_up | on_the_way | delivered | failed
clientStatus     Enum: broadcasting | pending | accepted | picked_up | in_transit | delivered | cancelled
agency           → Agency (requis)
client           → User
driver           → User
merchant         → Merchant
pickupAddress    String
dropoffAddress   String
pickupLat/Lng    Number
dropoffLat/Lng   Number
pickupLabel / dropoffLabel String
packageType      Enum: document | small | medium | large | fragile | food
notes            String
desiredDate      Date
estimatedPrice   Number
distance_km      Number
eta_minutes      Number
lastLat/Lng      Number (position driver en temps réel)
eta_predicted_seconds Number
actual_time_seconds   Number
gps_trace        [{ lat, lng, timestamp }]
clientInfo       { name, phone, email }
productPrice     Number
merchantCommission Number
deliveryPrice    Number
broadcastedAt / broadcastExpiresAt Date
rejectedBy       [→ User]
clientAccessCode String
codeExpiresAt    Date
armadaOrderId / armadaStatus / armadaTrackingUrl String
completed_at     Date
createdAt / updatedAt
```

### Agency

```
_id          ObjectId
name         String (requis)
nameAr       String (nom arabe)
slug         String (unique)
email        String (requis)
phone        String
address      String
logo         String
currency     String (défaut: KWD)
priceBase    Number (défaut: 1.5 KWD)
coverageZones [String]
rating / ratingCount Number
owner        → User (requis)
subscription → Subscription
status       Enum: active | suspended | trial
trialEndsAt  Date (J+14)

settings: {
  maxDrivers, maxDeliveries, apiAccess, apiRequestsLimit
}

usage: {
  deliveriesThisMonth, lastResetDate
}

profile: {
  name, logo, description,
  address: { street, city, governorate, country, lat, lng },
  phone, email, website,
  socialMedia: { instagram, twitter, facebook }
}

deliveryZones: [{
  name, governorate, isActive,
  pricing: { basePrice, pricePerKm, minimumFee, expressFee }
}]

defaultPricing: { basePrice, pricePerKm, minimumFee, expressFee }

workingHours: {
  is24_7: Boolean,
  schedule: { [day]: { isOpen, open, close, breakStart, breakEnd } },
  holidays: [Date]
}

team: [{ user → User, role, permissions }]
createdAt / updatedAt
```

### Merchant

```
_id          ObjectId
storeName    String (requis)
user         → User (unique)
agency       → Agency (requis)
commission   Number (0-100, défaut: 10%)
address      { street, city, lat, lng }
stats        { totalOrders, totalRevenue, totalCommission }
logo         String
isActive     Boolean
createdAt / updatedAt
```

### Subscription

```
_id                  ObjectId
agency               → Agency (unique)
plan                 Enum: basic | medium | pro
billing              Enum: monthly | annual
status               Enum: active | cancelled | past_due | trialing
currentPeriodStart   Date
currentPeriodEnd     Date
cancelAtPeriodEnd    Boolean
stripeSubscriptionId String
stripeCustomerId     String
invoices: [{
  amount, currency, paidAt, invoiceUrl, stripeInvoiceId
}]
createdAt / updatedAt
```

**Plans disponibles :**

| Plan | Chauffeurs | Livraisons/mois | Marchands | API | Prix mensuel |
|------|-----------|----------------|-----------|-----|-------------|
| basic | 2 | 20 | 3 | ❌ | 9 KWD |
| medium | 10 | illimité | 15 | ❌ | 25 KWD |
| pro | illimité | illimité | illimité | 10 000 req | 49 KWD |

### ApiKey

```
_id          ObjectId
name         String
key          String (unique, format: ak_[32 hex])
userId       → User
agency       → Agency
status       Enum: active | expired | revoked
permissions  [time_estimation | distance_estimation | combined_model | route_prediction]
expires      Date
lastUsed     Date
createdAt / updatedAt
```

### ArmadaOrder

```
_id              ObjectId
armadaId         String
code             String
status           String (défaut: pending)
customerName / customerPhone String
destinationCity / destinationAddress String
amount / deliveryFee Number
trackingLink     String
driverName / driverPhone String
channel          String
merchantId       → User
raw              Mixed (payload brut)
createdAt / updatedAt
```

### Rating

```
_id        ObjectId
delivery   → Delivery (unique)
client     → User
driver     → User
stars      Number (1-5)
comment    String (max 500 chars)
createdAt / updatedAt
```

### Address

```
_id        ObjectId
user       → User
label      String
street / city String
lat / lng  Number
isDefault  Boolean
createdAt / updatedAt
```

### Notification

```
_id        ObjectId
title      String
message    String
type       Enum: success | error | warning | info
user       → User
global     Boolean (broadcast)
isRead     Boolean
createdAt / updatedAt
```

### CreditTransaction

```
_id          ObjectId
userId       → User
type         Enum: purchase | deduction | bonus | refund
credits      Number
balance      Number
description  String
packageId / packageName String
amountPaid / requestCount Number
createdAt / updatedAt
```

### RequestLog

```
_id               ObjectId
userId            → User
apiKeyId          → ApiKey
apiKey / apiKeyName String
requestStatus     Number (HTTP status)
responseMessage   String
requestDate       Date
creditsUsed       Number
endpointRoute / endpointName / endpointCategory String
method            Enum: GET | POST | PUT | DELETE | PATCH
requestBody       Mixed
responseTime      Number (ms)
ipAddress / userAgent String
errorDetails      String
isSuccess         Boolean
createdAt / updatedAt
```

### UserApiSettings

```
_id                      ObjectId
totalCredits             Number (défaut: 1000)
usedCredits              Number
totalRequests            Number
successfulRequestsCount  Number
failedRequestsCount      Number
requestsPerMinute        Number (défaut: 500)
requestsPerHour          Number (défaut: 30 000)
requestsPerDay           Number (défaut: 72 000)
concurrentRequests       Number (défaut: 100)
costPerRequest           Number (défaut: 1 crédit)
[compteurs de rate-limiting en cours]
createdAt / updatedAt
```

---

## 5. Pages & Composants Frontend

### Routage App.tsx

```
/                        → Home (landing page publique)
/signup                  → Signup
/login                   → Login
/login-code              → LoginWithCode (magic link)
/impersonate             → Impersonate (admin)
/track                   → TrackingPage
/track/:code             → TrackPage
/map                     → ArmadaMap
/routing                 → RoutingEngine

/merchant/dashboard      → MerchantDashboard
/merchant/orders         → MerchantOrders
/merchant/orders/new     → CreateOrder

/dashboard/*             → Dashboard (developer)
/agency/*                → Agency pages
/client/*                → Client pages
/developer/dashboard/*   → Developer dashboard
/api-keys                → APIKeys
/usage                   → Usage
/logs                    → Logs
/sandbox                 → Sandbox
/notifications           → Notifications
```

### Pages par Rôle

#### Public / Landing
- **Home.tsx** — Page d'accueil avec sections : Header, Hero, Features, Models, ProductShowcase, CTA, Footer
- **Login.tsx** — Connexion email/mot de passe
- **LoginWithCode.tsx** — Connexion par code à usage unique
- **Signup.tsx** — Inscription (3 sous-composants)
- **TrackingPage.tsx / TrackPage.tsx** — Suivi public livraison (DriverCard, StatusTimeline)

#### Dashboard Développeur
- **Dashboard.tsx** — Vue centrale avec : APIKeysWidget, BillingWidget, Header, MapView, ModelPerformanceWidget, QuickActionsWidget, Sidebar, UsageWidget
- **APIKeys.tsx / CreateAPI.tsx** — Gestion clés API
- **ServiceProfile.tsx / ServiceIcons.tsx** — Profil service API
- **Billing.tsx** — Facturation (BillingBalanceCards, BillingCostBreakdown, BillingHero, BillingInvoices, BillingPaymentMethods)
- **Usage.tsx** — Stats d'utilisation API
- **Logs.tsx** — Logs requêtes
- **Sandbox.tsx** — Tester les APIs (3 onglets)
- **RoutingEngine.tsx** — Visualisation graphe routier
- **Documentation.tsx** — Docs API
- **Notifications.tsx** — Centre de notifications

#### Agence
- **AgencyDashboard.tsx** — Tableau de bord agence
- **AgencyDeliveries.tsx** — Gestion livraisons
- **AgencyDrivers.tsx** — Gestion chauffeurs
- **AgencyMerchants.tsx** — Gestion marchands
- **AgencyFinances.tsx** — Finances et revenus
- **AgencyStatistics.tsx** — Statistiques détaillées
- **AgencySubscription.tsx** — Abonnement & plans
- **Settings.tsx** — Paramètres agence
  - ProfileTab.tsx — Infos agence
  - ZonesTab.tsx — Zones de livraison
  - HoursTab.tsx — Horaires d'ouverture
  - TeamTab.tsx — Gestion équipe
  - NotificationsTab.tsx — Préférences notifications

#### Client
- **ClientDashboard.tsx** — Tableau de bord client
- **ClientNewDelivery.tsx** — Créer une livraison
- **ClientDeliveryDetails.tsx** — Détail d'une livraison
- **AddressesPage.tsx** — Adresses favorites

#### Chauffeur
- **DriverView.tsx** — Vue principale chauffeur
- **DeliveryDashboard.tsx** — Dashboard livraisons
- **DriverDeliveries.tsx** — Liste livraisons
- **ActiveDelivery.tsx** — Livraison en cours (carte + navigation)
- **RequestsPanel.tsx** — Demandes de livraison entrantes
- **DriverEarnings.tsx** — Gains et historique

#### Marchand
- **MerchantDashboard.tsx** — Dashboard marchand
- **MerchantOrders.tsx** — Mes commandes
- **CreateOrder.tsx** — Nouvelle commande
- **MerchantLayout.tsx** — Layout partagé marchand

#### Admin
- **AdminUsers.tsx** — Gestion utilisateurs
- **AdminOrders.tsx** — Gestion commandes
- **AdminNotifications.tsx** — Notifications globales

### Composants Partagés

| Composant | Description |
|-----------|-------------|
| `PrivateRoute.tsx` | Guard de route par rôle |
| `DeliveryRequestPopup.tsx` | Popup nouvelle demande (driver) |
| `RatingModal.tsx` | Modal notation après livraison |
| `LocalMap.tsx` | Carte Leaflet locale |
| `ArmadaMap.tsx` | Carte intégration Armada |
| `StatusToggle.tsx` | Toggle statut chauffeur |
| `Avatar.tsx` | Avatar généré (DiceBear) |
| `Button.tsx` | Bouton stylisé réutilisable |
| `Skeleton.tsx` | Squelette de chargement |
| `SearchResults.tsx` | Résultats de recherche |
| `AddClientWithDeliveryModal.tsx` | Créer client + livraison en une étape |

---

## 6. Technologies Utilisées

### Frontend

| Technologie | Version | Rôle |
|-------------|---------|------|
| React | 19.0.0 | Framework UI |
| TypeScript | ~5.7.2 | Typage statique |
| Vite | 6.3.1 | Build tool & dev server |
| React Router | 7.13.1 | Navigation SPA |
| Redux Toolkit | 2.7.0 | State management |
| React Redux | 9.2.0 | Binding Redux-React |
| Axios | 1.8.4 | Client HTTP |
| Socket.io-client | 4.8.3 | WebSocket temps réel |
| React Leaflet | 5.0.0 | Cartes interactives |
| Leaflet | 1.9.4 | Moteur de carte |
| Recharts | 3.8.1 | Graphiques/statistiques |
| Framer Motion | 12.9.2 | Animations |
| Lottie React | 2.4.1 | Animations Lottie |
| Lucide React | 1.8.0 | Icônes |
| i18next | 26.0.2 | Internationalisation |
| react-i18next | 17.0.1 | Binding i18n-React |
| @dicebear/core | 9.2.4 | Génération d'avatars |
| SASS | 1.87.0 | Préprocesseur CSS |
| ESLint | 9.22.0 | Linting TypeScript |

### Backend

| Technologie | Version | Rôle |
|-------------|---------|------|
| Node.js | >=14.0.0 | Runtime |
| Express | 5.1.0 | Framework HTTP |
| MongoDB | — | Base de données |
| Mongoose | 8.14.0 | ODM MongoDB |
| bcryptjs | 3.0.2 | Hachage mots de passe |
| jsonwebtoken | 9.0.2 | Auth JWT |
| Socket.io | 4.8.3 | WebSocket |
| Axios | 1.11.0 | Client HTTP (inter-services) |
| Nodemailer | 8.0.5 | Envoi d'emails |
| python-shell | 5.0.0 | Intégration Python IA |
| localtunnel | 2.0.2 | Tunnel webhook (dev) |
| @ngrok/ngrok | 1.7.0 | Tunnel webhook (prod) |
| moment-timezone | 0.5.48 | Gestion fuseaux horaires |
| node-cache | 5.1.2 | Cache en mémoire |
| dotenv | 16.5.0 | Variables d'environnement |
| cors | 2.8.5 | Politique CORS |
| Jest | 29.5.0 | Tests unitaires |
| Supertest | 6.3.3 | Tests d'intégration API |
| Nodemon | 3.1.10 | Rechargement auto (dev) |

### Infrastructure & Services Externes

| Service | Rôle |
|---------|------|
| MongoDB Atlas | Hébergement base de données |
| Stripe | Paiements abonnements (optionnel) |
| Armada Delivery API | Intégration 3PL transporteur |
| GitHub Actions | CI/CD |
| Python (Core/) | Moteur IA routing & ETA |

---

## 7. Fonctionnalités par Rôle

### Admin (`role: admin`)
- Tableau de bord avec statistiques globales plateforme
- Gestion complète de tous les utilisateurs (CRUD, changement de rôle)
- Visualisation et modification de toutes les livraisons
- Envoi de notifications ciblées ou broadcast global
- Impersonation d'un utilisateur (connexion en tant que)
- Configuration des paramètres API par utilisateur

### Super Admin (`role: super_admin`)
- Toutes les capacités Admin
- Accès aux routes `/super-admin` pour la gestion de la plateforme au niveau système

### Agency Admin (`role: agency_admin`)
- Inscription et configuration de son agence
- Gestion des chauffeurs (invitations, activation, suppression)
- Gestion des clients (invitations, création avec livraison)
- Création et assignation de livraisons à ses chauffeurs
- Gestion des marchands et de leurs commissions
- Statistiques et données financières de l'agence
- Configuration des zones de livraison et tarifs
- Configuration des horaires d'ouverture
- Gestion de l'équipe et des permissions
- Gestion de l'abonnement (upgrade, downgrade, annulation)
- Accès aux clés API (plan pro)

### Driver (`role: driver`)
- Voir les livraisons disponibles à proximité
- Accepter ou rejeter des demandes de livraison
- Mettre à jour le statut des livraisons en temps réel
- Envoyer sa position GPS en continu
- Gérer son statut de disponibilité
- Consulter ses gains et historique de revenus
- Gérer ses colis (parcels)

### Client (`role: user`)
- Créer des demandes de livraison avec estimation de prix
- Suivre ses livraisons en temps réel sur carte
- Consulter l'historique de ses livraisons
- Gérer ses adresses favorites
- Recevoir des notifications de mise à jour
- Noter les livraisons effectuées
- Accéder au suivi public par code de tracking

### Merchant (`role: merchant`)
- Créer des commandes de livraison pour ses clients
- Suivre l'état de toutes ses commandes
- Voir ses statistiques de ventes et commissions
- Accéder à son profil marchand
- Intégration avec le système Armada Delivery

### Developer (`role: developer`)
- Créer et gérer des clés API
- Tester les endpoints via le Sandbox
- Suivre sa consommation de crédits en temps réel
- Consulter les logs détaillés de chaque requête API
- Acheter des packs de crédits supplémentaires
- Accéder à la documentation API
- Visualiser les performances du modèle IA (ETA, routing)

---

## 8. Flux Complet d'une Commande de A à Z

```
┌────────────────────────────────────────────────────────────────────┐
│  CRÉATION DE LA COMMANDE                                           │
│                                                                    │
│  1. Client / Agency Admin / Merchant                               │
│     → POST /api/v1/deliveries/estimate                             │
│       (adresse pickup + dropoff → prix estimé + ETA)              │
│     → POST /api/v1/deliveries                                      │
│       (crée Delivery avec clientStatus: "broadcasting")            │
│     → Un trackingCode unique est généré                            │
│     → Un clientAccessCode est généré (pour suivi sécurisé)        │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  BROADCAST AUX CHAUFFEURS                                          │
│                                                                    │
│  2. Le serveur diffuse la demande via Socket.io                    │
│     à tous les drivers disponibles de l'agence                    │
│     → broadcastedAt + broadcastExpiresAt enregistrés              │
│     → Notification temps réel sur app driver                      │
│     → DeliveryRequestPopup s'affiche côté driver                  │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
             DRIVER ACCEPTE         DRIVER REJETTE
             PUT /:id/accept        POST /:id/reject
             clientStatus           → rejectedBy[] mis à jour
             → "accepted"           → re-broadcast autre driver
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────┐
│  EN ROUTE VERS LE PICKUP                                           │
│                                                                    │
│  3. Driver → PUT /driver/deliveries/:id/status                     │
│     status: "going_to_pickup"                                      │
│     → Client notifié en temps réel (Socket.io)                    │
│     → Driver envoie sa position GPS toutes les N secondes          │
│       PUT /driver/deliveries/:id/location { lat, lng }            │
│     → gps_trace[] mis à jour en continu                           │
│     → lastLat/lastLng mis à jour pour la carte                    │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  RAMASSAGE (PICKUP)                                                │
│                                                                    │
│  4. Driver → PUT /driver/deliveries/:id/status                     │
│     status: "picked_up"                                            │
│     clientStatus: "picked_up"                                      │
│     → Notification client : "Votre colis a été pris en charge"    │
│     → Chronomètre de l'ETA démarre (AI engine)                    │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│  EN TRANSIT (LIVRAISON)                                            │
│                                                                    │
│  5. Driver → PUT /driver/deliveries/:id/status                     │
│     status: "on_the_way" / clientStatus: "in_transit"             │
│     → Position GPS continue                                        │
│     → ETA recalculé en temps réel (POST /api/v1/eta)              │
│     → Carte client mise à jour en direct                          │
│                                                                    │
│  Client peut suivre via :                                          │
│     • App : /client/deliveries/:id                                 │
│     • Lien public : /track/:trackingCode                           │
│       → GET /api/v1/track/:code                                    │
│       → Vérification code : POST /api/v1/track/verify             │
└──────────────────────────────┬─────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
            LIVRAISON RÉUSSIE      LIVRAISON ÉCHOUÉE
            status: "delivered"    status: "failed"
            clientStatus:          clientStatus: "cancelled"
            "delivered"
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────┐
│  FINALISATION                                                      │
│                                                                    │
│  6. completed_at enregistré                                        │
│     actual_time_seconds calculé (durée réelle)                    │
│     Gains driver mis à jour (earningsController)                  │
│     Stats marchand mis à jour (totalOrders, totalRevenue)         │
│     Usage agence incrémenté (deliveriesThisMonth)                 │
│     Agency crédits API déductés si applicable                     │
│                                                                    │
│  7. Notification client : "Livraison effectuée"                   │
│     → Modal notation apparaît côté client (RatingModal)           │
│     → POST /api/v1/ratings { stars, comment }                     │
│     → Rating enregistré, stats driver mis à jour                  │
│                                                                    │
│  8. Si intégration Armada :                                        │
│     → Webhook reçu : POST /webhook/armada                         │
│     → armadaStatus + armadaTrackingUrl mis à jour                 │
│     → Synchro via armadaService                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Statuts de livraison

```
clientStatus (vue client) :
broadcasting → pending → accepted → picked_up → in_transit → delivered
                                                            └→ cancelled

status (vue driver/interne) :
going_to_pickup → picked_up → on_the_way → delivered
                                         └→ failed
```

---

## Variables d'Environnement (.env.example)

```env
# Base de données
MONGO_USER=etijahat
MONGO_PASS=changeme
MONGO_URI=mongodb://localhost:27017/armada-orders
MONGODB_URI=mongodb://etijahat:changeme@mongodb:27017/etijahat?authSource=admin

# Auth
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d

# Paiements (optionnel)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Transporteur externe
ARMADA_BASE_URL=https://sandbox.api.armadadelivery.com
ARMADA_API_KEY=your_armada_api_key_here

# Serveurs
PORT=3000
VITE_API_URL=http://localhost/api/v1
FRONTEND_PORT=80
```

---

*Généré automatiquement par Claude Code — Etijahat-secondcopy*
