# Architecture MVC — Eetijahet Frontend

## Structure des dossiers

```
frontend/src/
│
├── models/                    ← M — Types TypeScript (source de vérité)
│   └── index.ts               # Toutes les interfaces : User, Delivery, Agency...
│
├── views/                     ← V — Composants React (UI uniquement)
│   ├── pages/
│   │   ├── public/            # Home, Products, Pricing, Blog, Track...
│   │   ├── auth/              # Login, Signup, Register, ForgotPassword...
│   │   ├── dashboard/         # Dashboard développeur
│   │   ├── agency/            # AgencyDashboard, Drivers, Merchants...
│   │   ├── driver/            # DriverView, ActiveDelivery, Earnings...
│   │   ├── client/            # ClientDashboard, NewDelivery, Addresses...
│   │   ├── merchant/          # MerchantDashboard, Orders, CreateOrder...
│   │   ├── admin/             # AdminUsers, AdminOrders...
│   │   └── developer/         # APIKeys, Usage, Logs, Sandbox...
│   ├── layouts/               # Layouts partagés (MainLayout, DashboardLayout...)
│   └── components/
│       ├── ui/                # Boutons, Inputs, Modals, Skeletons...
│       ├── shared/            # PrivateRoute, Avatar, StatusToggle...
│       ├── forms/             # Formulaires réutilisables
│       ├── maps/              # LocalMap, ArmadaMap
│       └── charts/            # Graphiques Recharts
│
├── controllers/               ← C — Logique métier (pont Views ↔ Services)
│   ├── auth.controller.ts     # Login, logout, signup, profile
│   ├── delivery.controller.ts # Créer, annuler, assigner livraisons
│   ├── agency.controller.ts   # Gérer agence, drivers, stats
│   ├── driver.controller.ts   # Accepter, rejeter, GPS tracking
│   └── merchant.controller.ts # Commandes marchands
│
├── services/                  # Communication externe
│   ├── api/
│   │   ├── http.service.ts    # Axios instance + interceptors
│   │   ├── auth.service.ts    # Appels API auth
│   │   ├── delivery.service.ts# Appels API livraisons
│   │   ├── agency.service.ts  # Appels API agences
│   │   └── ...
│   └── socket/
│       └── socket.service.ts  # Socket.io temps réel
│
├── store/                     # Redux state management
│   ├── index.ts               # Store configuration
│   ├── slices/
│   │   ├── auth.slice.ts      # État authentification
│   │   ├── delivery.slice.ts  # État livraisons
│   │   └── notification.slice.ts
│   └── middleware/
│
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts             # Hook auth (login, logout, user)
│   ├── useDelivery.ts         # Hook livraisons
│   ├── useSocket.ts           # Hook Socket.io
│   └── useAgency.ts           # Hook agence
│
├── utils/                     # Fonctions utilitaires pures
│   ├── formatters.ts          # Dates, prix, distances
│   ├── validators.ts          # Validation formulaires
│   └── constants.ts           # Constantes app
│
├── types/                     # Types additionnels TS
├── i18n/                      # Internationalisation AR/EN
├── styles/                    # SCSS global
└── assets/                    # Images, icônes
```

## Principe MVC appliqué

```
         USER ACTION
              │
              ▼
    ┌─────────────────┐
    │   VIEW (React)  │  ← Affiche les données, capture les événements
    └────────┬────────┘
             │ appelle
             ▼
    ┌─────────────────┐
    │  CONTROLLER     │  ← Contient la logique métier
    │  (hook/thunk)   │     Valide, transforme, orchestre
    └────────┬────────┘
             │ utilise
             ▼
    ┌─────────────────┐
    │   SERVICE       │  ← HTTP / Socket calls
    └────────┬────────┘
             │ retourne
             ▼
    ┌─────────────────┐
    │   STORE/MODEL   │  ← État global Redux + Types TS
    └─────────────────┘
             │ re-render
             ▼
    ┌─────────────────┐
    │   VIEW (React)  │  ← Se met à jour automatiquement
    └─────────────────┘
```

## Règles d'architecture

1. **Views** ne font jamais d'appels HTTP directement → passent par les Controllers
2. **Controllers** ne contiennent jamais de JSX → logique pure
3. **Services** ne connaissent pas le Store Redux → retournent des données brutes
4. **Models** ne contiennent que des types/interfaces → pas de logique
5. **Hooks** encapsulent Controller + Store → interface simple pour les Views
